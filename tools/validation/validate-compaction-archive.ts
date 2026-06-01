import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { createOpencodeClient } from "@opencode-ai/sdk/v2";

import { parseModelSlug, requiredModelSlug, type ModelRef } from "../model";
import {
  createSession as createOpenCodeSession,
  dataOrThrow,
  listProviders,
  listSessionMessages as listOpenCodeSessionMessages,
} from "../opencode-sdk";

type SessionMessage = {
  info?: {
    id?: string;
    role?: string;
    finish?: string;
  };
  role?: string;
  parts?: Array<{
    type: string;
    text?: string;
    tool?: string;
    state?: { status?: string; input?: unknown; output?: unknown };
  }>;
};

type ArchiveFile = {
  map?: {
    topicOrder?: string[];
    topics?: Record<string, { messageIDs?: string[] }>;
  };
};

const validationModelSlug = requiredModelSlug();
const exactFlag = "FLAG_ARCHIVE_ZOOM_7Q2";

async function main() {
  const repoRoot = path.resolve(process.cwd());
  const providedTempRoot = process.env.DECANT_E2E_TEMP_ROOT;
  const tempRoot =
    providedTempRoot ??
    (await fs.mkdtemp(path.join(os.tmpdir(), "decant-archive-")));
  if (providedTempRoot) await fs.mkdir(tempRoot, { recursive: true });
  const home = path.join(tempRoot, "home");
  const data = path.join(tempRoot, "data");
  const config = path.join(tempRoot, "config");
  const state = path.join(tempRoot, "state");
  const cache = path.join(tempRoot, "cache");
  await Promise.all(
    [home, data, config, state, cache].map((dir) =>
      fs.mkdir(dir, { recursive: true }),
    ),
  );

  const pluginSpec = pathToFileURL(
    path.join(repoRoot, "src/server-plugin.ts"),
  ).href;
  const env = {
    ...process.env,
    HOME: home,
    XDG_DATA_HOME: data,
    XDG_CONFIG_HOME: config,
    XDG_STATE_HOME: state,
    XDG_CACHE_HOME: cache,
    OPENCODE_DB: path.join(tempRoot, "opencode.sqlite"),
    OPENCODE_DISABLE_PROJECT_CONFIG: "1",
    DECANT_DISABLE_GIT_HOOK_INSTALL: "1",
    DECANT_TASK_BOUNDARY: "1",
    OPENCODE_CONFIG_CONTENT: JSON.stringify({
      $schema: "https://opencode.ai/config.json",
      model: validationModelSlug,
      plugin: [pluginSpec],
    }),
  };

  const server = await startServer(env, repoRoot);
  let passed = false;
  try {
    const client = createOpencodeClient({ baseUrl: server.url });
    const model = await pickModel(client, repoRoot, validationModelSlug);
    console.log(`Using selected model ${model.providerID}/${model.modelID}`);

    const sessionID = await createSession(
      client,
      repoRoot,
      "compaction archive zoom validation",
    );
    await prompt(
      client,
      repoRoot,
      sessionID,
      [
        "We are recording an old auth design decision for a later compaction test.",
        `Exact flag: ${exactFlag}.`,
        "Accepted design: per-tenant queue with lime-copper guard ZM-42.",
        "Rejected design: global mutex after violet rollback VK-19.",
        "Why: marker LANTERN-882 preserves tenant isolation while retries proceed independently.",
        "Do not edit files. Reply briefly while preserving these exact strings.",
      ].join("\n"),
      "Reply briefly. Do not call tools. Preserve exact identifiers.",
      {},
    );
    await prompt(
      client,
      repoRoot,
      sessionID,
      "Switch to unrelated current work: CSV parser whitespace trimming. Reply with one sentence and do not mention the old auth decision.",
      "Reply briefly. Do not call tools.",
      {},
    );

    await forceCompaction(client, repoRoot, sessionID, model);
    const mapPath = path.join(home, ".opencode", "context-maps", `${sessionID}.json`);
    const compactedMap = await waitForCompactionArchivePath(mapPath);
    const archive = JSON.parse(
      await fs.readFile(compactedMap.compaction.archivePath, "utf8"),
    ) as ArchiveFile;
    const messages = await listSessionMessages(client, repoRoot, sessionID);
    const messagesByID = new Map(messages.map((message) => [message.info?.id, message]));
    const archivedTopicID = archive.map?.topicOrder?.find((topicID) =>
      archive.map?.topics?.[topicID]?.messageIDs?.some((messageID) =>
        messageText(messagesByID.get(messageID)).includes(exactFlag),
      ),
    );
    assert.ok(
      archivedTopicID,
      "compaction archive did not retain the exact old fact topic",
    );

    await prompt(
      client,
      repoRoot,
      sessionID,
      "Call view_context exactly once, then answer with only ok.",
      "You must call view_context exactly once before answering. Avoid unrelated tools.",
      { view_context: true },
    );
    const viewCall = latestToolCall(
      await sessionToolCalls(client, repoRoot, sessionID),
      "view_context",
    );
    const viewOutput = parseToolOutput(viewCall);
    assert.equal(
      viewOutput.compacted_archive?.available,
      true,
      "view_context did not expose compacted_archive.available=true",
    );
    assert.ok(
      Array.isArray(viewOutput.compacted_archive?.topics) &&
        viewOutput.compacted_archive.topics.some(
          (topic: { id?: string }) => topic.id === archivedTopicID,
        ),
      "view_context did not list the archived topic",
    );

    const detailReply = await prompt(
      client,
      repoRoot,
      sessionID,
      `Call session_detail exactly once with session_id ${sessionID}, topic_id ${archivedTopicID}, and detail full. Then answer with the exact flag value only.`,
      "You must call session_detail exactly once before answering. Avoid unrelated tools.",
      { session_detail: true },
    );
    const detailCall = latestToolCall(
      await sessionToolCalls(client, repoRoot, sessionID),
      "session_detail",
    );
    const detailOutput = parseToolOutput(detailCall);
    assert.equal(
      detailOutput.source,
      "compaction_archive",
      "session_detail did not resolve through the compaction archive",
    );
    assert.match(
      String(detailOutput.content ?? ""),
      new RegExp(exactFlag),
      "session_detail archive content did not include the exact old flag",
    );
    assert.match(
      messageText(detailReply),
      new RegExp(exactFlag),
      "assistant did not recover the exact old flag from the archive detail",
    );

    passed = true;
    console.log("Compaction archive validation passed");
  } finally {
    await server.close();
    if (
      passed &&
      !providedTempRoot &&
      process.env.DECANT_KEEP_E2E_TEMP !== "1"
    ) {
      await fs.rm(tempRoot, { recursive: true, force: true });
    } else {
      console.error(`Preserved E2E temp root: ${tempRoot}`);
    }
  }
}

async function startServer(env: NodeJS.ProcessEnv, cwd: string) {
  const proc = spawn(
    "opencode",
    ["serve", "--hostname=127.0.0.1", "--port=0"],
    {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let stderr = "";
  proc.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const url = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Timed out starting sandbox server\n${stderr}`)),
      20_000,
    );
    proc.stdout.on("data", (chunk) => {
      const match = chunk
        .toString()
        .match(/opencode server listening on (http:\/\/[^\s]+)/);
      if (!match) return;
      clearTimeout(timeout);
      resolve(match[1]!);
    });
    proc.on("exit", (code) => {
      clearTimeout(timeout);
      reject(
        new Error(
          `Sandbox server exited early with code ${String(code)}\n${stderr}`,
        ),
      );
    });
    proc.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

  return {
    url,
    async close() {
      proc.kill("SIGTERM");
      await new Promise((resolve) => proc.once("exit", resolve));
    },
  };
}

async function pickModel(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  modelSlug: string,
): Promise<ModelRef> {
  const requested = parseModelSlug(modelSlug);
  const providers = await listProviders(client, directory);
  const all = providers.all ?? [];
  const provider = all.find((item) => item.id === requested.providerID);
  assert.ok(provider, `provider is not available: ${requested.providerID}`);
  assert.ok(
    (providers.connected ?? []).includes(requested.providerID),
    `provider is not connected in the isolated sandbox: ${requested.providerID}`,
  );
  assert.ok(
    requested.modelID in provider.models,
    `model is not available: ${requested.providerID}/${requested.modelID}`,
  );
  return requested;
}

async function createSession(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  title: string,
) {
  const session = await createOpenCodeSession(client, directory, title);
  assert.ok(session.id, "failed to create session");
  return session.id;
}

async function forceCompaction(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  sessionID: string,
  model: ModelRef,
) {
  await client.session.summarize({
    directory,
    sessionID,
    providerID: model.providerID,
    modelID: model.modelID,
    auto: false,
  });
}

async function waitForCompactionArchivePath(mapPath: string) {
  const deadline = Date.now() + 60_000;
  let last: unknown;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    const compactedMap = JSON.parse(await fs.readFile(mapPath, "utf8")) as {
      compaction?: { archivePath?: string };
    };
    last = compactedMap;
    if (compactedMap.compaction?.archivePath) {
      return {
        compaction: {
          archivePath: compactedMap.compaction.archivePath,
        },
      };
    }
  }
  throw new Error(
    `compacted map did not record an archive path: ${JSON.stringify(last)}`,
  );
}

async function prompt(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  sessionID: string,
  text: string,
  system?: string,
  tools?: Record<string, boolean>,
) {
  const before = await listSessionMessages(client, directory, sessionID);
  const beforeIDs = new Set(before.map((message) => message.info?.id));
  const reply = await client.session.promptAsync({
    directory,
    sessionID,
    system,
    tools,
    parts: [{ type: "text", text }],
  });
  if (reply.error) throw new Error(JSON.stringify(reply.error));
  const assistant = await waitForAssistantMessage(
    client,
    directory,
    sessionID,
    beforeIDs,
  );
  return assistant;
}

async function waitForAssistantMessage(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  sessionID: string,
  beforeIDs: Set<string | undefined>,
) {
  const deadline = Date.now() + 300_000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    const messages = await listSessionMessages(client, directory, sessionID);
    const assistant = [...messages]
      .reverse()
      .find(
        (message) =>
          (message.info?.role ?? message.role) === "assistant" &&
          !beforeIDs.has(message.info?.id) &&
          message.info?.finish &&
          message.info.finish !== "tool-calls",
      );
    if (assistant) return assistant;
  }
  throw new Error(`timed out waiting for assistant message in ${sessionID}`);
}

async function listSessionMessages(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  sessionID: string,
) {
  return (await listOpenCodeSessionMessages(
    client,
    directory,
    sessionID,
  )) as SessionMessage[];
}

async function sessionToolCalls(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  sessionID: string,
) {
  const messages = await listSessionMessages(client, directory, sessionID);
  return messages.flatMap((message) =>
    (message.parts ?? [])
      .filter((part) => part.type === "tool" && part.tool)
      .map((part) => ({
        tool: part.tool!,
        input: part.state?.input,
        output: part.state?.output,
      })),
  );
}

function latestToolCall(
  calls: Array<{ tool: string; input?: unknown; output?: unknown }>,
  tool: string,
) {
  const call = [...calls].reverse().find((item) => item.tool === tool);
  assert.ok(call, `missing tool call ${tool}`);
  return call;
}

function parseToolOutput(call: { output?: unknown }) {
  if (typeof call.output === "string") return JSON.parse(call.output);
  assert.ok(call.output, "tool call had no output");
  return call.output as Record<string, unknown>;
}

function messageText(message: SessionMessage | undefined) {
  return (message?.parts ?? [])
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text ?? "")
    .join("\n");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
