import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { createOpencodeClient } from "@opencode-ai/sdk/v2";

import {
  parseModelSlug,
  requiredModelSlug,
  type ModelRef,
} from "../../tools/model";
import {
  createSession as createOpenCodeSession,
  listProviders,
  listSessionMessages as listOpenCodeSessionMessages,
} from "../../tools/opencode-sdk";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(process.cwd());
const defaultOutDir = path.join(
  repoRoot,
  "benchmarks",
  "reversible-memory",
  "runs",
  timestampForPath(new Date()),
);

type SessionMessage = {
  info?: {
    id?: string;
    role?: string;
    finish?: string;
    summary?: boolean;
    tokens?: {
      input?: number;
      output?: number;
      total?: number;
      reasoning?: number;
      cache?: { read?: number; write?: number };
    };
  };
  role?: string;
  parts?: Array<{
    type: string;
    text?: string;
    tool?: string;
    state?: { status?: string; input?: unknown; output?: unknown };
  }>;
};

type ConditionID =
  | "default"
  | "default-compaction"
  | "rgb-agent"
  | "decant"
  | "decant-guided-rgb";

type ConditionMode = "default" | "compaction" | "rgb" | "decant" | "hybrid";

type ConditionConfig = {
  id: ConditionID;
  mode: ConditionMode;
  plugin: boolean;
};

type Options = {
  conditions: ConditionID[];
  outDir: string;
  modelSlug: string;
  promptTimeoutMs: number;
  noiseScale: number;
  prepareOnly: boolean;
  keepWorktrees: boolean;
  analyzeRun?: string;
};

type TokenBucket = {
  messages: number;
  assistant: number;
  input: number;
  output: number;
  total: number;
  reasoning: number;
  cacheRead: number;
  cacheWrite: number;
  toolCalls: number;
  maxInput: number;
};

type PhaseMessages = {
  prep: SessionMessage[];
  cleanup: SessionMessage[];
  recovery: SessionMessage[];
};

type PhaseTokenBuckets = {
  prep: TokenBucket;
  cleanup: TokenBucket;
  recovery: TokenBucket;
};

type PhaseCostBuckets = {
  prep: number;
  cleanup: number;
  recovery: number;
};

type RunResult = {
  condition: ConditionID;
  sessionID?: string;
  statsPath: string;
  messagesPath: string;
  contextMapPath: string;
  cleanupPassed?: boolean;
  recoveryPassed?: boolean;
  routePassed?: boolean;
  error?: string;
};

type RunStats = {
  condition: ConditionID;
  session_id?: string;
  duration_ms: number;
  message_count: number;
  tool_call_count: number;
  tool_names: string[];
  context_tool_call_count: number;
  immediate_output_preview: string;
  recovery_output_preview: string;
  visible_context_stale_terms: string[];
  immediate_stale_terms: string[];
  immediate_current_task_terms: string[];
  recovery_required_hits: {
    rollback_flag: boolean;
    failed_test: boolean;
    accepted_design: boolean;
    rejected_design: boolean;
  };
  recovery_extra_stale_terms: string[];
  citation_present: boolean;
  rgb_context_present: boolean;
  rgb_context_preview: string;
  cleanup_passed: boolean;
  recovery_passed: boolean;
  extra_stale_leak_passed: boolean;
  route_passed: boolean;
  overall_passed: boolean;
  tokens: TokenBucket;
  phase_tokens: PhaseTokenBuckets;
  phase_estimated_cost_usd: PhaseCostBuckets;
  cache_hit_share: number | null;
  estimated_cost_usd: number;
};

type AnalysisRow = RunStats & { stats_path: string };

type RunAnalysis = {
  outDir: string;
  generatedAt: string;
  rows: AnalysisRow[];
};

const conditions: Record<ConditionID, ConditionConfig> = {
  default: { id: "default", mode: "default", plugin: false },
  "default-compaction": {
    id: "default-compaction",
    mode: "compaction",
    plugin: false,
  },
  "rgb-agent": { id: "rgb-agent", mode: "rgb", plugin: false },
  decant: { id: "decant", mode: "decant", plugin: true },
  "decant-guided-rgb": {
    id: "decant-guided-rgb",
    mode: "hybrid",
    plugin: true,
  },
};

const currentTaskTerms = ["csv", "header", "trim"];
const cleanupStaleTerms = [
  "auth rate limiter",
  "rate_limiter",
  "MutexRefreshCoordinator",
  "FLAG_AUTH_QUEUE_ROLLBACK",
  "enqueueRefresh",
  "src/auth/queue.ts",
  "markdown parser",
  "quickstart",
  "onboarding docs",
  "auth_refresh_deduplicates_parallel_requests",
  "global mutex",
];
const recoveryLeakTerms = ["markdown parser", "quickstart", "onboarding docs"];

const preludeTurns = [
  "We are investigating an auth rate limiter race in a separate service. The suspected hot spot is `src/auth/rate_limiter.ts:42`, where two concurrent refresh requests can both observe an expired token and schedule duplicate refresh work. Think through the likely root cause, but do not edit files yet.",
  "Stay on the auth race. I tried a global mutex design earlier, but I am worried it serializes too much of the request path and may still fail if the lock is scoped per handler instance instead of per tenant. Explain what would make that failure mode plausible.",
  "The mutex attempt did fail under a concurrent test. Preserve this as an important fact for later: the failed approach was `MutexRefreshCoordinator`, and the failing test name was `auth_refresh_deduplicates_parallel_requests`. We are leaning toward an async queue instead.",
  "Switch topics. For onboarding docs, outline a contributor quickstart for API developers. It should mention local environment setup, a short smoke test command, where API route files live, and how to find feature-flag documentation. This docs work is low priority compared with auth.",
  "Still on docs: the quickstart wording got noisy. We renamed the section from Setup to First local run, then back to Quickstart, then to Contributor quickstart. Also mention that the docs cleanup should not affect runtime behavior.",
  "Switch back to auth. The accepted design is a per-tenant async queue helper extracted to `src/auth/queue.ts`. Same-tenant duplicate refreshes should coalesce; different tenants must continue in parallel. The rejected design is one global mutex around all refresh work.",
  "The rollback flag for the auth queue rollout is `FLAG_AUTH_QUEUE_ROLLBACK`. The helper exposes a narrow `enqueueRefresh` API. Preserve those exact names for future provenance questions.",
  "Add a stale note that should not be reused unless explicitly relevant: in an old prototype, we thought the bug was caused by a markdown parser caching issue in docs generation. That hypothesis was wrong and belongs to the docs cleanup thread, not the auth fix.",
  "We are about to switch to a completely different parser task. The old auth/docs/test discussion is only historical context. Hide or ignore those details unless a later question explicitly asks for old auth provenance.",
];

function expandedPreludeTurns(noiseScale: number) {
  if (noiseScale === 1) return preludeTurns;
  const finalBoundaryTurn = preludeTurns.at(-1);
  assert.ok(
    finalBoundaryTurn,
    "prelude turns must include final boundary turn",
  );
  const turns = preludeTurns.slice(0, -1);
  for (let round = 2; round <= noiseScale; round++) {
    turns.push(...noisePreludeTurns(round));
  }
  turns.push(finalBoundaryTurn);
  return turns;
}

function noisePreludeTurns(round: number) {
  const suffix = String(round).padStart(2, "0");
  return [
    `Noise thread ${suffix}: investigate an unrelated billing webhook retry issue in src/billing/webhook_retry_${suffix}.ts. Preserve the old experiment flag FLAG_WEBHOOK_BACKOFF_${suffix} and failed test billing_webhook_retries_once_${suffix}, but this thread is not related to auth or CSV parsing.`,
    `Noise thread ${suffix}: switch to a separate image cache cleanup. The rejected idea was ImageGlobalCache_${suffix}; the accepted direction was per-tenant cache buckets with ttl_bucket_${suffix}. Keep this as historical context only.`,
    `Noise thread ${suffix}: close out the billing/cache notes. They should not influence the upcoming CSV parser work unless a later question explicitly asks for those old billing or cache details.`,
  ];
}

const preludeSystemPrompt =
  "This is pre-task conversation history for a reversible-memory benchmark. Do not edit files and do not call tools. Respond concisely while preserving important facts for later memory lookup.";

const immediatePrompt = [
  "We are now working on a wholly unrelated parser issue in this repository.",
  "Current task: a CSV header parser should trim spaces around comma-separated header names.",
  "Return compact JSON with keys current_task, proposed_fix, and stale_context_policy.",
  "Do not mention historical topics unless they are directly relevant to this parser issue.",
].join("\n");

const immediatePromptNeedle =
  "CSV header parser should trim spaces around comma-separated header names";

const recoveryPrompt = [
  "Now answer a historical follow-up. Use the memory path available to your condition; do not guess.",
  "What was the rollback flag from the earlier auth thread, what failed concurrency test name was preserved, and what accepted design replaced the rejected global mutex?",
  "Return compact JSON with keys rollback_flag, failed_test, accepted_design, rejected_design, citation, and extra_context_policy.",
  "Include only the requested old auth facts. Do not mention unrelated docs or stale-hypothesis chatter.",
].join("\n");

const jsonOnlySystemPrompt =
  "Answer with compact JSON only. Do not edit files. Do not call tools unless the user prompt explicitly requires memory lookup.";

async function main() {
  const options = parseOptions();

  if (options.analyzeRun) {
    const analysis = await analyzeRun(options.analyzeRun);
    await writeAnalysisFiles(options.analyzeRun, analysis);
    console.log(runAnalysisMarkdown(analysis));
    console.log(
      `Analysis written to ${path.join(options.analyzeRun, "analysis.md")}`,
    );
    return;
  }

  await fs.mkdir(options.outDir, { recursive: true });
  await fs.writeFile(
    path.join(options.outDir, "config.json"),
    `${JSON.stringify(options, null, 2)}\n`,
  );

  if (options.prepareOnly) {
    await writeSummary(options.outDir, [], options);
    console.log(`Prepared reversible-memory metadata at ${options.outDir}`);
    return;
  }

  const model = parseModelSlug(options.modelSlug);
  const results: RunResult[] = [];
  for (const conditionID of options.conditions) {
    const result = await runCondition(conditions[conditionID], model, options);
    results.push(result);
    await writeSummary(options.outDir, results, options);
  }

  await writeSummary(options.outDir, results, options);
  await writeRunAnalysis(options.outDir).catch((error) => {
    console.warn(
      `Could not write reversible-memory analysis: ${String(error)}`,
    );
  });
  console.log(`Reversible-memory artifacts written to ${options.outDir}`);
}

async function runCondition(
  condition: ConditionConfig,
  model: ModelRef,
  options: Options,
): Promise<RunResult> {
  const conditionDir = path.join(options.outDir, "conditions", condition.id);
  const worktree = path.join(conditionDir, "worktree");
  await fs.mkdir(conditionDir, { recursive: true });

  const resultBase: RunResult = {
    condition: condition.id,
    statsPath: path.join(conditionDir, "stats.json"),
    messagesPath: path.join(conditionDir, "messages.json"),
    contextMapPath: path.join(conditionDir, "context-map.json"),
  };

  let server: Awaited<ReturnType<typeof startServer>> | undefined;
  const startedAt = Date.now();
  try {
    await prepareFixtureRepo(worktree);
    const turns = expandedPreludeTurns(options.noiseScale);
    const opencodeRoot = await resolveOpenCodeRoot(conditionDir);
    const env = await buildOpenCodeEnv({
      opencodeRoot,
      conditionDir,
      modelSlug: options.modelSlug,
      plugin: condition.plugin,
    });
    server = await startServer(env, worktree);
    const client = createOpencodeClient({ baseUrl: server.url });
    await pickModel(client, worktree, options.modelSlug);

    if (condition.mode === "rgb") {
      const stats = await runRgbCondition({
        client,
        condition,
        conditionDir,
        worktree,
        startedAt,
        preludeTurns: turns,
        promptTimeoutMs: options.promptTimeoutMs,
      });
      await fs.writeFile(
        resultBase.statsPath,
        `${JSON.stringify(stats, null, 2)}\n`,
      );
      if (!options.keepWorktrees)
        await fs.rm(worktree, { recursive: true, force: true });
      return {
        ...resultBase,
        cleanupPassed: stats.cleanup_passed,
        recoveryPassed: stats.recovery_passed,
        routePassed: stats.route_passed,
      };
    }

    if (condition.mode === "compaction") {
      const stats = await runDefaultCompactionCondition({
        client,
        condition,
        conditionDir,
        worktree,
        startedAt,
        preludeTurns: turns,
        promptTimeoutMs: options.promptTimeoutMs,
      });
      await fs.writeFile(
        resultBase.statsPath,
        `${JSON.stringify(stats, null, 2)}\n`,
      );
      if (!options.keepWorktrees)
        await fs.rm(worktree, { recursive: true, force: true });
      return {
        ...resultBase,
        sessionID: stats.session_id,
        cleanupPassed: stats.cleanup_passed,
        recoveryPassed: stats.recovery_passed,
        routePassed: stats.route_passed,
      };
    }

    const sessionID = await createSession(
      client,
      worktree,
      condition.mode === "default"
        ? condition.id
        : `${condition.id} prior auth memory`,
    );
    for (const turn of turns) {
      await prompt(
        client,
        worktree,
        sessionID,
        turn,
        preludeSystemPrompt,
        {},
        options.promptTimeoutMs,
      );
    }
    const preludeMessages = await listSessionMessages(
      client,
      worktree,
      sessionID,
    );
    let cleanupPhaseMessages: SessionMessage[] = [];

    if (condition.mode === "decant" || condition.mode === "hybrid") {
      await requestContextCleanup(
        client,
        worktree,
        sessionID,
        options.promptTimeoutMs,
      );
      await forceKnownStaleTopicsHidden(
        client,
        worktree,
        sessionID,
        options.promptTimeoutMs,
      );
      const cleanedMessages = await listSessionMessages(
        client,
        worktree,
        sessionID,
      );
      cleanupPhaseMessages = messagesAfter(preludeMessages, cleanedMessages);
    }

    let recoveryAssistant: SessionMessage;
    let immediateAssistant: SessionMessage;
    let rgbContext = "";
    let finalSessionID: string | undefined;
    let allMessages: SessionMessage[];
    let visibleContextText: string;
    let phaseMessages: PhaseMessages;

    if (condition.mode === "decant") {
      finalSessionID = await createSession(
        client,
        worktree,
        `${condition.id} final`,
      );
      immediateAssistant = await prompt(
        client,
        worktree,
        finalSessionID,
        immediatePrompt,
        jsonOnlySystemPrompt,
        {},
        options.promptTimeoutMs,
      );
      const finalAfterImmediate = await listSessionMessages(
        client,
        worktree,
        finalSessionID,
      );
      cleanupPhaseMessages = [
        ...cleanupPhaseMessages,
        ...finalAfterImmediate,
      ];
      visibleContextText = "";
      recoveryAssistant = await prompt(
        client,
        worktree,
        finalSessionID,
        recoveryPrompt,
        [
          "Answer with compact JSON only.",
          "Use session_lookup exactly once to find the prior auth memory session.",
          "Use session_detail to find candidate message IDs, then call message_detail on the relevant message IDs before answering.",
          "Do not answer only from topic or session summaries; the point is to zoom into exact historical messages.",
          "Do not edit files. Do not mention unrelated docs or stale-hypothesis chatter.",
        ].join(" "),
        { session_lookup: true, session_detail: true, message_detail: true },
        options.promptTimeoutMs,
      );
      const mainMessages = await listSessionMessages(
        client,
        worktree,
        sessionID,
      );
      const finalMessages = await listSessionMessages(
        client,
        worktree,
        finalSessionID,
      );
      allMessages = [...mainMessages, ...finalMessages];
      phaseMessages = {
        prep: preludeMessages,
        cleanup: cleanupPhaseMessages,
        recovery: messagesAfter(finalAfterImmediate, finalMessages),
      };
    } else if (condition.mode === "hybrid") {
      const immediateSessionID = await createSession(
        client,
        worktree,
        `${condition.id} immediate`,
      );
      immediateAssistant = await prompt(
        client,
        worktree,
        immediateSessionID,
        immediatePrompt,
        jsonOnlySystemPrompt,
        {},
        options.promptTimeoutMs,
      );
      visibleContextText = "";
      await fs.mkdir(path.join(worktree, "recall"), { recursive: true });
      const editorSessionID = await createSession(
        client,
        worktree,
        `${condition.id} evidence editor`,
      );
      await prompt(
        client,
        worktree,
        editorSessionID,
        buildDecantGuidedRgbEvidencePrompt(worktree),
        buildDecantGuidedRgbEvidenceSystemPrompt(),
        {
          session_lookup: true,
          message_detail: true,
          session_detail: true,
          bash: true,
          write: true,
        },
        options.promptTimeoutMs,
      );
      rgbContext = await readRgbContext(worktree);
      assert.ok(
        rgbContext.trim().length > 0,
        "Decant-guided RGB editor did not write recall/rgb-context.md",
      );
      await fs.writeFile(path.join(conditionDir, "rgb-context.md"), rgbContext);
      finalSessionID = await createSession(
        client,
        worktree,
        `${condition.id} final`,
      );
      recoveryAssistant = await prompt(
        client,
        worktree,
        finalSessionID,
        buildRgbRecoveryFinalPrompt(rgbContext),
        jsonOnlySystemPrompt,
        {},
        options.promptTimeoutMs,
      );
      const mainMessages = await listSessionMessages(
        client,
        worktree,
        sessionID,
      );
      const immediateMessages = await listSessionMessages(
        client,
        worktree,
        immediateSessionID,
      );
      const editorMessages = await listSessionMessages(
        client,
        worktree,
        editorSessionID,
      );
      const finalMessages = await listSessionMessages(
        client,
        worktree,
        finalSessionID,
      );
      allMessages = [
        ...mainMessages,
        ...immediateMessages,
        ...editorMessages,
        ...finalMessages,
      ];
      phaseMessages = {
        prep: preludeMessages,
        cleanup: [...cleanupPhaseMessages, ...immediateMessages],
        recovery: [...editorMessages, ...finalMessages],
      };
    } else {
      immediateAssistant = await prompt(
        client,
        worktree,
        sessionID,
        immediatePrompt,
        jsonOnlySystemPrompt,
        {},
        options.promptTimeoutMs,
      );
      const afterImmediateMessages = await listSessionMessages(
        client,
        worktree,
        sessionID,
      );
      cleanupPhaseMessages = messagesAfter(
        preludeMessages,
        afterImmediateMessages,
      );
      visibleContextText = turns.join("\n");
      recoveryAssistant = await prompt(
        client,
        worktree,
        sessionID,
        recoveryPrompt,
        jsonOnlySystemPrompt,
        {},
        options.promptTimeoutMs,
      );
      allMessages = await listSessionMessages(client, worktree, sessionID);
      phaseMessages = {
        prep: preludeMessages,
        cleanup: cleanupPhaseMessages,
        recovery: messagesAfter(afterImmediateMessages, allMessages),
      };
    }

    await fs.writeFile(
      resultBase.messagesPath,
      `${JSON.stringify(allMessages, null, 2)}\n`,
    );
    await copyContextArtifacts(opencodeRoot.home, sessionID, conditionDir);

    const stats = buildStats({
      condition,
      sessionID,
      messages: allMessages,
      phaseMessages,
      immediateAssistant,
      recoveryAssistant,
      visibleContextText,
      rgbContext,
      startedAt,
    });
    await fs.writeFile(
      resultBase.statsPath,
      `${JSON.stringify(stats, null, 2)}\n`,
    );

    if (!options.keepWorktrees)
      await fs.rm(worktree, { recursive: true, force: true });
    return {
      ...resultBase,
      sessionID: finalSessionID ?? sessionID,
      cleanupPassed: stats.cleanup_passed,
      recoveryPassed: stats.recovery_passed,
      routePassed: stats.route_passed,
    };
  } catch (error) {
    const message =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    await fs.writeFile(
      resultBase.statsPath,
      `${JSON.stringify({ error: message }, null, 2)}\n`,
    );
    return { ...resultBase, error: message };
  } finally {
    await server?.close();
  }
}

async function runRgbCondition(input: {
  client: ReturnType<typeof createOpencodeClient>;
  condition: ConditionConfig;
  conditionDir: string;
  worktree: string;
  startedAt: number;
  preludeTurns: string[];
  promptTimeoutMs: number;
}) {
  const preludeSessionID = await createSession(
    input.client,
    input.worktree,
    `${input.condition.id} prelude`,
  );
  for (const turn of input.preludeTurns) {
    await prompt(
      input.client,
      input.worktree,
      preludeSessionID,
      turn,
      preludeSystemPrompt,
      {},
      input.promptTimeoutMs,
    );
  }
  const preludeMessages = await listSessionMessages(
    input.client,
    input.worktree,
    preludeSessionID,
  );
  await writeRgbRawLog(input.worktree, preludeMessages);
  const editorSessionID = await createSession(
    input.client,
    input.worktree,
    `${input.condition.id} editor`,
  );
  await prompt(
    input.client,
    input.worktree,
    editorSessionID,
    buildRgbCleanupPrompt(input.worktree),
    buildRgbCleanupSystemPrompt(),
    { read: true, grep: true, bash: true },
    input.promptTimeoutMs,
  );
  const editorMessages = await listSessionMessages(
    input.client,
    input.worktree,
    editorSessionID,
  );
  await fs.writeFile(
    path.join(input.conditionDir, "editor-messages.json"),
    `${JSON.stringify(editorMessages, null, 2)}\n`,
  );
  const rgbContext = await readRgbContext(input.worktree);
  assert.ok(
    rgbContext.trim().length > 0,
    "RGB editor did not write recall/rgb-context.md",
  );
  await fs.writeFile(
    path.join(input.conditionDir, "rgb-context.md"),
    rgbContext,
  );
  await archiveRgbRawLog(input.worktree, input.conditionDir);

  const finalSessionID = await createSession(
    input.client,
    input.worktree,
    `${input.condition.id} final`,
  );
  const immediateAssistant = await prompt(
    input.client,
    input.worktree,
    finalSessionID,
    buildRgbImmediatePrompt(rgbContext),
    jsonOnlySystemPrompt,
    {},
    input.promptTimeoutMs,
  );
  const finalAfterImmediate = await listSessionMessages(
    input.client,
    input.worktree,
    finalSessionID,
  );
  const recoveryAssistant = await prompt(
    input.client,
    input.worktree,
    finalSessionID,
    buildRgbRecoveryPrompt(),
    jsonOnlySystemPrompt,
    {},
    input.promptTimeoutMs,
  );
  const finalMessages = await listSessionMessages(
    input.client,
    input.worktree,
    finalSessionID,
  );
  const allMessages = [...preludeMessages, ...editorMessages, ...finalMessages];
  await fs.writeFile(
    path.join(input.conditionDir, "messages.json"),
    `${JSON.stringify(allMessages, null, 2)}\n`,
  );
  return buildStats({
    condition: input.condition,
    sessionID: finalSessionID,
    messages: allMessages,
    phaseMessages: {
      prep: preludeMessages,
      cleanup: [...editorMessages, ...finalAfterImmediate],
      recovery: messagesAfter(finalAfterImmediate, finalMessages),
    },
    immediateAssistant,
    recoveryAssistant,
    visibleContextText: rgbContext,
    rgbContext,
    startedAt: input.startedAt,
  });
}

async function runDefaultCompactionCondition(input: {
  client: ReturnType<typeof createOpencodeClient>;
  condition: ConditionConfig;
  conditionDir: string;
  worktree: string;
  startedAt: number;
  preludeTurns: string[];
  promptTimeoutMs: number;
}) {
  const preludeSessionID = await createSession(
    input.client,
    input.worktree,
    `${input.condition.id} prelude`,
  );
  for (const turn of input.preludeTurns) {
    await prompt(
      input.client,
      input.worktree,
      preludeSessionID,
      turn,
      preludeSystemPrompt,
      {},
      input.promptTimeoutMs,
    );
  }
  const preludeMessages = await listSessionMessages(
    input.client,
    input.worktree,
    preludeSessionID,
  );
  await writeRgbRawLog(input.worktree, preludeMessages);

  const compactorSessionID = await createSession(
    input.client,
    input.worktree,
    `${input.condition.id} compactor`,
  );
  await prompt(
    input.client,
    input.worktree,
    compactorSessionID,
    buildDefaultCompactionPrompt(input.worktree),
    buildDefaultCompactionSystemPrompt(),
    { read: true, grep: true, bash: true },
    input.promptTimeoutMs,
  );
  const compactorMessages = await listSessionMessages(
    input.client,
    input.worktree,
    compactorSessionID,
  );
  await fs.writeFile(
    path.join(input.conditionDir, "compactor-messages.json"),
    `${JSON.stringify(compactorMessages, null, 2)}\n`,
  );
  const compactionContext = await readDefaultCompactionContext(input.worktree);
  assert.ok(
    compactionContext.trim().length > 0,
    "default compactor did not write recall/default-compaction.md",
  );
  await fs.writeFile(
    path.join(input.conditionDir, "default-compaction.md"),
    compactionContext,
  );
  await archiveRgbRawLog(input.worktree, input.conditionDir);

  const finalSessionID = await createSession(
    input.client,
    input.worktree,
    `${input.condition.id} final`,
  );
  const immediateAssistant = await prompt(
    input.client,
    input.worktree,
    finalSessionID,
    buildDefaultCompactionImmediatePrompt(compactionContext),
    jsonOnlySystemPrompt,
    {},
    input.promptTimeoutMs,
  );
  const finalAfterImmediate = await listSessionMessages(
    input.client,
    input.worktree,
    finalSessionID,
  );
  const recoveryAssistant = await prompt(
    input.client,
    input.worktree,
    finalSessionID,
    buildDefaultCompactionRecoveryPrompt(),
    jsonOnlySystemPrompt,
    {},
    input.promptTimeoutMs,
  );
  const finalMessages = await listSessionMessages(
    input.client,
    input.worktree,
    finalSessionID,
  );
  const allMessages = [
    ...preludeMessages,
    ...compactorMessages,
    ...finalMessages,
  ];
  await fs.writeFile(
    path.join(input.conditionDir, "messages.json"),
    `${JSON.stringify(allMessages, null, 2)}\n`,
  );
  return buildStats({
    condition: input.condition,
    sessionID: finalSessionID,
    messages: allMessages,
    phaseMessages: {
      prep: preludeMessages,
      cleanup: [...compactorMessages, ...finalAfterImmediate],
      recovery: messagesAfter(finalAfterImmediate, finalMessages),
    },
    immediateAssistant,
    recoveryAssistant,
    visibleContextText: compactionContext,
    rgbContext: compactionContext,
    startedAt: input.startedAt,
  });
}

function parseOptions(): Options {
  const args = process.argv.slice(2);
  const conditionArg = valueArg(args, "--conditions");
  const conditionsList = (
    conditionArg
      ? splitList(conditionArg)
      : [
          "default",
          "default-compaction",
          "rgb-agent",
          "decant",
          "decant-guided-rgb",
        ]
  ) as ConditionID[];
  for (const condition of conditionsList) {
    assert.ok(
      condition in conditions,
      `unknown condition ${condition}; expected one of ${Object.keys(conditions).join(", ")}`,
    );
  }
  const timeoutMinutes = Number(
    valueArg(args, "--prompt-timeout-minutes") ?? "10",
  );
  assert.ok(Number.isFinite(timeoutMinutes) && timeoutMinutes > 0);
  const noiseScale = Number(valueArg(args, "--noise-scale") ?? "1");
  assert.ok(
    Number.isInteger(noiseScale) && noiseScale >= 1,
    "--noise-scale must be an integer >= 1",
  );
  const analyzeRun = valueArg(args, "--analyze-run");
  return {
    conditions: conditionsList,
    outDir: path.resolve(valueArg(args, "--out") ?? defaultOutDir),
    modelSlug: valueArg(args, "--model") ?? requiredModelSlug(),
    promptTimeoutMs: timeoutMinutes * 60_000,
    noiseScale,
    prepareOnly: hasArg(args, "--prepare-only"),
    keepWorktrees: hasArg(args, "--keep-worktrees"),
    analyzeRun: analyzeRun ? path.resolve(analyzeRun) : undefined,
  };
}

function valueArg(args: string[], name: string) {
  const equals = args.find((arg) => arg.startsWith(`${name}=`));
  if (equals) return equals.slice(name.length + 1);
  const index = args.indexOf(name);
  if (index >= 0) return args[index + 1];
  return undefined;
}

function hasArg(args: string[], name: string) {
  return args.includes(name);
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function prepareFixtureRepo(worktree: string) {
  await fs.rm(worktree, { recursive: true, force: true });
  await fs.mkdir(path.join(worktree, "src"), { recursive: true });
  await fs.writeFile(
    path.join(worktree, "README.md"),
    [
      "# Reversible Memory Fixture",
      "",
      "Small fixture repository for task-switch and memory-recovery checks.",
      "The active issue is about CSV header parsing, not auth or docs.",
      "",
    ].join("\n"),
  );
  await fs.writeFile(
    path.join(worktree, "src", "csv_parser.ts"),
    [
      "export function parseHeader(line: string) {",
      "  return line.split(',');",
      "}",
      "",
    ].join("\n"),
  );
  await execFileAsync("git", ["init"], { cwd: worktree });
  await execFileAsync("git", ["add", "."], { cwd: worktree });
  await execFileAsync(
    "git",
    [
      "-c",
      "user.name=Reversible Memory",
      "-c",
      "user.email=reversible-memory@example.com",
      "commit",
      "-m",
      "seed reversible memory fixture",
    ],
    { cwd: worktree },
  );
}

type OpenCodeRoot = {
  home: string;
  data: string;
  config: string;
  state: string;
  cache: string;
};

async function resolveOpenCodeRoot(
  conditionDir: string,
): Promise<OpenCodeRoot> {
  const seeded = process.env.DECANT_E2E_TEMP_ROOT;
  if (seeded) {
    return {
      home: path.join(seeded, "home"),
      data: path.join(seeded, "data"),
      config: path.join(seeded, "config"),
      state: path.join(seeded, "state"),
      cache: path.join(seeded, "cache"),
    };
  }
  const root = path.join(conditionDir, "opencode-root");
  return {
    home: path.join(root, "home"),
    data: path.join(root, "data"),
    config: path.join(root, "config"),
    state: path.join(root, "state"),
    cache: path.join(root, "cache"),
  };
}

async function buildOpenCodeEnv(input: {
  opencodeRoot: OpenCodeRoot;
  conditionDir: string;
  modelSlug: string;
  plugin: boolean;
}) {
  await Promise.all(
    Object.values(input.opencodeRoot).map((dir) =>
      fs.mkdir(dir, { recursive: true }),
    ),
  );
  const config: Record<string, unknown> = {
    $schema: "https://opencode.ai/config.json",
    model: input.modelSlug,
  };
  if (input.plugin) {
    config.plugin = [
      pathToFileURL(path.join(repoRoot, "src", "server-plugin.ts")).href,
    ];
  }
  const authContent = await seededAuthContent();
  return {
    ...process.env,
    HOME: input.opencodeRoot.home,
    XDG_DATA_HOME: input.opencodeRoot.data,
    XDG_CONFIG_HOME: input.opencodeRoot.config,
    XDG_STATE_HOME: input.opencodeRoot.state,
    XDG_CACHE_HOME: input.opencodeRoot.cache,
    OPENCODE_DB: path.join(input.conditionDir, "opencode.sqlite"),
    OPENCODE_DISABLE_PROJECT_CONFIG: "1",
    DECANT_DISABLE_GIT_HOOK_INSTALL: "1",
    DECANT_TRACE_CONTEXT_PAYLOAD: input.plugin ? "1" : undefined,
    OPENCODE_CONFIG_CONTENT: JSON.stringify(config),
    ...(authContent ? { OPENCODE_AUTH_CONTENT: authContent } : {}),
  } satisfies NodeJS.ProcessEnv;
}

async function seededAuthContent() {
  const seeded = process.env.DECANT_E2E_TEMP_ROOT;
  if (!seeded) return undefined;
  return await fs
    .readFile(path.join(seeded, "data", "opencode", "auth.json"), "utf8")
    .catch(() => undefined);
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
      if (proc.exitCode !== null) return;
      proc.kill("SIGTERM");
      await new Promise((resolve) => proc.once("exit", resolve));
    },
  };
}

async function pickModel(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  modelSlug: string,
) {
  const requested = parseModelSlug(modelSlug);
  const providers = await listProviders(client, directory);
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

async function requestContextCleanup(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  sessionID: string,
  timeoutMs: number,
) {
  await prompt(
    client,
    directory,
    sessionID,
    [
      "We are ending the old auth/docs/test planning work and switching to a wholly unrelated CSV parser issue.",
      "Call view_context exactly once to inspect the topic map.",
      "No prior topic is current for the next CSV task. Keep the route back to exact messages available through Decant tools. Then answer with only ok.",
    ].join("\n"),
    "You must call view_context before answering. Do not call set_fidelity in this turn. Do not edit repository files. Avoid unrelated tools.",
    { view_context: true },
    timeoutMs,
  );
}

async function forceKnownStaleTopicsHidden(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  sessionID: string,
  timeoutMs: number,
) {
  for (const topicID of ["auth_rate_limiter", "topics_for_onboarding"]) {
    await prompt(
      client,
      directory,
      sessionID,
      [
        `Call set_fidelity exactly once with topic_id='${topicID}' and fidelity='hidden'.`,
        "Do not call tools in parallel. Then answer with only ok.",
      ].join("\n"),
      "Use only set_fidelity. Do not edit files.",
      { set_fidelity: true },
      timeoutMs,
    ).catch(() => undefined);
  }
}

async function writeRgbRawLog(worktree: string, messages: SessionMessage[]) {
  const recallDir = path.join(worktree, "recall");
  await fs.mkdir(recallDir, { recursive: true });
  const log = messages
    .map((message, index) => {
      const role = message.info?.role ?? message.role ?? "unknown";
      return [
        `## message ${index + 1}`,
        `role: ${role}`,
        messageText(message),
        "",
      ].join("\n");
    })
    .join("\n");
  await fs.writeFile(path.join(recallDir, "log.txt"), log);
}

function buildRgbCleanupSystemPrompt() {
  return [
    "You are an RGB-agent context editor for a reversible-memory benchmark.",
    "Use only read, grep, and bash over recall/log.txt.",
    "Treat recall/log.txt as the external context variable.",
    "Write the rewritten current-context view to recall/rgb-context.md using bash/python3.",
    "The rewritten file is prompt-visible, so do not copy exact stale identifiers into it.",
  ].join(" ");
}

function buildRgbCleanupPrompt(worktree: string) {
  return [
    `Raw log: ${path.join(worktree, "recall", "log.txt")}`,
    "",
    "The old log contains unrelated auth/docs/test planning. The next task is unrelated CSV parser work.",
    "Rewrite the context so the next prompt sees only the current CSV task boundary and no old auth/docs/test facts.",
    "Do not write exact stale identifiers, old flag names, old test names, old docs terms, queue helper names, or mutex names into recall/rgb-context.md.",
    "",
    "Write recall/rgb-context.md with this shape:",
    "# RGB Context",
    "decision: hidden_stale_history",
    "current_task: <CSV parser task in one sentence>",
    "keep: <only facts needed for the current task>",
    "policy: prior unrelated work was removed; no old identifiers preserved",
  ].join("\n");
}

function buildRgbImmediatePrompt(rgbContext: string) {
  return [
    "RGB-agent rewritten context:",
    "```md",
    rgbContext.trim(),
    "```",
    "",
    "Use only the rewritten context above as prior conversation history. Do not use or mention hidden stale topics.",
    "",
    immediatePrompt,
  ].join("\n");
}

function buildRgbRecoveryPrompt() {
  return [
    "Use only the rewritten context already visible in this session. Do not read files and do not use hidden raw logs.",
    "If the requested old fact was removed from the rewritten context, say unknown rather than guessing.",
    "",
    recoveryPrompt,
  ].join("\n");
}

function buildDefaultCompactionSystemPrompt() {
  return [
    "You are simulating default conversation compaction for a reversible-memory benchmark.",
    "Use only read, grep, and bash over recall/log.txt.",
    "Write the compacted summary to recall/default-compaction.md using bash/python3.",
    "Preserve concrete decisions, identifiers, flags, test names, files, and task-boundary notes that may matter later.",
    "Do not intentionally hide stale details; this is blind compaction, not curated cleanup.",
  ].join(" ");
}

function buildDefaultCompactionPrompt(worktree: string) {
  return [
    `Raw log: ${path.join(worktree, "recall", "log.txt")}`,
    "",
    "Create a compact default-style conversation summary for future assistant turns.",
    "Keep exact names for important old facts if they appear, including rollout flags, failed tests, accepted/rejected designs, files, and APIs.",
    "Also preserve the fact that the conversation is switching away from old auth/docs/test planning to a separate CSV parser task.",
    "Do not perform RGB cleanup and do not remove old identifiers merely because they are stale.",
    "",
    "Write recall/default-compaction.md with this shape:",
    "# Default Compaction Summary",
    "current_boundary: <what the next task boundary is>",
    "prior_auth_facts: <compact exact facts>",
    "prior_docs_facts: <compact docs/stale-hypothesis facts if present>",
    "policy: this is a blind summary of prior conversation, not a filtered context map",
  ].join("\n");
}

function buildDefaultCompactionImmediatePrompt(compactionContext: string) {
  return [
    "Default compaction summary from prior conversation:",
    "```md",
    compactionContext.trim(),
    "```",
    "",
    "Treat the summary above as prior conversation context.",
    "",
    immediatePrompt,
  ].join("\n");
}

function buildDefaultCompactionRecoveryPrompt() {
  return [
    "Use only the default compaction summary already visible in this session. Do not read files.",
    "If an exact old fact is absent from the summary, say unknown rather than guessing.",
    "",
    recoveryPrompt,
  ].join("\n");
}

async function readDefaultCompactionContext(worktree: string) {
  return await fs
    .readFile(path.join(worktree, "recall", "default-compaction.md"), "utf8")
    .catch(() => "");
}

function buildDecantGuidedRgbEvidenceSystemPrompt() {
  return [
    "You are a Decant-guided RGB evidence editor.",
    "Use Decant session tools first to recover exact historical facts from the prior auth memory session.",
    "Call session_lookup at least once and message_detail at least once before writing the evidence file.",
    "Use bash or write only to write recall/rgb-context.md. Do not edit source files.",
  ].join(" ");
}

function buildDecantGuidedRgbEvidencePrompt(worktree: string) {
  return [
    "Recover only these old auth facts from Decant memory:",
    "1. rollback flag",
    "2. failed concurrency test name",
    "3. accepted design",
    "4. rejected design, including the phrase global mutex if the old discussion rejected it",
    "",
    "Do not copy unrelated docs or stale-hypothesis details.",
    `Write the evidence capsule to ${path.join(worktree, "recall", "rgb-context.md")}.`,
    "Use this exact shape:",
    "# Decant-Guided RGB Context",
    "rollback_flag: <exact flag>",
    "failed_test: <exact test name>",
    "accepted_design: <short design>",
    "rejected_design: <short rejected design; include global mutex if supported>",
    "citation: <session/message evidence from Decant>",
    "policy: only requested old auth facts were copied",
  ].join("\n");
}

function buildRgbRecoveryFinalPrompt(rgbContext: string) {
  return [
    "Decant-guided RGB evidence:",
    "```md",
    rgbContext.trim(),
    "```",
    "",
    "Use only the evidence file above as prior memory. Do not mention unrelated hidden topics.",
    "",
    recoveryPrompt,
  ].join("\n");
}

async function readRgbContext(worktree: string) {
  return await fs
    .readFile(path.join(worktree, "recall", "rgb-context.md"), "utf8")
    .catch(() => "");
}

async function archiveRgbRawLog(worktree: string, conditionDir: string) {
  const source = path.join(worktree, "recall", "log.txt");
  const dest = path.join(conditionDir, "raw-log.txt");
  await fs.rename(source, dest).catch(async (error: unknown) => {
    const code =
      error && typeof error === "object"
        ? (error as { code?: string }).code
        : undefined;
    if (code !== "ENOENT") throw error;
  });
}

async function prompt(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  sessionID: string,
  text: string,
  system: string | undefined,
  tools: Record<string, boolean> | undefined,
  timeoutMs: number,
) {
  const before = await listSessionMessages(client, directory, sessionID);
  const beforeIDs = new Set(before.map((message) => message.info?.id));
  const raw = (await withTimeout(
    client.session.promptAsync({
      directory,
      sessionID,
      system,
      tools,
      parts: [{ type: "text", text }],
    }) as Promise<unknown>,
    timeoutMs,
    `prompt timed out in ${sessionID}`,
  )) as { data?: { error?: unknown }; error?: unknown };
  const reply = raw.data ?? raw ?? {};
  if (reply.error) throw new Error(JSON.stringify(reply.error));
  return await waitForAssistantMessage(
    client,
    directory,
    sessionID,
    beforeIDs,
    timeoutMs,
  );
}

async function waitForAssistantMessage(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  sessionID: string,
  beforeIDs: Set<string | undefined>,
  timeoutMs: number,
) {
  const deadline = Date.now() + timeoutMs;
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

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
) {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function promptVisibleTextFromTrace(input: {
  opencodeRoot: OpenCodeRoot;
  sessionID: string;
  promptNeedle: string;
}) {
  const tracePath = path.join(
    input.opencodeRoot.home,
    ".opencode",
    "context-maps",
    `${input.sessionID}.trace.jsonl`,
  );
  const raw = await fs.readFile(tracePath, "utf8").catch(() => "");
  const entries = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as {
          event?: string;
          payload_messages?: unknown;
        };
      } catch {
        return undefined;
      }
    })
    .filter(Boolean);
  const matching = entries.filter((entry) => {
    if (entry?.event !== "messages.transform") return false;
    const text = payloadMessagesText(entry.payload_messages);
    return text.includes(input.promptNeedle);
  });
  return payloadMessagesText(matching.at(-1)?.payload_messages);
}

function payloadMessagesText(payload: unknown) {
  if (!Array.isArray(payload)) return "";
  const chunks: string[] = [];
  for (const message of payload) {
    if (!message || typeof message !== "object") continue;
    const parts = (message as { parts?: unknown }).parts;
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      if (!part || typeof part !== "object") continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") chunks.push(text);
    }
  }
  return chunks.join("\n");
}

async function copyContextArtifacts(
  home: string,
  sessionID: string,
  conditionDir: string,
) {
  const mapsDir = path.join(home, ".opencode", "context-maps");
  const files = [
    [`${sessionID}.json`, "context-map.json"],
    [`${sessionID}.trace.jsonl`, "trace.jsonl"],
    [`${sessionID}.debug.json`, "debug.json"],
  ] as const;
  for (const [sourceName, destName] of files) {
    const content = await fs
      .readFile(path.join(mapsDir, sourceName))
      .catch(() => undefined);
    if (content) await fs.writeFile(path.join(conditionDir, destName), content);
  }
}

function buildStats(input: {
  condition: ConditionConfig;
  sessionID?: string;
  messages: SessionMessage[];
  phaseMessages?: PhaseMessages;
  immediateAssistant: SessionMessage;
  recoveryAssistant: SessionMessage;
  visibleContextText: string;
  rgbContext: string;
  startedAt: number;
}): RunStats {
  const immediateOutput = messageText(input.immediateAssistant);
  const recoveryOutput = messageText(input.recoveryAssistant);
  const visibleContextStaleTerms = termsInText(
    cleanupStaleTerms,
    input.visibleContextText,
  );
  const immediateStaleTerms = termsInText(cleanupStaleTerms, immediateOutput);
  const immediateCurrentTaskTerms = termsInText(
    currentTaskTerms,
    immediateOutput,
  );
  const recoveryHits = recoveryRequiredHits(recoveryOutput);
  const recoveryExtraStaleTerms = termsInText(
    recoveryLeakTerms,
    recoveryOutput,
  );
  const toolNames = input.messages
    .flatMap((message) => toolParts(message.parts))
    .map((part) => part.tool)
    .filter((tool): tool is string => Boolean(tool));
  const contextToolCallCount = toolNames.filter((tool) =>
    [
      "view_context",
      "set_fidelity",
      "session_lookup",
      "session_detail",
      "message_detail",
    ].includes(tool),
  ).length;
  const cleanupPassed =
    visibleContextStaleTerms.length === 0 &&
    immediateStaleTerms.length === 0 &&
    immediateCurrentTaskTerms.length >= 2;
  const recoveryPassed = Object.values(recoveryHits).every(Boolean);
  const extraStaleLeakPassed = recoveryExtraStaleTerms.length === 0;
  const routePassed = routePolicyPassed(
    input.condition,
    toolNames,
    input.rgbContext,
  );
  const tokens = summarizeTokens(input.messages);
  const phaseTokens = summarizePhaseTokens(input.phaseMessages);
  return {
    condition: input.condition.id,
    session_id: input.sessionID,
    duration_ms: Date.now() - input.startedAt,
    message_count: input.messages.length,
    tool_call_count: toolNames.length,
    tool_names: toolNames,
    context_tool_call_count: contextToolCallCount,
    immediate_output_preview: immediateOutput.slice(0, 800),
    recovery_output_preview: recoveryOutput.slice(0, 1200),
    visible_context_stale_terms: visibleContextStaleTerms,
    immediate_stale_terms: immediateStaleTerms,
    immediate_current_task_terms: immediateCurrentTaskTerms,
    recovery_required_hits: recoveryHits,
    recovery_extra_stale_terms: recoveryExtraStaleTerms,
    citation_present:
      /\b(msg|message|session|ses)_[A-Za-z0-9_-]+\b|message[_ -]?id|session[_ -]?id/i.test(
        recoveryOutput,
      ),
    rgb_context_present:
      input.condition.mode !== "rgb" && input.condition.mode !== "hybrid"
        ? true
        : input.rgbContext.trim().length > 0,
    rgb_context_preview: input.rgbContext.slice(0, 800),
    cleanup_passed: cleanupPassed,
    recovery_passed: recoveryPassed,
    extra_stale_leak_passed: extraStaleLeakPassed,
    route_passed: routePassed,
    overall_passed:
      cleanupPassed && recoveryPassed && extraStaleLeakPassed && routePassed,
    tokens,
    phase_tokens: phaseTokens,
    phase_estimated_cost_usd: {
      prep: estimateCost(phaseTokens.prep),
      cleanup: estimateCost(phaseTokens.cleanup),
      recovery: estimateCost(phaseTokens.recovery),
    },
    cache_hit_share: cacheHitShare(tokens),
    estimated_cost_usd: estimateCost(tokens),
  };
}

function recoveryRequiredHits(text: string) {
  return {
    rollback_flag: /FLAG_AUTH_QUEUE_ROLLBACK/.test(text),
    failed_test: /auth_refresh_deduplicates_parallel_requests/.test(text),
    accepted_design:
      /per[- ]tenant/i.test(text) && /(queue|coalesc|deduplicat)/i.test(text),
    rejected_design:
      /global mutex/i.test(text) &&
      /(reject|rejected|replaced|instead|not)/i.test(text),
  };
}

function routePolicyPassed(
  condition: ConditionConfig,
  toolNames: string[],
  rgbContext: string,
) {
  const contextTools = toolNames.filter((tool) =>
    [
      "view_context",
      "set_fidelity",
      "session_lookup",
      "session_detail",
      "message_detail",
    ].includes(tool),
  );
  const fileTools = toolNames.filter((tool) =>
    ["read", "grep", "bash", "write"].includes(tool),
  );
  if (condition.mode === "default")
    return (
      contextTools.length === 0 &&
      !toolNames.includes("grep") &&
      !toolNames.includes("bash") &&
      !toolNames.includes("write")
    );
  if (condition.mode === "compaction") {
    return rgbContext.trim().length > 0 && contextTools.length === 0;
  }
  if (condition.mode === "rgb") {
    return (
      rgbContext.trim().length > 0 &&
      contextTools.length === 0 &&
      fileTools.length > 0
    );
  }
  if (condition.mode === "decant") {
    return (
      contextTools.includes("session_lookup") &&
      contextTools.includes("message_detail") &&
      contextTools.length > 0 &&
      !toolNames.includes("bash") &&
      !toolNames.includes("grep")
    );
  }
  return (
    rgbContext.trim().length > 0 &&
    contextTools.includes("session_lookup") &&
    contextTools.includes("message_detail") &&
    (fileTools.includes("bash") || fileTools.includes("write"))
  );
}

function toolParts(parts: SessionMessage["parts"]) {
  return (parts ?? []).filter((part) => part.type === "tool");
}

function messageText(message: SessionMessage | undefined) {
  return (message?.parts ?? [])
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("\n");
}

function termsInText(terms: string[], text: string) {
  const lowered = text.toLowerCase();
  return terms.filter((term) => lowered.includes(term.toLowerCase()));
}

function emptyTokenBucket(): TokenBucket {
  return {
    messages: 0,
    assistant: 0,
    input: 0,
    output: 0,
    total: 0,
    reasoning: 0,
    cacheRead: 0,
    cacheWrite: 0,
    toolCalls: 0,
    maxInput: 0,
  };
}

function summarizeTokens(messages: SessionMessage[]) {
  const bucket = emptyTokenBucket();
  bucket.messages = messages.length;
  for (const message of messages) {
    if ((message.info?.role ?? message.role) === "assistant")
      bucket.assistant += 1;
    const tokens = message.info?.tokens;
    if (tokens) {
      bucket.input += tokens.input ?? 0;
      bucket.output += tokens.output ?? 0;
      bucket.total += tokens.total ?? 0;
      bucket.reasoning += tokens.reasoning ?? 0;
      bucket.cacheRead += tokens.cache?.read ?? 0;
      bucket.cacheWrite += tokens.cache?.write ?? 0;
      bucket.maxInput = Math.max(bucket.maxInput, tokens.input ?? 0);
    }
    bucket.toolCalls += toolParts(message.parts).length;
  }
  return bucket;
}

function summarizePhaseTokens(phases?: PhaseMessages): PhaseTokenBuckets {
  return {
    prep: summarizeTokens(phases?.prep ?? []),
    cleanup: summarizeTokens(phases?.cleanup ?? []),
    recovery: summarizeTokens(phases?.recovery ?? []),
  };
}

function messageID(message: SessionMessage) {
  return message.info?.id ?? (message as { id?: string }).id;
}

function messagesAfter(
  before: SessionMessage[],
  after: SessionMessage[],
): SessionMessage[] {
  const beforeIDs = new Set(
    before.map((message) => messageID(message)).filter(Boolean),
  );
  return after.filter((message) => !beforeIDs.has(messageID(message)));
}

function cacheHitShare(tokens: TokenBucket) {
  const denominator = tokens.input + tokens.cacheRead;
  if (denominator === 0) return null;
  return tokens.cacheRead / denominator;
}

function estimateCost(tokens: TokenBucket) {
  return (
    (tokens.input * 5) / 1_000_000 +
    (tokens.cacheRead * 0.5) / 1_000_000 +
    ((tokens.output + tokens.reasoning) * 30) / 1_000_000
  );
}

async function writeSummary(
  outDir: string,
  results: RunResult[],
  options: Options,
) {
  const lines = [
    "# Reversible Memory Run",
    "",
    `- Model: ${options.modelSlug}`,
    `- Conditions: ${options.conditions.join(", ")}`,
    `- Noise scale: ${options.noiseScale}`,
    "",
    "## Results",
    "",
    "| Condition | Cleanup Pass | Recovery Pass | Route Pass | Stats | Error |",
    "|---|---:|---:|---:|---|---|",
  ];
  for (const result of results) {
    const statsRel = path
      .relative(outDir, result.statsPath)
      .replaceAll(path.sep, "/");
    lines.push(
      `| ${result.condition} | ${boolCell(result.cleanupPassed)} | ${boolCell(result.recoveryPassed)} | ${boolCell(result.routePassed)} | [stats](${statsRel}) | ${escapeCell(result.error ?? "")} |`,
    );
  }
  lines.push(
    "",
    "## Interpretation",
    "",
    "This test separates prompt cleanup from later historical recovery. RGB should be strong at one-off cleanup. Decant should be strong when old context must be hidden from the prompt but still recoverable by exact-message tools.",
  );
  await fs.writeFile(path.join(outDir, "summary.md"), `${lines.join("\n")}\n`);
}

async function analyzeRun(outDir: string): Promise<RunAnalysis> {
  const rows: AnalysisRow[] = [];
  for (const conditionID of Object.keys(conditions) as ConditionID[]) {
    const statsPath = path.join(
      outDir,
      "conditions",
      conditionID,
      "stats.json",
    );
    const raw = await fs.readFile(statsPath, "utf8").catch(() => undefined);
    if (!raw) continue;
    const parsed = JSON.parse(raw) as Partial<RunStats> & { error?: string };
    if (parsed.error) continue;
    rows.push({ ...(parsed as RunStats), stats_path: statsPath });
  }
  return { outDir, generatedAt: new Date().toISOString(), rows };
}

async function writeRunAnalysis(outDir: string) {
  const analysis = await analyzeRun(outDir);
  await writeAnalysisFiles(outDir, analysis);
}

async function writeAnalysisFiles(outDir: string, analysis: RunAnalysis) {
  await fs.writeFile(
    path.join(outDir, "analysis.json"),
    `${JSON.stringify(analysis, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outDir, "analysis.md"),
    `${runAnalysisMarkdown(analysis)}\n`,
  );
}

function runAnalysisMarkdown(analysis: RunAnalysis) {
  const lines = [
    "# Reversible Memory Analysis",
    "",
    `- Run: ${analysis.outDir}`,
    `- Generated: ${analysis.generatedAt}`,
    "",
    "| Condition | Clean Prompt | Recovered Old Fact | No Extra Stale Leak | Route | Input Tok | Cached Tok | Output + Reasoning Tok | Est. Cost |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];
  for (const row of analysis.rows) {
    lines.push(
      `| ${row.condition} | ${String(row.cleanup_passed)} | ${String(row.recovery_passed)} | ${String(row.extra_stale_leak_passed)} | ${String(row.route_passed)} | ${row.tokens.input.toLocaleString()} | ${row.tokens.cacheRead.toLocaleString()} | ${(row.tokens.output + row.tokens.reasoning).toLocaleString()} | $${row.estimated_cost_usd.toFixed(2)} |`,
    );
  }
  lines.push("", "## Phase Token Split", "");
  lines.push(
    "| Condition | Prep Input | Cleanup Input | Recovery Input | Prep Cost | Cleanup Cost | Recovery Cost |",
  );
  lines.push("|---|---:|---:|---:|---:|---:|---:|");
  for (const row of analysis.rows) {
    const prep = phaseTokens(row, "prep");
    const cleanup = phaseTokens(row, "cleanup");
    const recovery = phaseTokens(row, "recovery");
    lines.push(
      `| ${row.condition} | ${prep.input.toLocaleString()} | ${cleanup.input.toLocaleString()} | ${recovery.input.toLocaleString()} | $${phaseCost(row, "prep").toFixed(2)} | $${phaseCost(row, "cleanup").toFixed(2)} | $${phaseCost(row, "recovery").toFixed(2)} |`,
    );
  }
  lines.push("", "## Details", "");
  lines.push(
    "| Condition | Visible Stale Terms | Recovery Hits | Recovery Extra Terms | Tools |",
  );
  lines.push("|---|---|---|---|---|");
  for (const row of analysis.rows) {
    const hits = Object.entries(row.recovery_required_hits)
      .map(([key, value]) => `${key}:${String(value)}`)
      .join(", ");
    lines.push(
      `| ${row.condition} | ${escapeCell(row.visible_context_stale_terms.join(", "))} | ${escapeCell(hits)} | ${escapeCell(row.recovery_extra_stale_terms.join(", "))} | ${escapeCell(row.tool_names.join(", "))} |`,
    );
  }
  return lines.join("\n");
}

function phaseTokens(row: AnalysisRow, phase: keyof PhaseTokenBuckets) {
  return row.phase_tokens?.[phase] ?? emptyTokenBucket();
}

function phaseCost(row: AnalysisRow, phase: keyof PhaseTokenBuckets) {
  return (
    row.phase_estimated_cost_usd?.[phase] ?? estimateCost(phaseTokens(row, phase))
  );
}

function boolCell(value: boolean | undefined) {
  return typeof value === "boolean" ? String(value) : "";
}

function escapeCell(value: string) {
  return value.replaceAll("|", "\\|").replaceAll("\n", "<br>");
}

function formatTimestampPart(value: number) {
  return value.toString().padStart(2, "0");
}

function timestampForPath(date: Date) {
  return [
    date.getUTCFullYear(),
    formatTimestampPart(date.getUTCMonth() + 1),
    formatTimestampPart(date.getUTCDate()),
    "T",
    formatTimestampPart(date.getUTCHours()),
    formatTimestampPart(date.getUTCMinutes()),
    formatTimestampPart(date.getUTCSeconds()),
    "Z",
  ].join("");
}

await main();
