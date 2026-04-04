import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

import { createOpencodeClient } from "@opencode-ai/sdk/v2";

const execFileAsync = promisify(execFile);

type ModelRef = {
  providerID: string;
  modelID: string;
};

async function main() {
  const repoRoot = path.resolve(process.cwd());
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "mem-mould-context-map-"),
  );
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
    path.join(repoRoot, "src/context-map/server-plugin.ts"),
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
    MEM_MOULD_DISABLE_GIT_HOOK_INSTALL: "1",
    OPENCODE_CONFIG_CONTENT: JSON.stringify({
      $schema: "https://opencode.ai/config.json",
      plugin: [pluginSpec],
    }),
  };

  const server = await startServer(env, repoRoot);

  try {
    const client = createOpencodeClient({ baseUrl: server.url });
    const model = await pickModel(client, repoRoot);
    console.log(`Using ${model.providerID}/${model.modelID}`);

    const toolList = ((
      (await client.tool.list({
        directory: repoRoot,
        provider: model.providerID,
        model: model.modelID,
      })) as any
    )?.data ?? []) as Array<{ id: string }>;
    const toolIDs = new Set(toolList.map((tool) => tool.id));
    for (const required of [
      "context_map",
      "compress_blob",
      "drop_blob",
      "session_lookup",
      "session_zoom",
      "blame_lookup",
    ]) {
      assert.ok(toolIDs.has(required), `missing tool ${required}`);
    }

    const firstSession = await createSession(
      client,
      repoRoot,
      "context-map integration",
    );
    await prompt(
      client,
      repoRoot,
      firstSession,
      model,
      "Investigate an auth rate limiter race condition on line 42 and explain why an async queue may be safer than a mutex.",
    );
    await prompt(
      client,
      repoRoot,
      firstSession,
      model,
      "Now switch topics and outline onboarding docs for API contributors.",
    );
    const returnReply = await prompt(
      client,
      repoRoot,
      firstSession,
      model,
      "Return to the auth topic and mention the failed mutex attempt.",
    );
    const returnText = textFromParts(returnReply.parts);
    assert.ok(returnText.length > 0, "assistant returned no visible text");
    assert.ok(
      !returnText.includes("<annotation>"),
      "annotation block leaked into visible assistant text",
    );

    const mapRoot = path.join(home, ".opencode", "context-maps");
    const mapPath = path.join(mapRoot, `${firstSession}.json`);
    const map = JSON.parse(await fs.readFile(mapPath, "utf8")) as {
      blobOrder: string[];
      blobs: Record<string, { id: string; fidelity: string; summary: string }>;
      messages: Record<string, unknown>;
    };
    assert.ok(
      map.blobOrder.length >= 2,
      "expected at least two blobs in the map",
    );
    assert.ok(
      Object.keys(map.messages).length >= 3,
      "expected multiple mapped messages",
    );

    const authBlobID =
      map.blobOrder.find((blobID) => blobID.includes("auth")) ??
      map.blobOrder[0];
    const docsBlobID =
      map.blobOrder.find((blobID) => blobID.includes("doc")) ??
      map.blobOrder[1];
    assert.ok(authBlobID, "missing auth-like blob");
    assert.ok(docsBlobID, "missing docs-like blob");

    const contextToolReply = await prompt(
      client,
      repoRoot,
      firstSession,
      model,
      "Call context_map exactly once, then answer with only the session_id value from the tool output.",
      "You must call the context_map tool exactly once before answering. If you skip the tool call, your answer is wrong. Avoid unrelated tools.",
      { context_map: true },
    );
    assert.ok(
      (await sessionToolNames(client, repoRoot, firstSession)).includes(
        "context_map",
      ),
      "model did not call context_map",
    );

    const compressReply = await prompt(
      client,
      repoRoot,
      firstSession,
      model,
      `Call compress_blob exactly once to set blob ${docsBlobID} to placeholder fidelity, then answer with only ok.`,
      "You must call the compress_blob tool exactly once before answering. If you skip the tool call, your answer is wrong. Avoid unrelated tools.",
      { compress_blob: true },
    );
    assert.ok(
      (await sessionToolNames(client, repoRoot, firstSession)).includes(
        "compress_blob",
      ),
      "model did not call compress_blob",
    );
    const updatedMap = JSON.parse(
      await fs.readFile(mapPath, "utf8"),
    ) as typeof map;
    assert.equal(
      updatedMap.blobs[docsBlobID!]?.fidelity,
      "placeholder",
      "compress_blob did not persist blob fidelity",
    );

    const secondSession = await createSession(
      client,
      repoRoot,
      "context-map historical lookup",
    );
    const lookupReply = await prompt(
      client,
      repoRoot,
      secondSession,
      model,
      `Call session_lookup exactly once to find the earlier auth investigation session for ${authBlobID}, then call session_zoom exactly once on the matching blob at compressed fidelity, then answer with one fact.`,
      "You must call session_lookup exactly once and session_zoom exactly once before answering. If you skip either tool call, your answer is wrong. Avoid unrelated tools.",
      { session_lookup: true, session_zoom: true },
    );
    const lookupTools = await sessionToolNames(client, repoRoot, secondSession);
    assert.ok(
      lookupTools.includes("session_lookup"),
      "model did not call session_lookup",
    );
    assert.ok(
      lookupTools.includes("session_zoom"),
      "model did not call session_zoom",
    );

    const blameHash = await blameHashForLine(repoRoot, "README.md", 1);
    await fs.mkdir(mapRoot, { recursive: true });
    await fs.writeFile(
      path.join(mapRoot, "_commits.json"),
      JSON.stringify(
        {
          version: 1,
          updatedAt: Date.now(),
          entries: {
            [blameHash]: {
              commitHash: blameHash,
              sessionID: firstSession,
              timestamp: Date.now(),
              directory: repoRoot,
              worktree: repoRoot,
              activeBlobID: authBlobID,
              activeBlobLabel: authBlobID,
              activeBlobIDs: authBlobID ? [authBlobID] : [],
            },
          },
        },
        null,
        2,
      ),
    );

    const thirdSession = await createSession(
      client,
      repoRoot,
      "context-map blame lookup",
    );
    const blameReply = await prompt(
      client,
      repoRoot,
      thirdSession,
      model,
      "Call blame_lookup exactly once on README.md line 1, then answer with only the mapped session id.",
      "You must call the blame_lookup tool exactly once before answering. If you skip the tool call, your answer is wrong. Avoid unrelated tools.",
      { blame_lookup: true },
    );
    assert.ok(
      (await sessionToolNames(client, repoRoot, thirdSession)).includes(
        "blame_lookup",
      ),
      "model did not call blame_lookup",
    );

    console.log("Sandbox validation passed");
  } finally {
    await server.close();
    await fs.rm(tempRoot, { recursive: true, force: true });
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
      const text = chunk.toString();
      const match = text.match(
        /opencode server listening on (http:\/\/[^\s]+)/,
      );
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
): Promise<ModelRef> {
  const providers = (((await client.provider.list({ directory })) as any)
    ?.data ?? {}) as {
    all?: Array<{ id: string; models: Record<string, unknown> }>;
  };
  const all = providers.all ?? [];
  const preferred: ModelRef[] = [
    { providerID: "anthropic", modelID: "claude-sonnet-4-6" },
    {
      providerID: "amazon-bedrock",
      modelID: "global.anthropic.claude-sonnet-4-6",
    },
    { providerID: "openai", modelID: "gpt-5.4" },
  ];
  for (const candidate of preferred) {
    const provider = all.find((item) => item.id === candidate.providerID);
    if (provider && candidate.modelID in provider.models) return candidate;
  }
  const provider = all[0];
  assert.ok(provider, "no providers available in sandbox");
  const modelID = Object.keys(provider.models)[0];
  assert.ok(modelID, `provider ${provider.id} has no models`);
  return { providerID: provider.id, modelID };
}

async function createSession(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  title: string,
) {
  const session = (((await client.session.create({ directory, title })) as any)
    ?.data ?? {}) as { id: string };
  assert.ok(session.id, "failed to create session");
  return session.id;
}

async function prompt(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  sessionID: string,
  model: ModelRef,
  text: string,
  system?: string,
  tools?: Record<string, boolean>,
) {
  const reply = ((
    (await client.session.prompt({
      directory,
      sessionID,
      model,
      system,
      tools,
      parts: [{ type: "text", text }],
    })) as any
  )?.data ?? {}) as {
    parts: Array<{
      type: string;
      text?: string;
      tool?: string;
      state?: { status?: string };
    }>;
  };
  return reply;
}

function textFromParts(
  parts: Array<{ type: string; text?: string }> | undefined,
) {
  return (parts ?? [])
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("\n");
}

function toolParts(
  parts:
    | Array<{ type: string; tool?: string; state?: { status?: string } }>
    | undefined,
) {
  return (parts ?? []).filter((part) => part.type === "tool");
}

async function sessionToolNames(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  sessionID: string,
) {
  const messages = ((
    (await client.session.messages({
      sessionID,
      directory,
      limit: 5000,
    })) as any
  )?.data ?? []) as Array<{
    parts?: Array<{ type: string; tool?: string; state?: { status?: string } }>;
  }>;
  return messages
    .flatMap((message) => toolParts(message.parts).map((part) => part.tool))
    .filter((tool): tool is string => Boolean(tool));
}

async function blameHashForLine(cwd: string, file: string, line: number) {
  const { stdout } = await execFileAsync(
    "git",
    ["blame", "-L", `${line},${line}`, "--", file],
    { cwd },
  );
  const hash = stdout.trim().split(/\s+/)[0];
  assert.ok(hash, `failed to resolve blame hash for ${file}:${line}`);
  return hash;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
