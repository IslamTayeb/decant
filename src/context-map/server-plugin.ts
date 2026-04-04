import fs from "node:fs/promises";

import type { Plugin, PluginModule } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin/tool";

import {
  applyAnnotationEnvelope,
  buildAnnotationSystemPrompt,
  buildCompactionPrompt,
  buildContextMapToolView,
  buildHistoricalOverview,
  buildPluginGuidanceSystemPrompt,
  buildSessionZoomText,
  capturePendingRetroactiveMessage,
  mergeContextMaps,
  matchBlobIDsForQuery,
  parseAnnotationBlock,
  sortMessagesChronologically,
  transformMessagesForContext,
  updateBlobFidelity,
} from "./core";
import { ensureContextMapGitHook } from "./git";
import {
  ensureContextMapRoot,
  readCommitMap,
  readContextMap,
  sessionMapPath,
  writeContextMap,
} from "./storage";
import { buildFallbackMapFromMessages } from "./core";
import type {
  HistoricalSessionOverview,
  MessageLike,
  SessionLike,
} from "./types";

const PLUGIN_ID = "mem-mould.context-map";

const server: Plugin = async (ctx) => {
  await ensureContextMapRoot().catch(() => undefined);
  if (process.env.MEM_MOULD_DISABLE_GIT_HOOK_INSTALL !== "1") {
    await ensureContextMapGitHook({
      $: ctx.$ as never,
      worktree: ctx.worktree,
      directory: ctx.directory,
    }).catch(() => undefined);
  }

  const childSessionCache = new Map<string, boolean>();

  async function responseData<Value>(
    promise: Promise<unknown>,
  ): Promise<Value> {
    const value = (await promise) as { data?: Value };
    return (value?.data ?? value) as Value;
  }

  async function getSession(sessionID: string) {
    return responseData<SessionLike>(
      ctx.client.session.get({
        path: { id: sessionID },
        query: { directory: ctx.directory },
      } as never),
    );
  }

  async function listSessions() {
    return responseData<SessionLike[]>(
      ctx.client.session.list({ query: { directory: ctx.directory } } as never),
    );
  }

  async function getMessages(sessionID: string, limit = 5000) {
    const rows = await responseData<MessageLike[]>(
      ctx.client.session.messages({
        path: { id: sessionID },
        query: { directory: ctx.directory, limit },
      } as never),
    );
    return sortMessagesChronologically(rows);
  }

  function findMessageForToolCall(messages: MessageLike[], callID: string) {
    return [...messages]
      .reverse()
      .find((message) =>
        message.parts.some(
          (part) => part.type === "tool" && part.callID === callID,
        ),
      );
  }

  async function getMap(sessionID: string, directory?: string) {
    return readContextMap({
      sessionID,
      directory: directory ?? ctx.directory,
      worktree: ctx.worktree,
    });
  }

  async function ensureHistoricalMap(sessionID: string) {
    const session = await getSession(sessionID);
    let map = await getMap(sessionID, session.directory);
    if (map.blobOrder.length > 0 || Object.keys(map.messages).length > 0)
      return { session, map };
    const messages = await getMessages(sessionID);
    if (messages.length === 0) return { session, map };
    map = buildFallbackMapFromMessages({
      sessionID,
      directory: session.directory,
      worktree: ctx.worktree,
      messages,
    });
    await writeContextMap(map);
    return { session, map };
  }

  async function isChildSession(sessionID: string) {
    if (childSessionCache.has(sessionID))
      return childSessionCache.get(sessionID)!;
    const session = await getSession(sessionID).catch(() => undefined);
    const child = Boolean(session && "parentID" in session && session.parentID);
    childSessionCache.set(sessionID, child);
    return child;
  }

  async function persistCoverage(sessionID: string, messages: MessageLike[]) {
    if (!sessionID || messages.length === 0) return undefined;
    const map = await getMap(sessionID);
    const next = mergeContextMaps(
      map,
      buildFallbackMapFromMessages({
        sessionID,
        directory: ctx.directory,
        worktree: ctx.worktree,
        messages,
      }),
    );
    await writeContextMap(next);
    return next;
  }

  async function currentMapToolView(sessionID: string) {
    const messages = await getMessages(sessionID);
    const map =
      (await persistCoverage(sessionID, messages)) ?? (await getMap(sessionID));
    return buildContextMapToolView(map);
  }

  async function sessionLookup(query: string, limit: number) {
    const sessions = await listSessions();
    const lowered = query.trim().toLowerCase();
    const results: HistoricalSessionOverview[] = [];

    for (const session of sessions) {
      if (results.length >= limit) break;
      const titleMatch = (session.title ?? "").toLowerCase().includes(lowered);
      const hasMapFile = await fs
        .access(sessionMapPath(session.id))
        .then(() => true)
        .catch(() => false);

      if (!titleMatch && !hasMapFile) continue;

      const { map } = await ensureHistoricalMap(session.id);
      const matchedBlobIDs = titleMatch ? [] : matchBlobIDsForQuery(map, query);
      if (!titleMatch && matchedBlobIDs.length === 0) continue;
      results.push(buildHistoricalOverview({ map, session, matchedBlobIDs }));
    }

    return results;
  }

  async function blameLookup(file: string, line: number) {
    const blame = await ctx.$.cwd(
      ctx.worktree,
    ).nothrow()`git blame -L ${line},${line} -- ${file}`
      .quiet()
      .text();
    const commitHash = blame.trim().split(/\s+/)[0];
    if (!commitHash) {
      return {
        commit_hash: undefined,
        mapped: false,
        error: `Could not resolve git blame for ${file}:${line}`,
      };
    }

    const commits = await readCommitMap();
    const entry = commits.entries[commitHash];
    if (!entry) {
      return {
        commit_hash: commitHash,
        mapped: false,
        error: `No session mapping found for commit ${commitHash}.`,
      };
    }

    const { session, map } = await ensureHistoricalMap(entry.sessionID);
    return {
      commit_hash: commitHash,
      mapped: true,
      session_id: entry.sessionID,
      active_blob_id: entry.activeBlobID,
      active_blob_label: entry.activeBlobLabel,
      overview: buildHistoricalOverview({
        map,
        session,
        commitEntry: entry,
        matchedBlobIDs: entry.activeBlobID ? [entry.activeBlobID] : [],
      }),
    };
  }

  async function applyMapFidelity(input: {
    sessionID: string;
    blobID: string;
    fidelity: Parameters<typeof updateBlobFidelity>[0]["fidelity"];
    source: Parameters<typeof updateBlobFidelity>[0]["source"];
    force?: boolean;
  }) {
    const map = await getMap(input.sessionID);
    const result = updateBlobFidelity({
      map,
      blobID: input.blobID,
      fidelity: input.fidelity,
      source: input.source,
      force: input.force,
    });
    if (result.ok) await writeContextMap(map);
    return { map, result };
  }

  return {
    tool: {
      context_map: tool({
        description: "Inspect the current context map and user controls",
        args: {},
        async execute(_args, toolCtx) {
          toolCtx.metadata({ title: "Context map" });
          return JSON.stringify(
            await currentMapToolView(toolCtx.sessionID),
            null,
            2,
          );
        },
      }),
      compress_blob: tool({
        description: "Set a blob fidelity level while respecting user control",
        args: {
          blob_id: tool.schema.string().describe("Blob ID to update"),
          fidelity: tool.schema
            .enum(["full", "summary", "compressed", "placeholder", "drop"])
            .describe("Target fidelity level"),
          force_user_override: tool.schema
            .boolean()
            .optional()
            .describe("Override an explicit user-set fidelity choice"),
        },
        async execute(args, toolCtx) {
          toolCtx.metadata({ title: `Set blob fidelity: ${args.blob_id}` });
          const { result, map } = await applyMapFidelity({
            sessionID: toolCtx.sessionID,
            blobID: args.blob_id,
            fidelity: args.fidelity,
            source: "agent",
            force: args.force_user_override,
          });
          return JSON.stringify(
            {
              ok: result.ok,
              message: result.message,
              user_controls_are_authoritative: true,
              blob: map.blobs[args.blob_id],
            },
            null,
            2,
          );
        },
      }),
      drop_blob: tool({
        description: "Drop a blob from the active context map",
        args: {
          blob_id: tool.schema.string().describe("Blob ID to drop"),
          force_user_override: tool.schema
            .boolean()
            .optional()
            .describe("Override an explicit user-set fidelity choice"),
        },
        async execute(args, toolCtx) {
          toolCtx.metadata({ title: `Drop blob: ${args.blob_id}` });
          const { result, map } = await applyMapFidelity({
            sessionID: toolCtx.sessionID,
            blobID: args.blob_id,
            fidelity: "drop",
            source: "agent",
            force: args.force_user_override,
          });
          return JSON.stringify(
            {
              ok: result.ok,
              message: result.message,
              blob: map.blobs[args.blob_id],
            },
            null,
            2,
          );
        },
      }),
      session_lookup: tool({
        description:
          "Search historical sessions that already have context maps",
        args: {
          query: tool.schema
            .string()
            .describe("Search text for matching sessions or blobs"),
          limit: tool.schema
            .number()
            .int()
            .min(1)
            .max(10)
            .optional()
            .describe("Max sessions to return"),
        },
        async execute(args, toolCtx) {
          toolCtx.metadata({ title: `Session lookup: ${args.query}` });
          const sessions = await sessionLookup(args.query, args.limit ?? 5);
          return JSON.stringify(
            {
              query: args.query,
              guidance:
                "Spawn a sub-agent and use session_zoom in that sub-agent for detailed investigation.",
              sessions,
            },
            null,
            2,
          );
        },
      }),
      session_zoom: tool({
        description:
          "Zoom into a historical session blob at compressed or full fidelity",
        args: {
          session_id: tool.schema.string().describe("Historical session ID"),
          blob_id: tool.schema.string().describe("Blob ID to inspect"),
          fidelity: tool.schema
            .enum(["compressed", "full"])
            .describe("Zoom level to retrieve"),
        },
        async execute(args, toolCtx) {
          toolCtx.metadata({ title: `Session zoom: ${args.blob_id}` });
          const { map } = await ensureHistoricalMap(args.session_id);
          const messages =
            args.fidelity === "full"
              ? await getMessages(args.session_id)
              : undefined;
          return JSON.stringify(
            {
              session_id: args.session_id,
              blob_id: args.blob_id,
              fidelity: args.fidelity,
              content: buildSessionZoomText({
                map,
                blobID: args.blob_id,
                fidelity: args.fidelity,
                messages,
              }),
            },
            null,
            2,
          );
        },
      }),
      blame_lookup: tool({
        description: "Map a blamed file line to a historical context map",
        args: {
          file: tool.schema
            .string()
            .describe("Path to the file within the current worktree"),
          line: tool.schema
            .number()
            .int()
            .min(1)
            .describe("1-indexed line number to blame"),
        },
        async execute(args, toolCtx) {
          toolCtx.metadata({
            title: `Blame lookup: ${args.file}:${args.line}`,
          });
          return JSON.stringify(
            await blameLookup(args.file, args.line),
            null,
            2,
          );
        },
      }),
    },
    "shell.env": async (input, output) => {
      if (!input.sessionID) return;
      output.env.OPENCODE_SESSION_ID = input.sessionID;
    },
    "tool.execute.after": async (input) => {
      if (await isChildSession(input.sessionID)) return;
      const messages = await getMessages(input.sessionID);
      const toolMessage = findMessageForToolCall(messages, input.callID);
      if (!toolMessage || toolMessage.info.role !== "assistant") return;

      const fallback = buildFallbackMapFromMessages({
        sessionID: input.sessionID,
        directory: ctx.directory,
        worktree: ctx.worktree,
        messages,
      });
      const suggestedBlobID = fallback.messages[toolMessage.info.id]?.blobID;
      const currentMap = await getMap(input.sessionID);
      const map = capturePendingRetroactiveMessage({
        map: mergeContextMaps(currentMap, fallback),
        messages,
        messageID: toolMessage.info.id,
        suggestedBlobID,
      });
      await writeContextMap(map);
    },
    "experimental.chat.system.transform": async (input, output) => {
      if (!input.sessionID) return;
      const map = await getMap(input.sessionID);
      const child = await isChildSession(input.sessionID);
      if (child) {
        output.system.unshift(
          "This is a sub-agent session. Do not build a context map for this session. Keep the investigation focused and use session_zoom for historical details when needed.",
        );
        return;
      }
      output.system.unshift(buildPluginGuidanceSystemPrompt(map));
      output.system.unshift(buildAnnotationSystemPrompt(map));
    },
    "experimental.chat.messages.transform": async (_input, output) => {
      const sessionID = resolveSessionID(output.messages as MessageLike[]);
      if (!sessionID) return;
      if (await isChildSession(sessionID)) return;
      const currentMessages = sortMessagesChronologically(
        output.messages as MessageLike[],
      );
      const map =
        (await persistCoverage(sessionID, currentMessages)) ??
        (await getMap(sessionID));
      output.messages = transformMessagesForContext(
        output.messages as MessageLike[],
        map,
      ) as never;
      await writeContextMap(map);
    },
    "experimental.text.complete": async (input, output) => {
      if (await isChildSession(input.sessionID)) return;
      const parsed = parseAnnotationBlock(output.text);
      output.text = parsed.cleanText;
      const messages = await getMessages(input.sessionID);
      let map = await getMap(input.sessionID);
      if (parsed.annotation) {
        map = applyAnnotationEnvelope({
          map,
          messages,
          assistantMessageID: input.messageID,
          annotation: parsed.annotation,
        });
      } else {
        map = mergeContextMaps(
          map,
          buildFallbackMapFromMessages({
            sessionID: input.sessionID,
            directory: ctx.directory,
            worktree: ctx.worktree,
            messages,
          }),
        );
      }
      await writeContextMap(map);
    },
    "experimental.session.compacting": async (input, output) => {
      const map = await getMap(input.sessionID);
      output.prompt = buildCompactionPrompt(map);
    },
  };
};

function resolveSessionID(messages: MessageLike[]) {
  const last = messages[messages.length - 1];
  if (!last) return undefined;
  const info = last.info as {
    sessionID?: string;
    metadata?: { sessionID?: string };
  };
  return info.sessionID ?? info.metadata?.sessionID;
}

const plugin: PluginModule = {
  id: PLUGIN_ID,
  server,
};

export default plugin;
