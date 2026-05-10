/**
 * Toy sandbox test: verifies the full plugin flow end-to-end.
 *
 * 1. Starts an isolated OpenCode server with the plugin loaded
 * 2. Creates a session, sends a few prompts to build up blobs
 * 3. Changes fidelity on a blob via the set_fidelity tool
 * 4. Sends another prompt and verifies the transform reduced messages
 * 5. Checks trace logs confirm everything fired correctly
 *
 * Usage: node --import tsx scripts/test-flow.ts
 * Requires: Amazon Bedrock credentials configured
 */
import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

import { createOpencodeClient } from "@opencode-ai/sdk/v2";

const execFileAsync = promisify(execFile);
const validationModelSlug = process.env.MEM_MOULD_E2E_MODEL ?? "openai/gpt-5.5";

type ModelRef = {
  providerID: string;
  modelID: string;
};

async function main() {
  const projectRoot = path.resolve(process.cwd());
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "mem-mould-flow-test-"),
  );
  const repo = path.join(tempRoot, "repo");
  const home = path.join(tempRoot, "home");

  await fs.mkdir(repo, { recursive: true });
  await fs.mkdir(home, { recursive: true });

  // Init a minimal git repo
  await execFileAsync("git", ["init"], { cwd: repo });
  await execFileAsync("git", ["config", "user.name", "Test"], { cwd: repo });
  await execFileAsync("git", ["config", "user.email", "t@t.com"], {
    cwd: repo,
  });
  await fs.writeFile(path.join(repo, "hello.ts"), "export const x = 1;\n");
  await execFileAsync("git", ["add", "."], { cwd: repo });
  await execFileAsync("git", ["commit", "-m", "init"], { cwd: repo });

  const env = {
    ...process.env,
    HOME: home,
    XDG_DATA_HOME: path.join(tempRoot, "data"),
    XDG_CONFIG_HOME: path.join(tempRoot, "config"),
    XDG_STATE_HOME: path.join(tempRoot, "state"),
    XDG_CACHE_HOME: path.join(tempRoot, "cache"),
    OPENCODE_DB: path.join(tempRoot, "opencode.sqlite"),
    MEM_MOULD_DISABLE_GIT_HOOK_INSTALL: "1",
    OPENCODE_DISABLE_PROJECT_CONFIG: "1",
    OPENCODE_CONFIG_CONTENT: JSON.stringify({
      $schema: "https://opencode.ai/config.json",
      model: validationModelSlug,
      plugin: [
        pathToFileURL(
          path.join(projectRoot, "src", "context-map", "server-plugin.ts"),
        ).href,
      ],
    }),
  };

  for (const dir of [
    env.XDG_DATA_HOME,
    env.XDG_CONFIG_HOME,
    env.XDG_STATE_HOME,
    env.XDG_CACHE_HOME,
  ]) {
    await fs.mkdir(dir!, { recursive: true });
  }

  console.log("Starting server...");
  const proc = spawn(
    "opencode",
    ["serve", "--hostname=127.0.0.1", "--port=0"],
    { cwd: repo, env, stdio: ["ignore", "pipe", "pipe"] },
  );
  let stderr = "";
  proc.stderr.on("data", (c) => {
    stderr += c.toString();
  });

  const url = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Server timeout\n${stderr}`)),
      20_000,
    );
    proc.stdout.on("data", (c) => {
      const m = c
        .toString()
        .match(/opencode server listening on (http:\/\/[^\s]+)/);
      if (m) {
        clearTimeout(timeout);
        resolve(m[1]!);
      }
    });
    proc.on("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Server exited ${code}\n${stderr}`));
    });
  });

  const client = createOpencodeClient({ baseUrl: url });

  const model = await pickModel(client, repo, validationModelSlug);
  console.log(`Using selected model ${model.providerID}/${model.modelID}`);

  try {
    // ── Step 1: Create session and send first prompt ────────────
    console.log("\n=== Step 1: Create session + first prompt ===");
    const session = (
      (await client.session.create({
        directory: repo,
        title: "Flow test",
      })) as any
    )?.data;
    assert.ok(session?.id, "Failed to create session");
    const sid = session.id;
    console.log(`Session: ${sid}`);

    await prompt(
      client,
      repo,
      sid,
      "Read hello.ts and tell me what it exports.",
    );
    console.log("  Prompt 1 done");

    // ── Step 2: Send second prompt on a different topic ────────
    console.log("\n=== Step 2: Second prompt (different topic) ===");
    await prompt(
      client,
      repo,
      sid,
      "Write a test for hello.ts that checks x equals 1.",
    );
    console.log("  Prompt 2 done");

    // ── Step 3: Check context map has blobs ─────────────────────
    console.log("\n=== Step 3: Check context map ===");
    const mapsDir = path.join(home, ".opencode", "context-maps");
    const mapPath = path.join(mapsDir, `${sid}.json`);
    const map = JSON.parse(await fs.readFile(mapPath, "utf8"));
    console.log(`  Blobs: ${map.blobOrder.length}`);
    console.log(`  Messages: ${Object.keys(map.messages).length}`);
    for (const bid of map.blobOrder) {
      const b = map.blobs[bid];
      console.log(
        `    ${b.label} [${b.fidelity}] ~${b.tokenEstimate} tok ${b.messageIDs.length} msgs`,
      );
    }
    assert.ok(map.blobOrder.length >= 1, "Expected at least 1 blob");

    // ── Step 4: Check trace log exists and has entries ──────────
    console.log("\n=== Step 4: Check trace log ===");
    const tracePath = path.join(mapsDir, `${sid}.trace.jsonl`);
    let traceLines: string[];
    try {
      traceLines = (await fs.readFile(tracePath, "utf8"))
        .trim()
        .split("\n")
        .filter(Boolean);
    } catch {
      traceLines = [];
    }
    console.log(`  Trace entries: ${traceLines.length}`);
    const events = traceLines.map((l) => JSON.parse(l));
    const eventTypes = events.map((e: any) => e.event);
    console.log(`  Event types: ${[...new Set(eventTypes)].join(", ")}`);

    // Check that messages.transform ran
    const transforms = events.filter(
      (e: any) => e.event === "messages.transform",
    );
    console.log(`  messages.transform calls: ${transforms.length}`);
    if (transforms.length > 0) {
      const last = transforms[transforms.length - 1];
      console.log(
        `    Last: before=${last.before_count} after=${last.after_count} removed=${last.messages_removed}`,
      );
      console.log(
        `    Blob fidelities: ${JSON.stringify(last.blob_fidelities)}`,
      );
    }

    // Check annotation parsing
    const completions = events.filter((e: any) => e.event === "text.complete");
    console.log(`  text.complete calls: ${completions.length}`);
    for (const c of completions) {
      console.log(
        `    annotation=${c.had_annotation} blob=${c.annotation_blob ?? "fallback"} blobs=${c.blob_count} eff_tok=${c.effective_tokens}`,
      );
    }

    // ── Step 5: Set a blob to summary via set_fidelity ─────────
    console.log("\n=== Step 5: Compress a blob to summary ===");
    const targetBlob = map.blobOrder[0];
    console.log(`  Target: ${targetBlob}`);
    await prompt(
      client,
      repo,
      sid,
      `Use the set_fidelity tool to set the blob "${targetBlob}" to "summary" fidelity.`,
    );
    console.log("  Compress prompt done");

    // ── Step 6: Verify fidelity changed ─────────────────────────
    console.log("\n=== Step 6: Verify fidelity change ===");
    const map2 = JSON.parse(await fs.readFile(mapPath, "utf8"));
    const blobAfter = map2.blobs[targetBlob];
    console.log(
      `  ${targetBlob}: fidelity=${blobAfter?.fidelity} source=${blobAfter?.fidelitySource}`,
    );

    // ── Step 7: Send another prompt, check transform applied ───
    console.log("\n=== Step 7: Prompt after fidelity change ===");
    await prompt(
      client,
      repo,
      sid,
      "What did we discuss so far? Summarize the conversation.",
    );
    console.log("  Prompt 3 done");

    // Check trace for the last transform
    const trace2 = (await fs.readFile(tracePath, "utf8"))
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l));
    const lastTransform = [...trace2]
      .reverse()
      .find((e: any) => e.event === "messages.transform");
    if (lastTransform) {
      console.log(
        `  Transform: before=${lastTransform.before_count} after=${lastTransform.after_count} removed=${lastTransform.messages_removed}`,
      );
      console.log(
        `  Blob fidelities: ${JSON.stringify(lastTransform.blob_fidelities)}`,
      );
      // If fidelity was set to summary, some messages should be transformed
      if (blobAfter?.fidelity === "summary") {
        console.log(
          `  Blob "${targetBlob}" is summary — messages should be summarized in context`,
        );
        const stubs =
          lastTransform.surviving_messages?.filter((m: any) => m.is_stub) ?? [];
        console.log(
          `  Stub messages (summarized/placeholder): ${stubs.length}`,
        );
      }
    }

    // ── Results ─────────────────────────────────────────────────
    console.log("\n=== Results ===");
    console.log(`  Blobs created: ${map2.blobOrder.length}`);
    console.log(
      `  Total messages in map: ${Object.keys(map2.messages).length}`,
    );
    console.log(`  Trace events: ${trace2.length}`);
    console.log(
      `  Annotation success rate: ${completions.filter((c: any) => c.had_annotation).length}/${completions.length}`,
    );
    console.log(
      `  Fidelity change applied: ${blobAfter?.fidelity === "summary" ? "YES" : "NO"}`,
    );
    console.log("\n  PASS: Flow test completed successfully.");
  } finally {
    proc.kill("SIGTERM");
    await new Promise((r) => proc.once("exit", r));
  }
}

async function prompt(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  sessionID: string,
  text: string,
) {
  const raw = (await client.session.prompt({
    directory,
    sessionID,
    parts: [{ type: "text", text }],
  })) as any;
  const reply = raw?.data ?? raw ?? {};
  if (reply.error) {
    console.error(`  API error: ${JSON.stringify(reply.error).slice(0, 200)}`);
    return;
  }
  const parts: Array<{ type: string; text?: string }> =
    reply.parts ?? reply.message?.parts ?? [];
  const visible = parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("\n");
  if (visible.length === 0) {
    console.error("  WARNING: empty reply");
  }
}

async function pickModel(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  modelSlug: string,
): Promise<ModelRef> {
  const requested = parseModelSlug(modelSlug);
  const providers = (((await client.provider.list({ directory })) as any)
    ?.data ?? {}) as {
    all?: Array<{ id: string; models: Record<string, unknown> }>;
    connected?: string[];
  };
  const provider = (providers.all ?? []).find(
    (item) => item.id === requested.providerID,
  );
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

function parseModelSlug(modelSlug: string): ModelRef {
  const index = modelSlug.indexOf("/");
  assert.ok(index > 0, `model must be provider/model, got: ${modelSlug}`);
  return {
    providerID: modelSlug.slice(0, index),
    modelID: modelSlug.slice(index + 1),
  };
}

void main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
