import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { createOpencodeClient } from "@opencode-ai/sdk/v2";

import { parseModelSlug } from "../model";
import {
  createSession as createOpenCodeSession,
  listProviders,
  listSessionMessages as listOpenCodeSessionMessages,
} from "../opencode-sdk";

const repoRoot = path.resolve(process.cwd());
const defaultRun = path.join(
  repoRoot,
  "artifacts",
  "benchmark-runs",
  "reversible-memory",
  "gpt55-reversible-memory-final3-20260525",
);
const defaultOutDir = path.join(
  repoRoot,
  "artifacts",
  "benchmark-runs",
  "reversible-memory-judge",
  `judge-${timestampSlug()}`,
);

type Options = {
  run: string;
  outDir: string;
  modelSlug: string;
  promptTimeoutMs: number;
};

type SessionMessage = {
  info?: {
    id?: string;
    role?: string;
    finish?: string;
    tokens?: {
      input?: number;
      output?: number;
      total?: number;
      reasoning?: number;
      cache?: { read?: number; write?: number };
    };
  };
  role?: string;
  parts?: Array<{ type: string; text?: string }>;
};

type TokenBucket = {
  input?: number;
  output?: number;
  reasoning?: number;
  cacheRead?: number;
};

type RecoveryHits = {
  rollback_flag?: boolean;
  failed_test?: boolean;
  accepted_design?: boolean;
  rejected_design?: boolean;
};

type ReversibleRow = {
  condition: string;
  cleanup_passed: boolean;
  recovery_passed: boolean;
  extra_stale_leak_passed: boolean;
  route_passed: boolean;
  immediate_output_preview: string;
  recovery_output_preview: string;
  visible_context_stale_terms: string[];
  immediate_stale_terms: string[];
  immediate_current_task_terms: string[];
  recovery_required_hits: RecoveryHits;
  recovery_extra_stale_terms: string[];
  citation_present: boolean;
  tool_names: string[];
  tokens: TokenBucket;
};

type AnalysisFile = {
  outDir?: string;
  generatedAt?: string;
  rows: ReversibleRow[];
};

type JudgeJson = {
  clean_score_0_100?: unknown;
  recovery_score_0_100?: unknown;
  citation_score_0_100?: unknown;
  overall_score_0_100?: unknown;
  reason?: unknown;
  missing?: unknown;
  issues?: unknown;
};

type ScoreSet = {
  clean_score_0_100: number;
  recovery_score_0_100: number;
  citation_score_0_100: number;
  overall_score_0_100: number;
  clean_score_0_1: number;
  recovery_score_0_1: number;
  citation_score_0_1: number;
  overall_score_0_1: number;
  raw_clean_score_0_100: number;
  raw_recovery_score_0_100: number;
  raw_citation_score_0_100: number;
  raw_overall_score_0_100: number;
  cap_0_100: number;
  reason: string;
  missing: string[];
  issues: string[];
  raw_text: string;
};

type JudgeRecord = {
  condition: string;
  judge: ScoreSet;
  deterministic: {
    cleanup_passed: boolean;
    recovery_passed: boolean;
    extra_stale_leak_passed: boolean;
    route_passed: boolean;
    visible_context_stale_terms: string[];
    immediate_stale_terms: string[];
    recovery_required_hits: RecoveryHits;
    recovery_extra_stale_terms: string[];
    citation_present: boolean;
    tool_names: string[];
  };
  tokens: TokenBucket;
};

type SummaryRow = {
  condition: string;
  cases: number;
  clean_score_0_1: number;
  recovery_score_0_1: number;
  citation_score_0_1: number;
  overall_score_0_1: number;
  input_tokens: number;
  cached_input_tokens: number;
  output_reasoning_tokens: number;
  estimated_cost_usd: number;
};

type OutputAnalysis = {
  generatedAt: string;
  judgeModel: string;
  sourceRun: string;
  summaries: SummaryRow[];
  records: JudgeRecord[];
};

const conditionOrder = [
  "default",
  "default-compaction",
  "rgb-agent",
  "decant",
  "decant-guided-rgb",
];

async function main() {
  const options = parseOptions();
  const source = await readJson<AnalysisFile>(
    path.join(options.run, "analysis.json"),
  );
  const rows = selectedRows(source.rows);
  assert.ok(rows.length > 0, "no reversible-memory rows found to judge");

  await fs.mkdir(options.outDir, { recursive: true });
  await fs.writeFile(
    path.join(options.outDir, "config.json"),
    `${JSON.stringify(options, null, 2)}\n`,
  );

  const opencodeRoot = await makeOpenCodeRoot(options.outDir);
  const env = await buildOpenCodeEnv({
    opencodeRoot,
    modelSlug: options.modelSlug,
  });
  const server = await startServer(env, repoRoot);
  try {
    const client = createOpencodeClient({ baseUrl: server.url });
    await pickModel(client, repoRoot, options.modelSlug);

    const records: JudgeRecord[] = [];
    for (const row of rows) {
      const sessionID = await createSession(
        client,
        repoRoot,
        `Judge reversible-memory ${row.condition}`,
      );
      const assistant = await prompt(
        client,
        repoRoot,
        sessionID,
        judgePrompt(row),
        judgeSystemPrompt(),
        options.promptTimeoutMs,
      );
      const parsed = parseJudgeResult(messageText(assistant));
      const capped = applyCaps(parsed, row);
      records.push({
        condition: row.condition,
        judge: capped,
        deterministic: {
          cleanup_passed: row.cleanup_passed,
          recovery_passed: row.recovery_passed,
          extra_stale_leak_passed: row.extra_stale_leak_passed,
          route_passed: row.route_passed,
          visible_context_stale_terms: row.visible_context_stale_terms,
          immediate_stale_terms: row.immediate_stale_terms,
          recovery_required_hits: row.recovery_required_hits,
          recovery_extra_stale_terms: row.recovery_extra_stale_terms,
          citation_present: row.citation_present,
          tool_names: row.tool_names,
        },
        tokens: row.tokens,
      });
      await writePartial(options, records);
    }

    const analysis = buildOutputAnalysis(options, records);
    await writeAnalysis(options.outDir, analysis);
    console.log(
      `Reversible-memory judge analysis written to ${path.relative(repoRoot, options.outDir)}`,
    );
    console.log(renderMarkdown(analysis));
  } finally {
    await server.close();
  }
}

function parseOptions(): Options {
  let run = defaultRun;
  let outDir = defaultOutDir;
  let modelSlug =
    process.env.DECANT_E2E_JUDGE_MODEL?.trim() ||
    process.env.DECANT_E2E_MODEL?.trim() ||
    "";
  let promptTimeoutMs = 5 * 60_000;

  for (let index = 2; index < process.argv.length; index++) {
    const arg = process.argv[index]!;
    if (arg === "--run") {
      run = path.resolve(requireValue(arg, process.argv[++index]));
      continue;
    }
    if (arg.startsWith("--run=")) {
      run = path.resolve(arg.slice("--run=".length));
      continue;
    }
    if (arg === "--out") {
      outDir = path.resolve(requireValue(arg, process.argv[++index]));
      continue;
    }
    if (arg.startsWith("--out=")) {
      outDir = path.resolve(arg.slice("--out=".length));
      continue;
    }
    if (arg === "--model") {
      modelSlug = requireValue(arg, process.argv[++index]);
      continue;
    }
    if (arg.startsWith("--model=")) {
      modelSlug = arg.slice("--model=".length);
      continue;
    }
    if (arg === "--prompt-timeout-minutes") {
      promptTimeoutMs = minutesToMs(requireValue(arg, process.argv[++index]));
      continue;
    }
    if (arg.startsWith("--prompt-timeout-minutes=")) {
      promptTimeoutMs = minutesToMs(
        arg.slice("--prompt-timeout-minutes=".length),
      );
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  assert.ok(
    modelSlug,
    "Set DECANT_E2E_JUDGE_MODEL=<provider>/<model>, DECANT_E2E_MODEL=<provider>/<model>, or pass --model <provider>/<model>.",
  );
  parseModelSlug(modelSlug);
  return {
    run: path.resolve(run),
    outDir: path.resolve(outDir),
    modelSlug,
    promptTimeoutMs,
  };
}

function requireValue(flag: string, value: string | undefined) {
  if (!value || value.startsWith("--"))
    throw new Error(`${flag} requires a value`);
  return value;
}

function minutesToMs(value: string) {
  const minutes = Number(value);
  assert.ok(
    Number.isFinite(minutes) && minutes > 0,
    "timeout must be positive",
  );
  return minutes * 60_000;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

function selectedRows(rows: ReversibleRow[]) {
  const known = new Set(conditionOrder);
  return rows
    .filter((row) => known.has(row.condition))
    .sort(
      (a, b) =>
        conditionOrder.indexOf(a.condition) -
        conditionOrder.indexOf(b.condition),
    );
}

function judgeSystemPrompt() {
  return [
    "You are a strict benchmark judge.",
    "Score the candidate on semantic correctness, not formatting polish.",
    "Use 0-100 scores, where 100 means fully satisfies the rubric and 0 means unrelated or unusable.",
    "Return JSON only. No markdown fences.",
    'Use this exact shape: {"clean_score_0_100": number, "recovery_score_0_100": number, "citation_score_0_100": number, "overall_score_0_100": number, "reason": string, "missing": string[], "issues": string[]}.',
  ].join("\n");
}

function judgePrompt(row: ReversibleRow) {
  return [
    "Judge this reversible-memory benchmark output.",
    "The benchmark tests whether an agent can keep a new parser task clean from old auth/docs context, then later recover exact old auth facts when explicitly asked.",
    "Do not reward generic plausibility. Penalize stale-context leakage and missing exact facts.",
    "",
    "Expected immediate-answer behavior:",
    "- Stay on the current CSV/header/trim parser task.",
    "- Do not mention old auth, docs, onboarding, markdown parser, queue, mutex, rollback, or old test context unless directly relevant. It is not relevant for the immediate task.",
    "",
    "Expected recovery-answer facts:",
    "- rollback flag: FLAG_AUTH_QUEUE_ROLLBACK",
    "- failed test: auth_refresh_deduplicates_parallel_requests",
    "- accepted design: per-tenant async queue / queue helper where same-tenant refreshes coalesce or deduplicate and different tenants remain parallel",
    "- rejected design: one global mutex / MutexRefreshCoordinator",
    "- avoid unrelated docs, quickstart, onboarding, or markdown-parser chatter in the recovery answer",
    "",
    "Citation policy:",
    "- Full credit if the answer cites a useful session/message/tool evidence path when it claims recovered old facts.",
    "- Lower score if exact facts are present but the evidence path is vague or missing.",
    "",
    "Deterministic harness facts:",
    JSON.stringify(
      {
        condition: row.condition,
        cleanup_passed: row.cleanup_passed,
        recovery_passed: row.recovery_passed,
        extra_stale_leak_passed: row.extra_stale_leak_passed,
        route_passed: row.route_passed,
        visible_context_stale_terms: row.visible_context_stale_terms,
        immediate_stale_terms: row.immediate_stale_terms,
        immediate_current_task_terms: row.immediate_current_task_terms,
        recovery_required_hits: row.recovery_required_hits,
        recovery_extra_stale_terms: row.recovery_extra_stale_terms,
        citation_present: row.citation_present,
        tool_names: row.tool_names,
      },
      null,
      2,
    ),
    "",
    "Immediate answer:",
    row.immediate_output_preview,
    "",
    "Recovery answer:",
    row.recovery_output_preview,
  ].join("\n");
}

function parseJudgeResult(rawText: string): ScoreSet {
  const parsed = parseJudgeJson(rawText);
  const clean = normalizedScore(parsed.clean_score_0_100);
  const recovery = normalizedScore(parsed.recovery_score_0_100);
  const citation = normalizedScore(parsed.citation_score_0_100);
  const overall = normalizedScore(parsed.overall_score_0_100);
  return makeScoreSet({
    clean,
    recovery,
    citation,
    overall,
    rawClean: clean,
    rawRecovery: recovery,
    rawCitation: citation,
    rawOverall: overall,
    cap: 100,
    reason: stringFromUnknown(parsed.reason),
    missing: stringArray(parsed.missing),
    issues: stringArray(parsed.issues),
    rawText,
  });
}

function parseJudgeJson(rawText: string): JudgeJson {
  try {
    return JSON.parse(rawText) as JudgeJson;
  } catch {}
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`judge did not return JSON: ${rawText}`);
  return JSON.parse(match[0]) as JudgeJson;
}

function normalizedScore(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number))
    throw new Error(`judge score is not numeric: ${JSON.stringify(value)}`);
  return Math.max(0, Math.min(100, number));
}

function stringFromUnknown(value: unknown) {
  return typeof value === "string" ? value : "";
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function applyCaps(result: ScoreSet, row: ReversibleRow) {
  let cleanCap = 100;
  let recoveryCap = 100;
  let citationCap = 100;
  let overallCap = 100;

  if (!row.cleanup_passed || row.immediate_stale_terms.length > 0) {
    cleanCap = Math.min(cleanCap, 70);
    overallCap = Math.min(overallCap, 70);
  }
  if (row.visible_context_stale_terms.length > 0) {
    cleanCap = Math.min(cleanCap, 75);
    overallCap = Math.min(overallCap, 75);
  }
  if (!row.recovery_required_hits.rollback_flag)
    recoveryCap = Math.min(recoveryCap, 60);
  if (!row.recovery_required_hits.failed_test)
    recoveryCap = Math.min(recoveryCap, 60);
  if (!row.recovery_required_hits.accepted_design)
    recoveryCap = Math.min(recoveryCap, 50);
  if (!row.recovery_required_hits.rejected_design)
    recoveryCap = Math.min(recoveryCap, 50);
  if (!row.recovery_passed) overallCap = Math.min(overallCap, 65);
  if (
    !row.extra_stale_leak_passed ||
    row.recovery_extra_stale_terms.length > 0
  ) {
    recoveryCap = Math.min(recoveryCap, 85);
    overallCap = Math.min(overallCap, 85);
  }
  if (!row.citation_present) {
    citationCap = Math.min(citationCap, 60);
    overallCap = Math.min(overallCap, 80);
  }
  if (!row.route_passed) overallCap = Math.min(overallCap, 75);

  return makeScoreSet({
    clean: Math.min(result.raw_clean_score_0_100, cleanCap),
    recovery: Math.min(result.raw_recovery_score_0_100, recoveryCap),
    citation: Math.min(result.raw_citation_score_0_100, citationCap),
    overall: Math.min(result.raw_overall_score_0_100, overallCap),
    rawClean: result.raw_clean_score_0_100,
    rawRecovery: result.raw_recovery_score_0_100,
    rawCitation: result.raw_citation_score_0_100,
    rawOverall: result.raw_overall_score_0_100,
    cap: overallCap,
    reason: result.reason,
    missing: result.missing,
    issues: result.issues,
    rawText: result.raw_text,
  });
}

function makeScoreSet(input: {
  clean: number;
  recovery: number;
  citation: number;
  overall: number;
  rawClean: number;
  rawRecovery: number;
  rawCitation: number;
  rawOverall: number;
  cap: number;
  reason: string;
  missing: string[];
  issues: string[];
  rawText: string;
}): ScoreSet {
  return {
    clean_score_0_100: round(input.clean, 2),
    recovery_score_0_100: round(input.recovery, 2),
    citation_score_0_100: round(input.citation, 2),
    overall_score_0_100: round(input.overall, 2),
    clean_score_0_1: round(input.clean / 100, 4),
    recovery_score_0_1: round(input.recovery / 100, 4),
    citation_score_0_1: round(input.citation / 100, 4),
    overall_score_0_1: round(input.overall / 100, 4),
    raw_clean_score_0_100: round(input.rawClean, 2),
    raw_recovery_score_0_100: round(input.rawRecovery, 2),
    raw_citation_score_0_100: round(input.rawCitation, 2),
    raw_overall_score_0_100: round(input.rawOverall, 2),
    cap_0_100: round(input.cap, 2),
    reason: input.reason,
    missing: input.missing,
    issues: input.issues,
    raw_text: input.rawText,
  };
}

function round(value: number, places = 4) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function buildOutputAnalysis(
  options: Options,
  records: JudgeRecord[],
): OutputAnalysis {
  return {
    generatedAt: new Date().toISOString(),
    judgeModel: options.modelSlug,
    sourceRun: path.relative(repoRoot, options.run),
    summaries: buildSummaries(records),
    records,
  };
}

function buildSummaries(records: JudgeRecord[]) {
  const grouped = new Map<string, JudgeRecord[]>();
  for (const record of records) {
    const current = grouped.get(record.condition) ?? [];
    current.push(record);
    grouped.set(record.condition, current);
  }
  return [...grouped.entries()]
    .map(([condition, items]) => {
      const average = (fn: (record: JudgeRecord) => number) =>
        round(items.reduce((sum, item) => sum + fn(item), 0) / items.length, 4);
      const total = (fn: (record: JudgeRecord) => number | undefined) =>
        items.reduce((sum, item) => sum + (fn(item) ?? 0), 0);
      const tokens = {
        input: total((item) => item.tokens.input),
        cacheRead: total((item) => item.tokens.cacheRead),
        outputReasoning: total(
          (item) => (item.tokens.output ?? 0) + (item.tokens.reasoning ?? 0),
        ),
      };
      return {
        condition,
        cases: items.length,
        clean_score_0_1: average((item) => item.judge.clean_score_0_1),
        recovery_score_0_1: average((item) => item.judge.recovery_score_0_1),
        citation_score_0_1: average((item) => item.judge.citation_score_0_1),
        overall_score_0_1: average((item) => item.judge.overall_score_0_1),
        input_tokens: tokens.input,
        cached_input_tokens: tokens.cacheRead,
        output_reasoning_tokens: tokens.outputReasoning,
        estimated_cost_usd: round(estimateCost(tokens), 6),
      } satisfies SummaryRow;
    })
    .sort(
      (a, b) =>
        conditionOrder.indexOf(a.condition) -
        conditionOrder.indexOf(b.condition),
    );
}

function estimateCost(tokens: {
  input: number;
  cacheRead: number;
  outputReasoning: number;
}) {
  return (
    (tokens.input * 5) / 1_000_000 +
    (tokens.cacheRead * 0.5) / 1_000_000 +
    (tokens.outputReasoning * 30) / 1_000_000
  );
}

async function writePartial(options: Options, records: JudgeRecord[]) {
  await fs.writeFile(
    path.join(options.outDir, "partial.json"),
    `${JSON.stringify({ records }, null, 2)}\n`,
  );
}

async function writeAnalysis(outDir: string, analysis: OutputAnalysis) {
  await fs.writeFile(
    path.join(outDir, "analysis.json"),
    `${JSON.stringify(analysis, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outDir, "analysis.md"),
    renderMarkdown(analysis),
  );
}

function renderMarkdown(analysis: OutputAnalysis) {
  const lines = [
    "# Reversible Memory Judge Scores",
    "",
    `- Judge model: ${analysis.judgeModel}`,
    `- Source run: ${analysis.sourceRun}`,
    "",
    "| Condition | Clean Judge | Recovery Judge | Citation Judge | Overall Judge | Input Tok | Cached Tok | Output + Reasoning Tok | Est. Cost |",
    "| --------- | ----------: | -------------: | -------------: | ------------: | --------: | ---------: | ---------------------: | --------: |",
  ];
  for (const row of analysis.summaries) {
    lines.push(
      `| ${row.condition} | ${row.clean_score_0_1.toFixed(2)} | ${row.recovery_score_0_1.toFixed(2)} | ${row.citation_score_0_1.toFixed(2)} | ${row.overall_score_0_1.toFixed(2)} | ${formatTok(row.input_tokens)} | ${formatTok(row.cached_input_tokens)} | ${formatTok(row.output_reasoning_tokens)} | $${row.estimated_cost_usd.toFixed(2)} |`,
    );
  }
  lines.push("", "## Per-Condition Notes", "");
  lines.push("| Condition | Overall Cap | Reason |");
  lines.push("| --------- | --: | ------ |");
  for (const record of analysis.records) {
    lines.push(
      `| ${record.condition} | ${record.judge.cap_0_100.toFixed(0)} | ${escapeCell(record.judge.reason)} |`,
    );
  }
  return `${lines.join("\n")}\n`;
}

function formatTok(value: number) {
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return value.toLocaleString();
}

function escapeCell(value: string) {
  return value.replaceAll("|", "\\|").replaceAll("\n", "<br>");
}

async function makeOpenCodeRoot(outDir: string) {
  const root = path.join(outDir, "opencode-root");
  const dirs = {
    home: path.join(root, "home"),
    data: path.join(root, "data"),
    config: path.join(root, "config"),
    state: path.join(root, "state"),
    cache: path.join(root, "cache"),
  };
  await Promise.all(
    Object.values(dirs).map((dir) => fs.mkdir(dir, { recursive: true })),
  );
  return dirs;
}

async function buildOpenCodeEnv(input: {
  opencodeRoot: {
    home: string;
    data: string;
    config: string;
    state: string;
    cache: string;
  };
  modelSlug: string;
}) {
  const authContent = await seededAuthContent();
  const config = {
    $schema: "https://opencode.ai/config.json",
    model: input.modelSlug,
  };
  return {
    ...process.env,
    HOME: input.opencodeRoot.home,
    XDG_DATA_HOME: input.opencodeRoot.data,
    XDG_CONFIG_HOME: input.opencodeRoot.config,
    XDG_STATE_HOME: input.opencodeRoot.state,
    XDG_CACHE_HOME: input.opencodeRoot.cache,
    OPENCODE_DB: path.join(input.opencodeRoot.data, "opencode.sqlite"),
    OPENCODE_DISABLE_PROJECT_CONFIG: "1",
    OPENCODE_CONFIG_CONTENT: JSON.stringify(config),
    ...(authContent ? { OPENCODE_AUTH_CONTENT: authContent } : {}),
  } satisfies NodeJS.ProcessEnv;
}

async function seededAuthContent() {
  if (process.env.OPENCODE_AUTH_CONTENT)
    return process.env.OPENCODE_AUTH_CONTENT;
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
  proc.stderr.on("data", (chunk) => (stderr += chunk.toString()));
  const url = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Timed out starting judge server\n${stderr}`)),
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
          `Judge server exited early with code ${String(code)}\n${stderr}`,
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
  assert.ok(session.id, "failed to create judge session");
  return session.id;
}

async function prompt(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  sessionID: string,
  text: string,
  system: string,
  timeoutMs: number,
) {
  const before = await listSessionMessages(client, directory, sessionID);
  const beforeIDs = new Set(before.map((message) => message.info?.id));
  const raw = (await withTimeout(
    client.session.promptAsync({
      directory,
      sessionID,
      system,
      tools: {},
      parts: [{ type: "text", text }],
    }),
    timeoutMs,
    `judge prompt timed out in ${sessionID}`,
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
          message.info?.finish,
      );
    if (assistant) return assistant;
  }
  throw new Error(
    `timed out waiting for judge assistant message in ${sessionID}`,
  );
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

function messageText(message: SessionMessage | undefined) {
  return (message?.parts ?? [])
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("\n");
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

function timestampSlug() {
  return new Date().toISOString().replaceAll(":", "").replaceAll(".", "-");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
