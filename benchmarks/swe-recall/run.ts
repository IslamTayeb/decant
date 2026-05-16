import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { createOpencodeClient } from "@opencode-ai/sdk/v2";

import { parseModelSlug, requiredModelSlug } from "../../tools/model";
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
  "swe-recall",
  "runs",
  timestampForPath(new Date()),
);

type ConditionID =
  | "code-only"
  | "rlm-transcript-search"
  | "decant-only"
  | "decant-guided-rlm";

const defaultConditions: ConditionID[] = [
  "code-only",
  "rlm-transcript-search",
  "decant-only",
  "decant-guided-rlm",
];

type SwebenchInstance = {
  instance_id: string;
  repo: string;
  base_commit: string;
  problem_statement: string;
  version?: string;
  patch?: string;
  test_patch?: string;
  hints_text?: string;
  created_at?: string;
  environment_setup_commit?: string;
  difficulty?: string;
  fail_to_pass: string[];
  pass_to_pass: string[];
};

type SwebenchScore = {
  patch_applies: boolean | null;
  resolved: boolean | null;
  fail_to_pass_success: number;
  fail_to_pass_failure: number;
  fail_to_pass_total: number;
  fail_to_pass_score: number | null;
  pass_to_pass_success: number;
  pass_to_pass_failure: number;
  pass_to_pass_total: number;
  regression_penalty: number;
  quality_score: number | null;
};

type HistoricalSession = {
  staticID: string;
  title: string;
  role: "relevant" | "distractor";
  messages: Array<{ id: string; text: string; supportsTask?: boolean }>;
};

type MemoryCorpus = {
  recallRole: "helpful" | "unavailable";
  relevant?: HistoricalSession;
  distractors: HistoricalSession[];
};

type SeededSessions = {
  relevantSessionID?: string;
  relevantMessageIDs: string[];
  sessions: Array<{
    id: string;
    staticID: string;
    title: string;
    role: "relevant" | "distractor";
  }>;
};

type SessionMessage = {
  id?: string;
  info?: {
    id?: string;
    role?: string;
    finish?: string;
    providerID?: string;
    modelID?: string;
    tokens?: {
      input?: number;
      output?: number;
      total?: number;
      reasoning?: number;
      cache?: { read?: number; write?: number };
    };
    error?: unknown;
  };
  error?: unknown;
  role?: string;
  parts?: Array<{
    type: string;
    text?: string;
    tool?: string;
    state?: { status?: string; input?: unknown; output?: unknown };
  }>;
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

type Options = {
  dataset: string;
  split: string;
  instances: string[];
  distractors: string[];
  conditions: ConditionID[];
  outDir: string;
  modelSlug: string;
  evalRunner: "python" | "uv";
  maxCandidates: number;
  skipEval: boolean;
  prepareOnly: boolean;
  keepWorktrees: boolean;
  selectCandidates: boolean;
  promptTimeoutMs: number;
  analyzeRun?: string;
};

type RunResult = {
  condition: ConditionID;
  instanceID: string;
  statsPath: string;
  predictionPath: string;
  patchPath: string;
  sessionID?: string;
  resolved?: boolean | null;
  error?: string;
};

type RunStats = {
  instance_id: string;
  repo: string;
  condition: ConditionID;
  recall_role: MemoryCorpus["recallRole"];
  memory_available: boolean;
  session_id: string;
  benchmark_passed: boolean;
  recall_benchmark_passed: boolean;
  swebench_resolved: boolean | null;
  swebench_score: SwebenchScore | null;
  swebench_eval_path?: string;
  swebench_eval_error?: string;
  recall_policy_passed: boolean;
  tool_path_passed: boolean;
  tool_path_failures: string[];
  citation_hits: string[];
  recall_decision: string;
  relevant_session_id: string;
  relevant_message_ids: string[];
  patch_bytes: number;
  touched_files: string[];
  tool_names: string[];
  context_tool_call_count: number;
  transcript_files_read: string[];
  irrelevant_transcript_reads: string[];
  tokens: TokenBucket;
  models: string[];
  output_preview: string;
  duration_ms: number;
  error?: string;
};

type Analysis = {
  outDir: string;
  generatedAt: string;
  rows: RunStats[];
};

const contextTools = new Set([
  "session_lookup",
  "session_detail",
  "message_detail",
  "blame_lookup",
  "view_context",
  "set_fidelity",
]);

async function main() {
  const options = await parseOptions();

  if (options.analyzeRun) {
    const analysis = await analyzeRun(options.analyzeRun);
    await writeAnalysisFiles(options.analyzeRun, analysis);
    console.log(renderAnalysisMarkdown(analysis));
    return;
  }

  await fs.mkdir(options.outDir, { recursive: true });

  if (options.prepareOnly) {
    await fs.writeFile(
      path.join(options.outDir, "config.json"),
      `${JSON.stringify(options, null, 2)}\n`,
    );
    await writeSummary(options.outDir, [], options);
    console.log(`Prepared SWE recall metadata at ${options.outDir}`);
    return;
  }

  const allRows = await loadSwebenchDatasetRows(options.dataset, options.split);
  if (options.selectCandidates) {
    const candidates = rankCandidates(allRows).slice(0, options.maxCandidates);
    await writeCandidateReport(options.outDir, options, candidates);
    console.log(candidateReportMarkdown(candidates, options));
    return;
  }

  const instances = selectInstances(allRows, options.instances);
  await fs.writeFile(
    path.join(options.outDir, "config.json"),
    `${JSON.stringify({ ...options, instances }, null, 2)}\n`,
  );

  const results: RunResult[] = [];
  for (const condition of options.conditions) {
    for (const instance of instances) {
      const result = await runConditionInstance(
        condition,
        instance,
        allRows,
        options,
      );
      results.push(result);
      await writeSummary(options.outDir, results, options);
    }
  }

  await writeSummary(options.outDir, results, options);
  const analysis = await analyzeRun(options.outDir);
  await writeAnalysisFiles(options.outDir, analysis);
  console.log(renderAnalysisMarkdown(analysis));
  console.log(`SWE recall artifacts written to ${options.outDir}`);
}

async function parseOptions(): Promise<Options> {
  const args = process.argv.slice(2);
  const analyzeRun = valueArg(args, "--analyze-run");
  const selectCandidates = hasArg(args, "--select-candidates");
  const prepareOnly = hasArg(args, "--prepare-only");
  const modelArg = valueArg(args, "--model");
  const modelSlug =
    analyzeRun || selectCandidates || prepareOnly
      ? (modelArg ?? process.env.DECANT_E2E_MODEL ?? "")
      : requiredModelSlug(modelArg, { cliFlag: "--model" });
  if (modelSlug) parseModelSlug(modelSlug);

  const conditionArg = valueArg(args, "--conditions");
  const conditions = (
    conditionArg ? splitList(conditionArg) : defaultConditions
  ) as ConditionID[];
  for (const condition of conditions) {
    assert.ok(
      defaultConditions.includes(condition),
      `unknown condition ${condition}; expected one of ${defaultConditions.join(", ")}`,
    );
  }

  const evalRunner = (valueArg(args, "--eval-runner") ??
    "python") as Options["evalRunner"];
  assert.ok(
    evalRunner === "python" || evalRunner === "uv",
    "--eval-runner must be python or uv",
  );

  const timeoutMinutes = Number(
    valueArg(args, "--prompt-timeout-minutes") ?? "25",
  );
  assert.ok(Number.isFinite(timeoutMinutes) && timeoutMinutes > 0);
  const maxCandidates = Number(valueArg(args, "--max-candidates") ?? "25");
  assert.ok(Number.isFinite(maxCandidates) && maxCandidates > 0);

  return {
    dataset: valueArg(args, "--dataset") ?? "SWE-bench/SWE-bench_Verified",
    split: valueArg(args, "--split") ?? "test",
    instances: valueArg(args, "--instances")
      ? splitList(valueArg(args, "--instances")!)
      : valueArg(args, "--instance")
        ? splitList(valueArg(args, "--instance")!)
        : await readDefaultInstances(),
    distractors: valueArg(args, "--distractors")
      ? splitList(valueArg(args, "--distractors")!)
      : [],
    conditions,
    outDir: path.resolve(valueArg(args, "--out") ?? defaultOutDir),
    modelSlug,
    evalRunner,
    maxCandidates,
    skipEval: hasArg(args, "--skip-eval"),
    prepareOnly,
    keepWorktrees: hasArg(args, "--keep-worktrees"),
    selectCandidates,
    promptTimeoutMs: timeoutMinutes * 60_000,
    analyzeRun: analyzeRun ? path.resolve(analyzeRun) : undefined,
  };
}

async function readDefaultInstances() {
  const raw = await fs.readFile(
    path.join(repoRoot, "benchmarks", "swebench-context", "instances.json"),
    "utf8",
  );
  const parsed = JSON.parse(raw) as { instances?: unknown };
  assert.ok(Array.isArray(parsed.instances), "instances.json missing instances");
  return parsed.instances.map(String);
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

async function runConditionInstance(
  condition: ConditionID,
  instance: SwebenchInstance,
  allRows: SwebenchInstance[],
  options: Options,
): Promise<RunResult> {
  const conditionDir = path.join(
    options.outDir,
    "instances",
    instance.instance_id,
    "conditions",
    condition,
  );
  const worktree = path.join(conditionDir, "worktree");
  const statsPath = path.join(conditionDir, "stats.json");
  const predictionPath = path.join(conditionDir, "prediction.jsonl");
  const patchPath = path.join(conditionDir, "patch.diff");
  await fs.mkdir(conditionDir, { recursive: true });
  const startedAt = Date.now();
  let server: Awaited<ReturnType<typeof startServer>> | undefined;

  try {
    await prepareWorktree(instance, worktree);
    await fs.writeFile(
      path.join(conditionDir, "issue.md"),
      `# ${instance.instance_id}\n\n${instance.problem_statement}\n`,
    );

    const corpus = buildMemoryCorpus(instance, allRows, options.distractors);
    if (condition === "rlm-transcript-search") {
      await writeTranscriptCorpus(worktree, corpus, staticSeededSessions(corpus));
    }

    const opencodeRoot = resolveOpenCodeRoot(conditionDir);
    const env = await buildOpenCodeEnv({
      opencodeRoot,
      conditionDir,
      modelSlug: options.modelSlug,
      plugin: usesDecant(condition),
    });
    server = await startServer(env, worktree);
    const client = createOpencodeClient({ baseUrl: server.url });
    await pickModel(client, worktree, options.modelSlug);

    const seeded = usesDecant(condition)
      ? await seedHistoricalSessions(
          client,
          worktree,
          corpus,
          options.promptTimeoutMs,
        )
      : staticSeededSessions(corpus);
    if (condition === "decant-guided-rlm") {
      await writeTranscriptCorpus(worktree, corpus, seeded);
    }

    const sessionID = await createSession(
      client,
      worktree,
      `${instance.instance_id} ${condition}`,
    );
    await prompt(
      client,
      worktree,
      sessionID,
      buildSolvePrompt(instance, condition, corpus, worktree),
      buildSystemPrompt(condition),
      solveTools(condition),
      options.promptTimeoutMs,
    );

    const messages = await listSessionMessages(client, worktree, sessionID);
    await fs.writeFile(
      path.join(conditionDir, "messages.json"),
      `${JSON.stringify(messages, null, 2)}\n`,
    );
    await copyContextMaps(opencodeRoot.home, conditionDir);

    const patch = await gitDiff(worktree);
    await fs.writeFile(patchPath, patch);
    await writePrediction(predictionPath, condition, instance, patch, options);

    const evalResult = options.skipEval
      ? { resolved: null, score: null, outputPath: undefined }
      : await runSwebenchEval(options, condition, instance, predictionPath);
    const stats = buildStats({
      condition,
      instance,
      corpus,
      seeded,
      sessionID,
      messages,
      patch,
      evalResult,
      startedAt,
    });
    await fs.writeFile(statsPath, `${JSON.stringify(stats, null, 2)}\n`);

    if (!options.keepWorktrees) {
      await fs.rm(worktree, { recursive: true, force: true });
    }

    return {
      condition,
      instanceID: instance.instance_id,
      statsPath,
      predictionPath,
      patchPath,
      sessionID,
      resolved: evalResult.resolved,
    };
  } catch (error) {
    const message =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    await fs.writeFile(
      statsPath,
      `${JSON.stringify(failedStats(instance, condition, startedAt, message), null, 2)}\n`,
    );
    return {
      condition,
      instanceID: instance.instance_id,
      statsPath,
      predictionPath,
      patchPath,
      error: message,
    };
  } finally {
    await server?.close();
  }
}

function usesDecant(condition: ConditionID) {
  return condition === "decant-only" || condition === "decant-guided-rlm";
}

function hasTranscriptCorpus(condition: ConditionID) {
  return condition === "rlm-transcript-search" || condition === "decant-guided-rlm";
}

function solveTools(condition: ConditionID): Record<string, boolean> {
  const codingTools = {
    glob: true,
    grep: true,
    read: true,
    bash: true,
    apply_patch: true,
  };
  if (!usesDecant(condition)) return codingTools;
  return {
    ...codingTools,
    session_lookup: true,
    session_detail: true,
    message_detail: true,
  };
}

function buildMemoryCorpus(
  instance: SwebenchInstance,
  allRows: SwebenchInstance[],
  distractorIDs: string[],
): MemoryCorpus {
  const memory = memoryText(instance);
  const relevant = memory
    ? {
        staticID: staticSessionID("prior", instance.instance_id),
        title: `Prior issue discussion for ${instance.instance_id}`,
        role: "relevant" as const,
        messages: [
          {
            id: "prior_issue_discussion",
            supportsTask: true,
            text: memory,
          },
        ],
      }
    : undefined;

  const distractorRows = selectDistractorRows(instance, allRows, distractorIDs);
  const distractors = distractorRows.map((row) => ({
    staticID: staticSessionID("distractor", row.instance_id),
    title: `Unrelated prior SWE issue ${row.instance_id}`,
    role: "distractor" as const,
    messages: [
      {
        id: "unrelated_issue_notes",
        text: [
          `Repository: ${row.repo}`,
          `Instance: ${row.instance_id}`,
          "These notes are from a different SWE-bench issue and should not be copied into the current fix unless the repository issue is actually the same.",
          "Prior notes:",
          clip(memoryText(row) || row.problem_statement, 3_000),
        ].join("\n"),
      },
    ],
  }));
  return {
    recallRole: relevant ? "helpful" : "unavailable",
    relevant,
    distractors,
  };
}

function memoryText(instance: SwebenchInstance) {
  const hints = instance.hints_text?.trim();
  if (!hints) return "";
  return [
    "Prior issue-discussion notes captured before this solve.",
    "These notes come from the SWE-bench row's hints_text, not from the gold patch.",
    `Repository: ${instance.repo}`,
    `Instance: ${instance.instance_id}`,
    "",
    clip(hints, 8_000),
  ].join("\n");
}

function selectDistractorRows(
  instance: SwebenchInstance,
  allRows: SwebenchInstance[],
  distractorIDs: string[],
) {
  const explicit = distractorIDs.length
    ? selectInstances(allRows, distractorIDs)
    : allRows;
  return explicit
    .filter((row) => row.instance_id !== instance.instance_id)
    .filter((row) => row.repo !== instance.repo || memoryText(row))
    .slice(0, 3);
}

function staticSessionID(prefix: string, instanceID: string) {
  return `${prefix}_${instanceID}`.replaceAll(/[^a-zA-Z0-9_]/g, "_");
}

function staticSeededSessions(corpus: MemoryCorpus): SeededSessions {
  return {
    relevantSessionID: corpus.relevant?.staticID,
    relevantMessageIDs:
      corpus.relevant?.messages
        .filter((message) => message.supportsTask)
        .map((message) => message.id) ?? [],
    sessions: [...(corpus.relevant ? [corpus.relevant] : []), ...corpus.distractors].map(
      (session) => ({
        id: session.staticID,
        staticID: session.staticID,
        title: session.title,
        role: session.role,
      }),
    ),
  };
}

async function seedHistoricalSessions(
  client: ReturnType<typeof createOpencodeClient>,
  worktree: string,
  corpus: MemoryCorpus,
  timeoutMs: number,
): Promise<SeededSessions> {
  const sessions: SeededSessions["sessions"] = [];
  let relevantSessionID: string | undefined;
  let relevantMessageIDs: string[] = [];
  for (const source of [
    ...(corpus.relevant ? [corpus.relevant] : []),
    ...corpus.distractors,
  ]) {
    const sessionID = await createSession(client, worktree, source.title);
    await prompt(
      client,
      worktree,
      sessionID,
      transcriptMarkdown(source.staticID, source.title, source.messages),
      "Preserve this prior SWE-bench exploration record for a recall benchmark. Do not edit files or call tools. Acknowledge concisely while retaining implementation-relevant facts.",
      {},
      timeoutMs,
    );
    sessions.push({
      id: sessionID,
      staticID: source.staticID,
      title: source.title,
      role: source.role,
    });
    if (source.role === "relevant") {
      relevantSessionID = sessionID;
      relevantMessageIDs = (await listSessionMessages(client, worktree, sessionID))
        .map((message) => message.info?.id ?? message.id)
        .filter((id): id is string => Boolean(id));
    }
  }
  return { relevantSessionID, relevantMessageIDs, sessions };
}

async function writeTranscriptCorpus(
  worktree: string,
  corpus: MemoryCorpus,
  seeded: SeededSessions,
) {
  const dir = path.join(worktree, "recall", "transcripts");
  await fs.mkdir(dir, { recursive: true });
  const sources = [
    ...(corpus.relevant ? [corpus.relevant] : []),
    ...corpus.distractors,
  ];
  const manifestSessions: Array<{
    session_id: string;
    title: string;
    file: string;
    role: string;
  }> = [];
  for (const source of sources) {
    const seededSession = seeded.sessions.find(
      (session) => session.staticID === source.staticID,
    );
    const sessionID = seededSession?.id ?? source.staticID;
    const messageID =
      seededSession?.role === "relevant"
        ? seeded.relevantMessageIDs[0]
        : undefined;
    const fileName = `${source.staticID}--${sessionID}.md`;
    await fs.writeFile(
      path.join(dir, fileName),
      transcriptMarkdown(
        sessionID,
        source.title,
        source.messages,
        messageID,
      ),
    );
    manifestSessions.push({
      session_id: sessionID,
      title: source.title,
      file: fileName,
      role: source.role,
    });
  }
  await fs.writeFile(
    path.join(worktree, "recall", "manifest.json"),
    `${JSON.stringify(
      {
        transcript_dir: "recall/transcripts",
        id_policy:
          "Cite the session_id and message heading id in transcript files. Hybrid Decant transcripts use real OpenCode IDs.",
        sessions: manifestSessions,
      },
      null,
      2,
    )}\n`,
  );
}

function transcriptMarkdown(
  sessionID: string,
  title: string,
  messages: HistoricalSession["messages"],
  relevantMessageID?: string,
) {
  return [
    `# ${title}`,
    `session_id: ${sessionID}`,
    `title: ${title}`,
    "",
    ...messages.flatMap((message, index) => [
      `## message ${index === 0 && relevantMessageID ? relevantMessageID : message.id}`,
      message.text,
      "",
    ]),
  ].join("\n");
}

function buildSystemPrompt(condition: ConditionID) {
  const base =
    "You are solving a SWE-bench recall benchmark. Edit the repository as needed, run focused tests if useful, and do not commit changes. The current problem statement and repository behavior are authoritative; reject stale prior context.";
  if (condition === "code-only") {
    return `${base} No prior session context is available in this condition.`;
  }
  if (condition === "rlm-transcript-search") {
    return `${base} Prior transcript files may contain useful issue-discussion notes or unrelated distractors. Use transcript search/read only when it helps. Do not use Decant session tools.`;
  }
  if (condition === "decant-only") {
    return `${base} Prior sessions may contain useful issue-discussion notes or unrelated distractors. Use Decant session tools when prior memory may affect the fix. No transcript corpus is available.`;
  }
  return `${base} Prior sessions and transcript files may contain useful issue-discussion notes or unrelated distractors. Use Decant tools as the routing layer; corroborate with transcript search only if needed.`;
}

function buildSolvePrompt(
  instance: SwebenchInstance,
  condition: ConditionID,
  corpus: MemoryCorpus,
  worktree: string,
) {
  const transcriptDir = path.join(worktree, "recall", "transcripts");
  const memoryInstruction = (() => {
    if (condition === "code-only") {
      return "No prior context corpus is available. Solve from the repository and problem statement only.";
    }
    if (!corpus.relevant) {
      return "No relevant prior issue-discussion memory is available. If you inspect memory, treat it as potentially unrelated and do not invent provenance.";
    }
    if (condition === "rlm-transcript-search") {
      return `Optional transcript corpus: ${transcriptDir}. It may include a prior issue-discussion note for this exact instance plus unrelated SWE distractors. Search only if it helps.`;
    }
    if (condition === "decant-only") {
      return [
        "No transcript corpus is available in this condition.",
        "Use session_lookup/session_detail/message_detail if prior issue-discussion memory may help this exact SWE-bench instance.",
      ].join("\n");
    }
    return [
      `Optional transcript corpus: ${transcriptDir}.`,
      "Use Decant session_lookup/session_detail/message_detail first to route to the relevant prior issue-discussion session.",
      "Use transcript search only to corroborate details if needed.",
    ].join("\n");
  })();

  return [
    `SWE-bench instance: ${instance.instance_id}`,
    `Repository: ${instance.repo}`,
    `Base commit: ${instance.base_commit}`,
    "",
    "Problem statement:",
    instance.problem_statement,
    "",
    memoryInstruction,
    "",
    "Modify the repository to resolve the issue. Keep the patch minimal.",
    "After editing, respond with compact JSON only:",
    '{"summary":"...","tests":"...","recall_decision":"used|ignored|rejected|abstained|unavailable","evidence":{"session_id":"","message_id":""}}',
    "If you used prior memory, cite the exact session_id and message_id. If memory was irrelevant, stale, or unavailable, leave evidence fields empty and explain the decision briefly.",
  ].join("\n");
}

async function prepareWorktree(instance: SwebenchInstance, worktree: string) {
  await fs.rm(worktree, { recursive: true, force: true });
  await fs.mkdir(path.dirname(worktree), { recursive: true });
  await execFileAsync(
    "git",
    [
      "clone",
      "--filter=blob:none",
      "--no-tags",
      `https://github.com/${instance.repo}.git`,
      worktree,
    ],
    { maxBuffer: 20 * 1024 * 1024 },
  );
  await execFileAsync("git", ["checkout", instance.base_commit], {
    cwd: worktree,
    maxBuffer: 20 * 1024 * 1024,
  });
}

type OpenCodeRoot = {
  home: string;
  data: string;
  config: string;
  state: string;
  cache: string;
};

function resolveOpenCodeRoot(conditionDir: string): OpenCodeRoot {
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
    DECANT_CACHE_STABLE: "1",
    DECANT_STABLE_PLACEHOLDERS: "1",
    DECANT_STABLE_ANCHORS: "1",
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
    { cwd, env, stdio: ["ignore", "pipe", "pipe"] },
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
    `provider is not connected in isolated sandbox: ${requested.providerID}`,
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
    }),
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
    const assistant = [...messages].reverse().find((message) => {
      const role = message.info?.role ?? message.role;
      const id = message.info?.id ?? message.id;
      const finish = message.info?.finish;
      return (
        role === "assistant" &&
        !beforeIDs.has(id) &&
        finish &&
        finish !== "tool-calls"
      );
    });
    if (assistant) return assistant;
    const errored = [...messages].reverse().find((message) => {
      const role = message.info?.role ?? message.role;
      const id = message.info?.id ?? message.id;
      return role === "assistant" && !beforeIDs.has(id) && (message.info?.error ?? message.error);
    });
    if (errored) {
      throw new Error(
        `assistant error in ${sessionID}: ${JSON.stringify(errored.info?.error ?? errored.error)}`,
      );
    }
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

async function gitDiff(worktree: string) {
  const { stdout } = await execFileAsync("git", ["diff", "--binary"], {
    cwd: worktree,
    maxBuffer: 100 * 1024 * 1024,
  });
  return stdout;
}

async function copyContextMaps(home: string, conditionDir: string) {
  const mapsDir = path.join(home, ".opencode", "context-maps");
  const entries = await fs.readdir(mapsDir).catch(() => [] as string[]);
  if (entries.length === 0) return;
  const outDir = path.join(conditionDir, "context-maps");
  await fs.mkdir(outDir, { recursive: true });
  for (const entry of entries) {
    const source = path.join(mapsDir, entry);
    const dest = path.join(outDir, entry);
    const stat = await fs.stat(source).catch(() => undefined);
    if (stat?.isFile()) await fs.copyFile(source, dest);
  }
}

async function writePrediction(
  file: string,
  condition: ConditionID,
  instance: SwebenchInstance,
  patch: string,
  options: Options,
) {
  const prediction = {
    instance_id: instance.instance_id,
    model_name_or_path: `${condition}-${options.modelSlug.replaceAll("/", "-")}-opencode`,
    model_patch: patch,
  };
  await fs.writeFile(file, `${JSON.stringify(prediction)}\n`);
}

async function runSwebenchEval(
  options: Options,
  condition: ConditionID,
  instance: SwebenchInstance,
  predictionPath: string,
) {
  const runID = `decant-swe-recall-${condition}-${instance.instance_id}-${Date.now()}`.replaceAll(
    /[^a-zA-Z0-9_.-]/g,
    "-",
  );
  const evalDir = path.join(
    options.outDir,
    "swebench-evaluation",
    condition,
    instance.instance_id,
  );
  await fs.mkdir(evalDir, { recursive: true });
  try {
    const command = swebenchEvalCommand(
      options,
      predictionPath,
      instance.instance_id,
      runID,
    );
    const { stdout, stderr } = await execFileAsync(command.file, command.args, {
      cwd: evalDir,
      maxBuffer: 100 * 1024 * 1024,
    });
    await fs.writeFile(path.join(evalDir, "stdout.txt"), stdout);
    await fs.writeFile(path.join(evalDir, "stderr.txt"), stderr);
    const score = await inferScoreFromEvaluation(evalDir, instance.instance_id);
    return { resolved: score?.resolved ?? null, score, outputPath: evalDir };
  } catch (error) {
    const message =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    await fs.writeFile(path.join(evalDir, "error.txt"), message);
    return { resolved: null, score: null, outputPath: evalDir, error: message };
  }
}

function swebenchEvalCommand(
  options: Options,
  predictionPath: string,
  instanceID: string,
  runID: string,
) {
  const moduleArgs = [
    "-m",
    "swebench.harness.run_evaluation",
    "--dataset_name",
    options.dataset,
    "--predictions_path",
    predictionPath,
    "--instance_ids",
    instanceID,
    "--max_workers",
    "1",
    "--run_id",
    runID,
  ];
  if (options.evalRunner === "uv") {
    return {
      file: "uv",
      args: [
        "run",
        "--python",
        "3.11",
        "--with",
        "swebench",
        "python",
        ...moduleArgs,
      ],
    };
  }
  return { file: "python3", args: moduleArgs };
}

async function inferScoreFromEvaluation(evalDir: string, instanceID: string) {
  const files = await listFilesRecursive(evalDir);
  for (const file of files.filter(
    (item) => item.endsWith(".json") || item.endsWith(".jsonl"),
  )) {
    const text = await fs.readFile(file, "utf8").catch(() => "");
    if (!text.includes(instanceID)) continue;
    for (const line of text.split("\n").filter(Boolean)) {
      try {
        const parsed = JSON.parse(line) as Record<string, unknown>;
        const score = scoreFromParsedReport(parsed, instanceID);
        if (score) return score;
      } catch {
        try {
          const parsed = JSON.parse(text) as Record<string, unknown>;
          const score = scoreFromParsedReport(parsed, instanceID);
          if (score) return score;
        } catch {}
      }
    }
  }
  return undefined;
}

function scoreFromParsedReport(
  parsed: Record<string, unknown>,
  instanceID: string,
): SwebenchScore | undefined {
  const instanceReport = parsed[instanceID];
  if (instanceReport && typeof instanceReport === "object") {
    const report = instanceReport as Record<string, unknown>;
    const tests =
      report.tests_status && typeof report.tests_status === "object"
        ? (report.tests_status as Record<string, unknown>)
        : {};
    const failToPass = testStatusCounts(tests.FAIL_TO_PASS);
    const passToPass = testStatusCounts(tests.PASS_TO_PASS);
    const failToPassTotal = failToPass.success + failToPass.failure;
    const passToPassTotal = passToPass.success + passToPass.failure;
    const failToPassScore =
      failToPassTotal === 0 ? null : failToPass.success / failToPassTotal;
    const regressionPenalty =
      passToPassTotal === 0 ? 0 : passToPass.failure / passToPassTotal;
    return {
      patch_applies:
        typeof report.patch_successfully_applied === "boolean"
          ? report.patch_successfully_applied
          : null,
      resolved: typeof report.resolved === "boolean" ? report.resolved : null,
      fail_to_pass_success: failToPass.success,
      fail_to_pass_failure: failToPass.failure,
      fail_to_pass_total: failToPassTotal,
      fail_to_pass_score: failToPassScore,
      pass_to_pass_success: passToPass.success,
      pass_to_pass_failure: passToPass.failure,
      pass_to_pass_total: passToPassTotal,
      regression_penalty: regressionPenalty,
      quality_score:
        failToPassScore === null ? null : failToPassScore - regressionPenalty,
    };
  }
  if (typeof parsed.resolved === "boolean") {
    return {
      patch_applies: null,
      resolved: parsed.resolved,
      fail_to_pass_success: 0,
      fail_to_pass_failure: 0,
      fail_to_pass_total: 0,
      fail_to_pass_score: null,
      pass_to_pass_success: 0,
      pass_to_pass_failure: 0,
      pass_to_pass_total: 0,
      regression_penalty: 0,
      quality_score: null,
    };
  }
  return undefined;
}

function testStatusCounts(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { success: 0, failure: 0 };
  }
  const record = value as Record<string, unknown>;
  return {
    success: Array.isArray(record.success) ? record.success.length : 0,
    failure: Array.isArray(record.failure) ? record.failure.length : 0,
  };
}

async function listFilesRecursive(dir: string): Promise<string[]> {
  const entries = await fs
    .readdir(dir, { withFileTypes: true })
    .catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listFilesRecursive(full)));
    else files.push(full);
  }
  return files;
}

function buildStats(input: {
  condition: ConditionID;
  instance: SwebenchInstance;
  corpus: MemoryCorpus;
  seeded: SeededSessions;
  sessionID: string;
  messages: SessionMessage[];
  patch: string;
  evalResult: {
    resolved: boolean | null;
    score?: SwebenchScore | null;
    outputPath?: string;
    error?: string;
  };
  startedAt: number;
}): RunStats {
  const outputText = messageText(latestAssistantMessage(input.messages));
  const tools = toolParts(input.messages);
  const toolNames = tools.map((part) => part.tool).filter(Boolean) as string[];
  const transcriptFilesRead = transcriptReadFiles(tools);
  const citationHits = citationMatches(outputText, input.seeded);
  const recallPolicy = evaluateRecallPolicy({
    condition: input.condition,
    corpus: input.corpus,
    outputText,
    toolNames,
    transcriptFilesRead,
    citationHits,
  });
  const toolPath = evaluateToolPath(input.condition, toolNames, transcriptFilesRead);
  const irrelevantReads = transcriptFilesRead.filter(
    (filePath) => filePath.includes("distractor_") || /decoy/i.test(filePath),
  );
  const recallBenchmarkPassed = recallPolicy.passed && toolPath.passed;
  const benchmarkPassed =
    input.evalResult.resolved === true && recallBenchmarkPassed;
  return {
    instance_id: input.instance.instance_id,
    repo: input.instance.repo,
    condition: input.condition,
    recall_role: input.corpus.recallRole,
    memory_available: Boolean(input.corpus.relevant),
    session_id: input.sessionID,
    benchmark_passed: benchmarkPassed,
    recall_benchmark_passed: recallBenchmarkPassed,
    swebench_resolved: input.evalResult.resolved,
    swebench_score: input.evalResult.score ?? null,
    swebench_eval_path: input.evalResult.outputPath,
    swebench_eval_error: input.evalResult.error,
    recall_policy_passed: recallPolicy.passed,
    tool_path_passed: toolPath.passed,
    tool_path_failures: [...toolPath.failures, ...recallPolicy.failures],
    citation_hits: citationHits,
    recall_decision: recallPolicy.decision,
    relevant_session_id: input.seeded.relevantSessionID ?? "",
    relevant_message_ids: input.seeded.relevantMessageIDs,
    patch_bytes: Buffer.byteLength(input.patch),
    touched_files: touchedFiles(input.patch),
    tool_names: toolNames,
    context_tool_call_count: toolNames.filter((tool) => contextTools.has(tool))
      .length,
    transcript_files_read: transcriptFilesRead,
    irrelevant_transcript_reads: irrelevantReads,
    tokens: summarizeTokens(input.messages),
    models: modelIDs(input.messages),
    output_preview: outputText.slice(0, 1200),
    duration_ms: Date.now() - input.startedAt,
  };
}

function failedStats(
  instance: SwebenchInstance,
  condition: ConditionID,
  startedAt: number,
  error: string,
): RunStats {
  return {
    instance_id: instance.instance_id,
    repo: instance.repo,
    condition,
    recall_role: "unavailable",
    memory_available: false,
    session_id: "",
    benchmark_passed: false,
    recall_benchmark_passed: false,
    swebench_resolved: null,
    swebench_score: null,
    recall_policy_passed: false,
    tool_path_passed: false,
    tool_path_failures: ["run_error"],
    citation_hits: [],
    recall_decision: "run_error",
    relevant_session_id: "",
    relevant_message_ids: [],
    patch_bytes: 0,
    touched_files: [],
    tool_names: [],
    context_tool_call_count: 0,
    transcript_files_read: [],
    irrelevant_transcript_reads: [],
    tokens: emptyTokenBucket(),
    models: [],
    output_preview: error.slice(0, 1200),
    duration_ms: Date.now() - startedAt,
    error,
  };
}

function evaluateToolPath(
  condition: ConditionID,
  toolNames: string[],
  transcriptFilesRead: string[],
) {
  const failures: string[] = [];
  const hasContext = toolNames.some((tool) => contextTools.has(tool));
  if (condition === "code-only" && hasContext) failures.push("context_tool_used");
  if (condition === "code-only" && transcriptFilesRead.length > 0) {
    failures.push("transcript_read_used");
  }
  if (condition === "rlm-transcript-search" && hasContext) {
    failures.push("context_tool_used");
  }
  if (condition === "decant-only" && transcriptFilesRead.length > 0) {
    failures.push("transcript_read_used");
  }
  return { passed: failures.length === 0, failures };
}

function evaluateRecallPolicy(input: {
  condition: ConditionID;
  corpus: MemoryCorpus;
  outputText: string;
  toolNames: string[];
  transcriptFilesRead: string[];
  citationHits: string[];
}) {
  const failures: string[] = [];
  const parsed = parseAnswer(input.outputText);
  const decision =
    typeof parsed?.recall_decision === "string"
      ? parsed.recall_decision
      : inferRecallDecision(input.outputText);
  const usedContext = input.toolNames.some((tool) => contextTools.has(tool));
  const usedTranscript = input.transcriptFilesRead.length > 0;
  const citedRelevant =
    input.citationHits.includes("session") &&
    input.citationHits.includes("message");

  if (input.condition === "code-only") {
    if (usedContext || usedTranscript || citedRelevant || /used/i.test(decision)) {
      failures.push("memory_used_in_code_only");
    }
  } else if (input.corpus.relevant) {
    if (!citedRelevant) failures.push("missing_relevant_recall_citation");
  } else if (usedContext || usedTranscript || /used/i.test(decision)) {
    failures.push("unsupported_recall_used");
  }

  for (const distractor of input.corpus.distractors) {
    if (
      input.outputText.includes(distractor.staticID) ||
      input.outputText.includes(distractor.title)
    ) {
      failures.push("distractor_cited");
      break;
    }
  }
  return { passed: failures.length === 0, failures, decision };
}

function citationMatches(outputText: string, seeded: SeededSessions) {
  const hits: string[] = [];
  if (seeded.relevantSessionID && outputText.includes(seeded.relevantSessionID)) {
    hits.push("session");
  }
  if (seeded.relevantMessageIDs.some((id) => outputText.includes(id))) {
    hits.push("message");
  }
  return [...new Set(hits)];
}

function parseAnswer(outputText: string) {
  try {
    return JSON.parse(outputText) as { recall_decision?: unknown };
  } catch {}
  const match = outputText.match(/\{[\s\S]*\}/);
  if (!match) return undefined;
  try {
    return JSON.parse(match[0]) as { recall_decision?: unknown };
  } catch {
    return undefined;
  }
}

function inferRecallDecision(outputText: string) {
  if (/abstain|unsupported|no prior|no supporting/i.test(outputText)) {
    return "abstained";
  }
  if (/reject|stale/i.test(outputText)) return "rejected";
  if (/ignore|irrelevant/i.test(outputText)) return "ignored";
  if (/session_id"\s*:\s*"[^"]+"/.test(outputText)) return "used";
  return "unknown";
}

function transcriptReadFiles(
  tools: Array<NonNullable<SessionMessage["parts"]>[number]>,
) {
  const files: string[] = [];
  for (const part of tools) {
    if (part.tool === "read") {
      const input = objectInput(part.state?.input);
      if (typeof input.filePath === "string") files.push(input.filePath);
      continue;
    }
    if (part.tool === "bash") {
      const input = objectInput(part.state?.input);
      const command = typeof input.command === "string" ? input.command : "";
      for (const match of command.matchAll(
        /[^\s"'`]+recall\/transcripts\/[^\s"'`]+/g,
      )) {
        files.push(match[0]);
      }
    }
  }
  return [
    ...new Set(
      files.filter((filePath) => filePath.includes("recall/transcripts")),
    ),
  ];
}

function toolParts(messages: SessionMessage[]) {
  return messages.flatMap((message) =>
    (message.parts ?? []).filter((part) => part.type === "tool"),
  );
}

function latestAssistantMessage(messages: SessionMessage[]) {
  return [...messages]
    .reverse()
    .find((message) => (message.info?.role ?? message.role) === "assistant");
}

function messageText(message: SessionMessage | undefined) {
  return (message?.parts ?? [])
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("\n");
}

function summarizeTokens(messages: SessionMessage[]) {
  const bucket = emptyTokenBucket();
  for (const message of messages) {
    bucket.messages++;
    if ((message.info?.role ?? message.role) !== "assistant") continue;
    bucket.assistant++;
    bucket.toolCalls += (message.parts ?? []).filter(
      (part) => part.type === "tool",
    ).length;
    const tokens = message.info?.tokens;
    if (!tokens) continue;
    bucket.input += tokens.input ?? 0;
    bucket.output += tokens.output ?? 0;
    bucket.total += tokens.total ?? 0;
    bucket.reasoning += tokens.reasoning ?? 0;
    bucket.cacheRead += tokens.cache?.read ?? 0;
    bucket.cacheWrite += tokens.cache?.write ?? 0;
    bucket.maxInput = Math.max(bucket.maxInput, tokens.input ?? 0);
  }
  return bucket;
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

function addTokenBuckets(left: TokenBucket, right: TokenBucket): TokenBucket {
  return {
    messages: left.messages + right.messages,
    assistant: left.assistant + right.assistant,
    input: left.input + right.input,
    output: left.output + right.output,
    total: left.total + right.total,
    reasoning: left.reasoning + right.reasoning,
    cacheRead: left.cacheRead + right.cacheRead,
    cacheWrite: left.cacheWrite + right.cacheWrite,
    toolCalls: left.toolCalls + right.toolCalls,
    maxInput: Math.max(left.maxInput, right.maxInput),
  };
}

function cacheHitShare(bucket: TokenBucket) {
  const denominator = bucket.input + bucket.cacheRead;
  return denominator === 0 ? null : bucket.cacheRead / denominator;
}

function modelIDs(messages: SessionMessage[]) {
  return [
    ...new Set(
      messages
        .map(
          (message) =>
            `${message.info?.providerID ?? ""}/${message.info?.modelID ?? ""}`,
        )
        .filter((value) => value !== "/"),
    ),
  ];
}

function touchedFiles(patch: string) {
  return [
    ...new Set(
      [...patch.matchAll(/^diff --git a\/(.*?) b\/(.*?)$/gm)].map(
        (match) => match[2]!,
      ),
    ),
  ];
}

function objectInput(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

async function loadSwebenchDatasetRows(dataset: string, split: string) {
  try {
    return await loadRowsFromHuggingFace(dataset, split);
  } catch (error) {
    console.warn(
      `Hugging Face rows API failed, trying python datasets fallback: ${String(error)}`,
    );
    return await loadRowsFromPythonDatasets(dataset, split);
  }
}

async function loadRowsFromHuggingFace(dataset: string, split: string) {
  const rows: SwebenchInstance[] = [];
  const pageSize = 100;
  for (let offset = 0; ; offset += pageSize) {
    const url = new URL("https://datasets-server.huggingface.co/rows");
    url.searchParams.set("dataset", dataset);
    url.searchParams.set("config", "default");
    url.searchParams.set("split", split);
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("length", String(pageSize));
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `${response.status} ${response.statusText} for ${url.toString()}`,
      );
    }
    const body = (await response.json()) as {
      rows?: Array<{ row?: unknown }>;
      num_rows_total?: number;
    };
    const page = body.rows ?? [];
    rows.push(...page.map((entry) => normalizeSwebenchRow(entry.row)));
    if (page.length === 0 || offset + pageSize >= (body.num_rows_total ?? 0)) {
      break;
    }
  }
  return rows;
}

async function loadRowsFromPythonDatasets(dataset: string, split: string) {
  const script = String.raw`
import json, sys
from datasets import load_dataset
dataset_name, split = sys.argv[1:3]
ds = load_dataset(dataset_name, split=split)
for row in ds:
    print(json.dumps(row))
`;
  const { stdout } = await execFileAsync(
    "python3",
    ["-c", script, dataset, split],
    { maxBuffer: 100 * 1024 * 1024 },
  );
  return stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => normalizeSwebenchRow(JSON.parse(line) as unknown));
}

function normalizeSwebenchRow(row: unknown): SwebenchInstance {
  assert.ok(row && typeof row === "object", "invalid SWE-bench row");
  const record = row as Record<string, unknown>;
  const instance = {
    instance_id: String(record.instance_id ?? ""),
    repo: String(record.repo ?? ""),
    base_commit: String(record.base_commit ?? ""),
    problem_statement: String(record.problem_statement ?? ""),
    version: record.version === undefined ? undefined : String(record.version),
    patch: record.patch === undefined ? undefined : String(record.patch),
    test_patch:
      record.test_patch === undefined ? undefined : String(record.test_patch),
    hints_text:
      record.hints_text === undefined ? undefined : String(record.hints_text),
    created_at:
      record.created_at === undefined ? undefined : String(record.created_at),
    environment_setup_commit:
      record.environment_setup_commit === undefined
        ? undefined
        : String(record.environment_setup_commit),
    difficulty:
      record.difficulty === undefined ? undefined : String(record.difficulty),
    fail_to_pass: parseJsonStringList(record.FAIL_TO_PASS),
    pass_to_pass: parseJsonStringList(record.PASS_TO_PASS),
  } satisfies SwebenchInstance;
  assert.ok(instance.instance_id, "SWE-bench row missing instance_id");
  assert.ok(instance.repo.includes("/"), `invalid repo: ${instance.repo}`);
  assert.ok(instance.base_commit, `missing base_commit: ${instance.instance_id}`);
  assert.ok(
    instance.problem_statement,
    `missing problem_statement: ${instance.instance_id}`,
  );
  return instance;
}

function parseJsonStringList(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value !== "string" || value.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function selectInstances(allRows: SwebenchInstance[], instanceIDs: string[]) {
  const found = new Map(allRows.map((row) => [row.instance_id, row]));
  const missing = instanceIDs.filter((id) => !found.has(id));
  assert.equal(
    missing.length,
    0,
    `missing SWE-bench instances: ${missing.join(", ")}`,
  );
  return instanceIDs.map((id) => found.get(id)!);
}

type Candidate = {
  instance: SwebenchInstance;
  score: number;
  hintBytes: number;
  failToPassCount: number;
  passToPassCount: number;
  reasons: string[];
  caveats: string[];
};

function rankCandidates(instances: SwebenchInstance[]): Candidate[] {
  return instances
    .map((instance) => scoreCandidate(instance))
    .sort((a, b) => b.score - a.score);
}

function scoreCandidate(instance: SwebenchInstance): Candidate {
  const hintBytes = Buffer.byteLength(memoryText(instance));
  const failToPassCount = instance.fail_to_pass.length;
  const passToPassCount = instance.pass_to_pass.length;
  const problemBytes = Buffer.byteLength(instance.problem_statement);
  const patchBytes = Buffer.byteLength(instance.patch ?? "");
  const score =
    Math.min(hintBytes / 25, 140) +
    Math.min(failToPassCount, 20) * 12 +
    Math.min(problemBytes / 350, 50) +
    Math.min(patchBytes / 150, 70) -
    (hintBytes === 0 ? 120 : 0) -
    (failToPassCount <= 1 ? 25 : 0);
  return {
    instance,
    score,
    hintBytes,
    failToPassCount,
    passToPassCount,
    reasons: [
      hintBytes > 0 ? `${hintBytes.toLocaleString()} hint bytes` : undefined,
      failToPassCount > 1 ? `${failToPassCount} target tests` : undefined,
      problemBytes > 3_000 ? "long issue text" : undefined,
      patchBytes > 2_000 ? "substantial gold patch" : undefined,
      instance.difficulty ? `difficulty ${instance.difficulty}` : undefined,
    ].filter((item): item is string => Boolean(item)),
    caveats: [
      hintBytes === 0 ? "no hints_text memory" : undefined,
      failToPassCount <= 1 ? "binary target-test signal" : undefined,
    ].filter((item): item is string => Boolean(item)),
  };
}

async function writeCandidateReport(
  outDir: string,
  options: Options,
  candidates: Candidate[],
) {
  await fs.writeFile(
    path.join(outDir, "candidates.md"),
    candidateReportMarkdown(candidates, options),
  );
  await fs.writeFile(
    path.join(outDir, "candidates.json"),
    `${JSON.stringify(candidates, null, 2)}\n`,
  );
}

function candidateReportMarkdown(candidates: Candidate[], options: Options) {
  return [
    "# SWE Recall Candidates",
    "",
    `- Dataset: ${options.dataset}`,
    `- Split: ${options.split}`,
    `- Max candidates: ${options.maxCandidates}`,
    "",
    "| Rank | Instance | Repo | Difficulty | F2P | P2P | Hint Bytes | Score | Why | Caveats |",
    "|---:|---|---|---|---:|---:|---:|---:|---|---|",
    ...candidates.map((candidate, index) => {
      const instance = candidate.instance;
      return `| ${index + 1} | \`${instance.instance_id}\` | ${instance.repo} | ${instance.difficulty ?? ""} | ${candidate.failToPassCount} | ${candidate.passToPassCount} | ${candidate.hintBytes.toLocaleString()} | ${candidate.score.toFixed(1)} | ${candidate.reasons.join(", ").replaceAll("|", "\\|")} | ${candidate.caveats.join(", ").replaceAll("|", "\\|")} |`;
    }),
    "",
  ].join("\n");
}

async function analyzeRun(outDir: string): Promise<Analysis> {
  const rows: RunStats[] = [];
  await collectStats(path.join(outDir, "instances"), rows);
  return {
    outDir,
    generatedAt: new Date().toISOString(),
    rows: rows.sort(compareRows),
  };
}

async function collectStats(dir: string, rows: RunStats[]) {
  const entries = await fs
    .readdir(dir, { withFileTypes: true })
    .catch(() => []);
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) await collectStats(filePath, rows);
    if (entry.isFile() && entry.name === "stats.json") {
      rows.push(JSON.parse(await fs.readFile(filePath, "utf8")) as RunStats);
    }
  }
}

function compareRows(a: RunStats, b: RunStats) {
  const instanceOrder = a.instance_id.localeCompare(b.instance_id);
  if (instanceOrder !== 0) return instanceOrder;
  return conditionSortIndex(a.condition) - conditionSortIndex(b.condition);
}

function conditionSortIndex(condition: ConditionID) {
  const index = defaultConditions.indexOf(condition);
  return index === -1 ? defaultConditions.length : index;
}

async function writeAnalysisFiles(outDir: string, analysis: Analysis) {
  await fs.writeFile(
    path.join(outDir, "analysis.json"),
    `${JSON.stringify(analysis, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outDir, "analysis.md"),
    renderAnalysisMarkdown(analysis),
  );
}

function renderAnalysisMarkdown(analysis: Analysis) {
  const codeOnlyByInstance = new Map(
    analysis.rows
      .filter((row) => row.condition === "code-only")
      .map((row) => [row.instance_id, row]),
  );
  const rows = analysis.rows.map(
    (row) => {
      const baseline = codeOnlyByInstance.get(row.instance_id);
      return `| ${row.instance_id} | ${row.condition} | ${row.recall_role} | ${String(row.benchmark_passed)} | ${String(row.recall_benchmark_passed)} | ${String(row.swebench_resolved)} | ${String(row.recall_policy_passed)} | ${row.tool_path_failures.join("; ")} | ${row.touched_files.join(", ")} | ${row.tokens.input.toLocaleString()} | ${formatDeltaPercent(row.tokens.input, baseline?.tokens.input)} | ${promptTokens(row.tokens).toLocaleString()} | ${formatDeltaPercent(promptTokens(row.tokens), baseline ? promptTokens(baseline.tokens) : undefined)} | ${row.tokens.cacheRead.toLocaleString()} | ${formatPercent(cacheHitShare(row.tokens))} | ${row.context_tool_call_count} | ${row.irrelevant_transcript_reads.length} |`;
    },
  );
  const byCondition = defaultConditions
    .map((condition) => {
      const matching = analysis.rows.filter((row) => row.condition === condition);
      if (matching.length === 0) return undefined;
      const tokens = matching.reduce(
        (bucket, row) => addTokenBuckets(bucket, row.tokens),
        emptyTokenBucket(),
      );
      const passed = matching.filter((row) => row.benchmark_passed).length;
      const recallPassed = matching.filter(
        (row) => row.recall_benchmark_passed,
      ).length;
      const resolved = matching.filter((row) => row.swebench_resolved).length;
      const recall = matching.filter((row) => row.recall_policy_passed).length;
      return `| ${condition} | ${passed}/${matching.length} | ${recallPassed}/${matching.length} | ${resolved}/${matching.length} | ${recall}/${matching.length} | ${tokens.input.toLocaleString()} | ${Math.round(tokens.input / matching.length).toLocaleString()} | ${promptTokens(tokens).toLocaleString()} | ${Math.round(promptTokens(tokens) / matching.length).toLocaleString()} | ${tokens.cacheRead.toLocaleString()} | ${formatPercent(cacheHitShare(tokens))} |`;
    })
    .filter((row): row is string => Boolean(row));
  return [
    "# SWE Recall Analysis",
    "",
    `- Run: ${analysis.outDir}`,
    `- Generated: ${analysis.generatedAt}`,
    `- Full pass: ${analysis.rows.filter((row) => row.benchmark_passed).length}/${analysis.rows.length}`,
    `- Recall-path pass: ${analysis.rows.filter((row) => row.recall_benchmark_passed).length}/${analysis.rows.length}`,
    "",
    "| Instance | Condition | Recall Role | Full Pass | Recall Pass | SWE Resolved | Recall Policy | Failures | Touched | Input Tok | Input Δ vs Code | Prompt Tok | Prompt Δ vs Code | Cache Read Tok | Cache Hit | Ctx Tools | Irrelevant Reads |",
    "|---|---|---|---:|---:|---:|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---:|",
    ...rows,
    "",
    "## By Condition",
    "",
    "| Condition | Full Pass | Recall Pass | SWE Resolved | Recall Policy | Total Input | Avg Input | Total Prompt | Avg Prompt | Cache Read | Cache Hit |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ...byCondition,
    "",
  ].join("\n");
}

async function writeSummary(
  outDir: string,
  results: RunResult[],
  options: Options,
) {
  const lines = [
    "# SWE Recall Run",
    "",
    `- Model: ${options.modelSlug || "<unset>"}`,
    `- Dataset: ${options.dataset}`,
    `- Instances: ${options.instances.join(", ")}`,
    `- Conditions: ${options.conditions.join(", ")}`,
    `- SWE-bench evaluation: ${options.prepareOnly ? "not run" : options.skipEval ? "skipped" : "attempted"}`,
    "",
    "| Instance | Condition | Resolved | Patch | Prediction | Stats | Error |",
    "|---|---|---:|---|---|---|---|",
    ...results.map((result) => {
      const error = result.error
        ? result.error.split("\n")[0]?.replaceAll("|", "\\|")
        : "";
      return `| ${result.instanceID} | ${result.condition} | ${result.resolved ?? ""} | [patch](${path.relative(outDir, result.patchPath)}) | [prediction](${path.relative(outDir, result.predictionPath)}) | [stats](${path.relative(outDir, result.statsPath)}) | ${error} |`;
    }),
    "",
    "## Caveat",
    "",
    "This uses real SWE-bench tasks and grading, but it is not leaderboard-comparable because prior issue-discussion memory is an experimental condition.",
    "",
  ];
  await fs.writeFile(path.join(outDir, "summary.md"), `${lines.join("\n")}\n`);
}

function formatPercent(value: number | null) {
  return value === null ? "" : `${(value * 100).toFixed(1)}%`;
}

function formatDeltaPercent(value: number, baseline: number | undefined) {
  if (!baseline) return "";
  const delta = (value - baseline) / baseline;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${(delta * 100).toFixed(1)}%`;
}

function promptTokens(tokens: TokenBucket) {
  return tokens.input + tokens.cacheRead;
}

function clip(text: string, limit: number) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n\n[truncated ${text.length - limit} chars]`;
}

function timestampForPath(date: Date) {
  return date.toISOString().replaceAll(":", "").replaceAll(".", "-");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
