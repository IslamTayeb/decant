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
  computeContextPreview,
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
  writeDebugLog,
  appendTrace,
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
      view_context: tool({
        description:
          "View the current context blobs, fidelity settings, and token usage",
        args: {},
        async execute(_args, toolCtx) {
          toolCtx.metadata({ title: "View context" });
          return JSON.stringify(
            await currentMapToolView(toolCtx.sessionID),
            null,
            2,
          );
        },
      }),
      set_fidelity: tool({
        description:
          "Set how much detail to keep for a blob (full, summary, placeholder, hide)",
        args: {
          blob_id: tool.schema.string().describe("Blob ID (snake_case label)"),
          fidelity: tool.schema
            .enum(["full", "summary", "placeholder", "drop"])
            .describe(
              "Detail level: full (keep everything), summary (one-line per message), placeholder (short stub), hide (remove from context)",
            ),
          force_user_override: tool.schema
            .boolean()
            .optional()
            .describe("Override a user-set fidelity (use only if user asks)"),
        },
        async execute(args, toolCtx) {
          toolCtx.metadata({
            title: `Set fidelity: ${args.blob_id} → ${args.fidelity === "drop" ? "hide" : args.fidelity}`,
          });
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
      session_lookup: tool({
        description: "Search past sessions by keyword",
        args: {
          query: tool.schema
            .string()
            .describe("Search text to match against session titles and blobs"),
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
              hint:
                sessions.length > 0
                  ? "Use session_detail in a sub-agent (Task tool) for deeper investigation."
                  : "No matching sessions found.",
              sessions,
            },
            null,
            2,
          );
        },
      }),
      session_detail: tool({
        description: "Get detailed content from a past session blob",
        args: {
          session_id: tool.schema.string().describe("Session ID to look up"),
          blob_id: tool.schema.string().describe("Blob ID within that session"),
          detail: tool.schema
            .enum(["summary", "full"])
            .describe(
              "Detail level: summary (compressed overview) or full (complete messages)",
            ),
        },
        async execute(args, toolCtx) {
          toolCtx.metadata({
            title: `Session detail: ${args.blob_id}`,
          });
          const { map } = await ensureHistoricalMap(args.session_id);
          const messages =
            args.detail === "full"
              ? await getMessages(args.session_id)
              : undefined;
          return JSON.stringify(
            {
              session_id: args.session_id,
              blob_id: args.blob_id,
              detail: args.detail,
              content: buildSessionZoomText({
                map,
                blobID: args.blob_id,
                fidelity: args.detail === "full" ? "full" : "compressed",
                messages,
              }),
            },
            null,
            2,
          );
        },
      }),
      blame_lookup: tool({
        description:
          "Find which session produced a specific line of code (via git blame)",
        args: {
          file: tool.schema
            .string()
            .describe("File path relative to the project root"),
          line: tool.schema
            .number()
            .int()
            .min(1)
            .describe("Line number (1-indexed)"),
        },
        async execute(args, toolCtx) {
          toolCtx.metadata({
            title: `Blame: ${args.file}:${args.line}`,
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
      const guidance = buildPluginGuidanceSystemPrompt(map);
      const annotation = buildAnnotationSystemPrompt(map);
      output.system.unshift(guidance);
      output.system.unshift(annotation);

      await appendTrace(input.sessionID, "system.transform", {
        blob_count: map.blobOrder.length,
        total_tokens: map.totalTokenEstimate,
        guidance_length: guidance.length,
        annotation_prompt_length: annotation.length,
        guidance_preview: guidance.slice(0, 300),
      });
    },
    "experimental.chat.messages.transform": async (_input, output) => {
      const sessionID = resolveSessionID(output.messages as MessageLike[]);
      if (!sessionID) return;
      if (await isChildSession(sessionID)) return;
      const beforeCount = output.messages.length;
      const currentMessages = sortMessagesChronologically(
        output.messages as MessageLike[],
      );
      const map =
        (await persistCoverage(sessionID, currentMessages)) ??
        (await getMap(sessionID));

      // Snapshot blob fidelities before transform
      const blobFidelities = Object.fromEntries(
        map.blobOrder.map((id) => [id, map.blobs[id]?.fidelity]),
      );

      output.messages = transformMessagesForContext(
        output.messages as MessageLike[],
        map,
      ) as never;
      await writeContextMap(map);

      const afterCount = output.messages.length;
      await appendTrace(sessionID, "messages.transform", {
        before_count: beforeCount,
        after_count: afterCount,
        messages_removed: beforeCount - afterCount,
        blob_fidelities: blobFidelities,
        surviving_messages: (output.messages as MessageLike[]).map((m) => ({
          id: m.info.id,
          role: m.info.role,
          text_length: m.parts
            .filter((p) => p.type === "text")
            .reduce((s, p) => s + (p.text?.length ?? 0), 0),
          is_stub:
            m.parts.some((p) => p.type === "text" && p.text?.startsWith("[")) ??
            false,
        })),
      });
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
      const preview = computeContextPreview(map);
      await writeDebugLog(map, preview).catch(() => undefined);

      await appendTrace(input.sessionID, "text.complete", {
        had_annotation: !!parsed.annotation,
        annotation_blob: parsed.annotation?.current?.blob,
        annotation_is_new_blob: parsed.annotation?.current?.is_new_blob,
        annotation_summary: parsed.annotation?.current?.message_summary?.slice(
          0,
          100,
        ),
        retroactive_count: parsed.annotation?.retroactive?.length ?? 0,
        fallback_used: !parsed.annotation,
        blob_count: map.blobOrder.length,
        total_tokens: map.totalTokenEstimate,
        effective_tokens: preview.totalEffective,
      });
    },
    "experimental.session.compacting": async (input, output) => {
      const map = await getMap(input.sessionID);
      const prompt = buildCompactionPrompt(map);
      output.prompt = prompt;

      await appendTrace(input.sessionID, "session.compacting", {
        blob_count: map.blobOrder.length,
        blob_policies: map.blobOrder.map((id) => ({
          id,
          label: map.blobs[id]?.label,
          fidelity: map.blobs[id]?.fidelity,
          source: map.blobs[id]?.fidelitySource,
          tokens: map.blobs[id]?.tokenEstimate,
        })),
        prompt_length: prompt.length,
        prompt_preview: prompt.slice(0, 500),
      });
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
