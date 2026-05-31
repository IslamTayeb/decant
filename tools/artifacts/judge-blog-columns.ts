import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createOpencodeClient } from "@opencode-ai/sdk/v2";

import { parseModelSlug } from "../model";
import {
  createSession as createOpenCodeSession,
  listProviders,
  listSessionMessages as listOpenCodeSessionMessages,
} from "../opencode-sdk";

const repoRoot = path.resolve(process.cwd());

const defaultProvenanceRun = path.join(
  repoRoot,
  "artifacts",
  "benchmark-runs",
  "provenance-qa",
  "gpt55-blog-full-matrix-final",
);
const defaultCodeRecallRun = path.join(
  repoRoot,
  "artifacts",
  "benchmark-runs",
  "code-recall",
  "gpt55-secondary-missing-20260515",
);
const defaultOutDir = path.join(
  repoRoot,
  "artifacts",
  "benchmark-runs",
  "blog-judge",
  `judge-${timestampSlug()}`,
);

type Options = {
  provenanceRun: string;
  codeRecallRun: string;
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
  parts?: Array<{
    type: string;
    text?: string;
  }>;
};

type AnalysisFile<Row> = {
  outDir?: string;
  generatedAt?: string;
  rows: Row[];
};

type TokenBucket = {
  input?: number;
  output?: number;
  reasoning?: number;
  cacheRead?: number;
};

type ProvenanceRow = {
  fixture: string;
  condition: string;
  benchmark_passed: boolean;
  answer_passed: boolean;
  provenance_passed: boolean;
  required_hits: string[];
  missing_required: string[];
  forbidden_hits: string[];
  citation_hits: string[];
  output_preview: string;
  relevant_session_id: string;
  relevant_message_ids: string[];
  tokens: TokenBucket;
};

type CodeRecallRow = {
  fixture: string;
  title: string;
  recall_role: string;
  condition: string;
  benchmark_passed: boolean;
  tests_passed: boolean;
  public_tests_passed: boolean;
  hidden_tests_passed: boolean;
  expected_files_touched: boolean;
  touched_files_allowed: boolean;
  recall_policy_passed: boolean;
  forbidden_patch_hits: string[];
  forbidden_output_hits: string[];
  touched_files: string[];
  unexpected_touched_files: string[];
  output_preview: string;
  recall_decision: string;
  citation_hits: string[];
  relevant_session_id: string;
  relevant_message_ids: string[];
  public_test: { passed: boolean; stdout?: string; stderr?: string };
  hidden_test: { passed: boolean; stdout?: string; stderr?: string };
  tokens: TokenBucket;
};

type FixtureRubric = {
  question?: string;
  task?: string;
  expected: string[];
  forbidden: string[];
  provenancePolicy?: string;
  memoryPolicy?: string;
};

type JudgeJson = {
  score_0_100?: unknown;
  score_0_1?: unknown;
  reason?: unknown;
  missing?: unknown;
  issues?: unknown;
};

type JudgeResult = {
  score_0_100: number;
  score_0_1: number;
  raw_score_0_100: number;
  cap_0_100: number;
  reason: string;
  missing: string[];
  issues: string[];
  raw_text: string;
};

type JudgeRecord = {
  section: "provenance" | "code_recall";
  fixture: string;
  condition: string;
  blog_label: string;
  judge: JudgeResult;
  deterministic: Record<string, unknown>;
};

type SummaryRow = {
  label: string;
  condition: string;
  cases: number;
  judge_score_0_100: number;
  judge_score_0_1: number;
};

type OutputAnalysis = {
  generatedAt: string;
  judgeModel: string;
  sourceRuns: {
    provenance: string;
    codeRecall: string;
  };
  summaries: {
    provenance: SummaryRow[];
    code_recall: SummaryRow[];
  };
  records: JudgeRecord[];
};

const provenanceFixtureOrder = [
  "auth-queue-rationale",
  "correction-chain",
  "false-provenance",
  "related-reuse",
  "multi-agent-synthesis",
];

const provenanceConditionLabels = new Map([
  ["default-compaction", "Default Compaction"],
  ["rlm-transcript-search", "RGB-agent"],
  ["decant-map-zoom", "Decant"],
]);

const codeRecallFixtureOrder = [
  "recall-missing-pagination",
  "recall-correction-retry-cap",
  "recall-synthesis-report",
];

const codeRecallConditionLabels = new Map([
  ["default-compaction", "Default"],
  ["rlm-transcript-search", "RGB-agent"],
  ["decant-only", "Decant"],
]);

const provenanceRubrics: Record<string, FixtureRubric> = {
  "auth-queue-rationale": {
    question:
      "Why does src/auth/queue.ts deduplicate refresh work per tenant instead of using one global mutex?",
    expected: [
      "Refresh work is keyed per tenant.",
      "Duplicate refreshes for the same tenant coalesce/deduplicate.",
      "Different tenants can continue in parallel.",
      "A single global mutex was rejected because it would block unrelated tenants.",
    ],
    forbidden: ["billing retry", "markdown parser", "quickstart"],
    provenancePolicy:
      "The answer should cite the relevant prior session and a supporting message ID.",
  },
  "correction-chain": {
    question:
      "Why does src/parser/schema.ts trim schema field names after splitting fields instead of before tokenization?",
    expected: [
      "The final accepted behavior is split/tokenize first, then trim each field.",
      "This preserves raw delimiter or quoted-field behavior while cleaning field names.",
      "An earlier before-tokenization rationale existed but was superseded or wrong.",
    ],
    forbidden: ["network timeout", "billing queue", "global mutex"],
    provenancePolicy:
      "The answer should cite the relevant correction-chain session and supporting message ID, not a distractor.",
  },
  "false-provenance": {
    question:
      "Why does src/cache/index.ts scope TTL by namespace instead of using one global TTL?",
    expected: [
      "TTL is namespace-scoped or per namespace.",
      "The design prevents one noisy or unrelated namespace from affecting another namespace.",
      "A global TTL was considered/rejected/not used.",
    ],
    forbidden: ["billing cache", "image cache", "global mutex"],
    provenancePolicy:
      "The answer should cite the cache namespace rationale session and a supporting message, not plausible cache distractors.",
  },
  "related-reuse": {
    question:
      "For src/tsv/schema.ts, what prior CSV parser lesson should be reused, and what stale detail should not be copied?",
    expected: [
      "Reuse the prior lesson to trim fields after delimiter splitting.",
      "Do not copy comma-specific CSV splitting details.",
      "The TSV implementation should use tab delimiters / TSV-specific behavior.",
    ],
    forbidden: ["auth refresh", "global mutex", "billing retry"],
    provenancePolicy:
      "The answer should cite the related CSV parser lesson session and supporting message IDs.",
  },
  "multi-agent-synthesis": {
    question:
      "Which child agent's prior finding explains why src/report/summary.ts keeps failed-test IDs in the final report?",
    expected: [
      "The relevant finding came from the test investigator child/sub-agent.",
      "Failed-test IDs should remain in final reports.",
      "Keeping IDs lets a later agent reproduce and triage/debug exact failures.",
    ],
    forbidden: ["docs writer", "style reviewer", "billing queue"],
    provenancePolicy:
      "The answer should cite the test investigator child session and a supporting message, not docs/style distractors.",
  },
};

const codeRecallRubrics: Record<string, FixtureRubric> = {
  "recall-missing-pagination": {
    task: "Fix totalPages so the local pagination tests pass.",
    expected: [
      "The patch should compute totalPages with Math.ceil so partial pages count.",
      "It should preserve the invalid pageSize guard / not invent extra pages.",
      "The final answer should not invent prior-session evidence.",
    ],
    forbidden: ["graphql", "opaque token"],
    memoryPolicy:
      "Prior sessions are only related distractors. Correct behavior is to solve from current code/tests and mark memory unavailable or ignored.",
  },
  "recall-correction-retry-cap": {
    task: "Fix retryDelayMs so it matches the latest accepted retry-delay decision.",
    expected: [
      "The patch should keep the 100ms exponential base schedule.",
      "The cap should be the latest accepted 2000ms value.",
      "The stale 5000ms cap should be rejected, and 1000ms is not the expected cap.",
    ],
    forbidden: ["five second", "5 second"],
    memoryPolicy:
      "When prior context is available, the result should use/cite the latest correction rather than stale earlier notes. Code-only cannot cite unavailable memory but still must pass tests to score highly.",
  },
  "recall-synthesis-report": {
    task: "Fix buildReport so it matches the accepted parent synthesis of prior child-agent findings.",
    expected: [
      "The output should keep the summary field.",
      "It should preserve failed_test_ids exactly when provided.",
      "It should preserve retry_owner exactly when provided.",
      "It should follow the accepted parent synthesis of child-agent findings.",
    ],
    forbidden: ["docs writer", "style reviewer", "alphabetized"],
    memoryPolicy:
      "When prior context is available, the result should cite/use the accepted synthesis rather than distractor docs/style requests.",
  },
};

async function main() {
  const options = parseOptions();
  const provenanceAnalysis = await readJson<AnalysisFile<ProvenanceRow>>(
    path.join(options.provenanceRun, "analysis.json"),
  );
  const codeRecallAnalysis = await readJson<AnalysisFile<CodeRecallRow>>(
    path.join(options.codeRecallRun, "analysis.json"),
  );

  const provenanceRows = selectedProvenanceRows(provenanceAnalysis.rows);
  const codeRecallRows = selectedCodeRecallRows(codeRecallAnalysis.rows);
  const provenanceConditionsInRun = [
    ...provenanceConditionLabels.keys(),
  ].filter((condition) =>
    provenanceAnalysis.rows.some(
      (row) =>
        row.condition === condition &&
        provenanceFixtureOrder.includes(row.fixture),
    ),
  );
  assert.equal(
    provenanceRows.length,
    provenanceFixtureOrder.length * provenanceConditionsInRun.length,
    "unexpected provenance row count",
  );
  assert.equal(
    codeRecallRows.length,
    codeRecallFixtureOrder.length * codeRecallConditionLabels.size,
    "unexpected code-recall row count",
  );

  await fs.mkdir(options.outDir, { recursive: true });

  const opencodeRoot = await makeOpenCodeRoot(options.outDir);
  const env = await buildOpenCodeEnv({
    opencodeRoot,
    outDir: options.outDir,
    modelSlug: options.modelSlug,
  });
  const server = await startServer(env, repoRoot);
  try {
    const client = createOpencodeClient({ baseUrl: server.url });
    await pickModel(client, repoRoot, options.modelSlug);

    const records: JudgeRecord[] = [];
    for (const row of provenanceRows) {
      const session = await createSession(
        client,
        repoRoot,
        `Judge provenance ${row.fixture} ${row.condition}`,
      );
      const promptText = provenanceJudgePrompt(row);
      const assistant = await prompt(
        client,
        repoRoot,
        session,
        promptText,
        judgeSystemPrompt(),
        {},
        options.promptTimeoutMs,
      );
      const result = parseJudgeResult(messageText(assistant));
      const capped = applyProvenanceCaps(result, row);
      records.push({
        section: "provenance",
        fixture: row.fixture,
        condition: row.condition,
        blog_label:
          provenanceConditionLabels.get(row.condition) ?? row.condition,
        judge: capped,
        deterministic: {
          benchmark_passed: row.benchmark_passed,
          answer_passed: row.answer_passed,
          provenance_passed: row.provenance_passed,
          required_hits: row.required_hits,
          missing_required: row.missing_required,
          forbidden_hits: row.forbidden_hits,
          citation_hits: row.citation_hits,
        },
      });
      await writePartial(options.outDir, records);
    }

    for (const row of codeRecallRows) {
      const session = await createSession(
        client,
        repoRoot,
        `Judge code-recall ${row.fixture} ${row.condition}`,
      );
      const patch = await readPatch(options.codeRecallRun, row);
      const promptText = codeRecallJudgePrompt(row, patch);
      const assistant = await prompt(
        client,
        repoRoot,
        session,
        promptText,
        judgeSystemPrompt(),
        {},
        options.promptTimeoutMs,
      );
      const result = parseJudgeResult(messageText(assistant));
      const capped = applyCodeRecallCaps(result, row);
      records.push({
        section: "code_recall",
        fixture: row.fixture,
        condition: row.condition,
        blog_label:
          codeRecallConditionLabels.get(row.condition) ?? row.condition,
        judge: capped,
        deterministic: {
          benchmark_passed: row.benchmark_passed,
          tests_passed: row.tests_passed,
          public_tests_passed: row.public_tests_passed,
          hidden_tests_passed: row.hidden_tests_passed,
          expected_files_touched: row.expected_files_touched,
          touched_files_allowed: row.touched_files_allowed,
          recall_policy_passed: row.recall_policy_passed,
          forbidden_patch_hits: row.forbidden_patch_hits,
          forbidden_output_hits: row.forbidden_output_hits,
          recall_decision: row.recall_decision,
          citation_hits: row.citation_hits,
        },
      });
      await writePartial(options.outDir, records);
    }

    const analysis = buildOutputAnalysis(options, records);
    await writeAnalysis(options.outDir, analysis);
    console.log(
      `Judge analysis written to ${path.relative(repoRoot, options.outDir)}`,
    );
    console.log(await markdownSummary(analysis));
  } finally {
    await server.close();
  }
}

function parseOptions(): Options {
  let provenanceRun = defaultProvenanceRun;
  let codeRecallRun = defaultCodeRecallRun;
  let outDir = defaultOutDir;
  let modelSlug =
    process.env.DECANT_E2E_JUDGE_MODEL?.trim() ||
    process.env.DECANT_E2E_MODEL?.trim() ||
    "";
  let promptTimeoutMs = 5 * 60_000;

  for (let index = 2; index < process.argv.length; index++) {
    const arg = process.argv[index]!;
    if (arg === "--provenance-run") {
      provenanceRun = path.resolve(requireValue(arg, process.argv[++index]));
      continue;
    }
    if (arg.startsWith("--provenance-run=")) {
      provenanceRun = path.resolve(arg.slice("--provenance-run=".length));
      continue;
    }
    if (arg === "--code-recall-run") {
      codeRecallRun = path.resolve(requireValue(arg, process.argv[++index]));
      continue;
    }
    if (arg.startsWith("--code-recall-run=")) {
      codeRecallRun = path.resolve(arg.slice("--code-recall-run=".length));
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
  return { provenanceRun, codeRecallRun, outDir, modelSlug, promptTimeoutMs };
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

function selectedProvenanceRows(rows: ProvenanceRow[]) {
  return sortRows(
    rows.filter(
      (row) =>
        provenanceFixtureOrder.includes(row.fixture) &&
        provenanceConditionLabels.has(row.condition),
    ),
    provenanceFixtureOrder,
    [...provenanceConditionLabels.keys()],
  );
}

function selectedCodeRecallRows(rows: CodeRecallRow[]) {
  return sortRows(
    rows.filter(
      (row) =>
        codeRecallFixtureOrder.includes(row.fixture) &&
        codeRecallConditionLabels.has(row.condition),
    ),
    codeRecallFixtureOrder,
    [...codeRecallConditionLabels.keys()],
  );
}

function sortRows<Row extends { fixture: string; condition: string }>(
  rows: Row[],
  fixtureOrder: string[],
  conditionOrder: string[],
) {
  return [...rows].sort((a, b) => {
    const fixtureDelta =
      fixtureOrder.indexOf(a.fixture) - fixtureOrder.indexOf(b.fixture);
    if (fixtureDelta !== 0) return fixtureDelta;
    return (
      conditionOrder.indexOf(a.condition) - conditionOrder.indexOf(b.condition)
    );
  });
}

function judgeSystemPrompt() {
  return [
    "You are a strict benchmark judge.",
    "Return JSON only, with no markdown fences and no prose outside JSON.",
    "Use a 0-100 score, where 100 means the output fully satisfies the rubric and 0 means it is unrelated or unusable.",
    "Be especially strict about stale/distractor rationales and about answers that sound plausible but miss required details.",
    'Use this exact shape: {"score_0_100": number, "score_0_1": number, "reason": string, "missing": string[], "issues": string[]}.',
  ].join("\n");
}

function provenanceJudgePrompt(row: ProvenanceRow) {
  const rubric = requiredRubric(provenanceRubrics, row.fixture);
  return [
    "Score this provenance-lookup answer for semantic correctness.",
    "Do not reward verbosity. Do not penalize minor wording differences if the meaning is correct.",
    "Scoring guidance: expected rationale facts are most important; correct session/message provenance is next; distractor avoidance also matters.",
    "",
    `Fixture: ${row.fixture}`,
    `Question: ${rubric.question ?? ""}`,
    `Expected rationale facts:\n${bulletList(rubric.expected)}`,
    `Forbidden distractor terms/rationales:\n${bulletList(rubric.forbidden)}`,
    `Provenance policy: ${rubric.provenancePolicy ?? "Cite the supporting session/message."}`,
    `Expected session ID/title signal from analyzer: ${row.relevant_session_id}`,
    `Expected supporting message IDs from analyzer: ${row.relevant_message_ids.join(", ")}`,
    "",
    "Deterministic analyzer result:",
    jsonBlock({
      benchmark_passed: row.benchmark_passed,
      answer_passed: row.answer_passed,
      provenance_passed: row.provenance_passed,
      required_hits: row.required_hits,
      missing_required: row.missing_required,
      forbidden_hits: row.forbidden_hits,
      citation_hits: row.citation_hits,
    }),
    "",
    "Answer to grade:",
    row.output_preview,
  ].join("\n");
}

function codeRecallJudgePrompt(row: CodeRecallRow, patch: string) {
  const rubric = requiredRubric(codeRecallRubrics, row.fixture);
  return [
    "Score this memory-aware coding result for benchmark quality.",
    "The main output is the patch plus final answer. Public/hidden tests are strong evidence of patch correctness.",
    "Do not reward a nice explanation if hidden tests fail. Do not reward invented or stale prior-memory citations.",
    "",
    `Fixture: ${row.fixture}`,
    `Task: ${rubric.task ?? row.title}`,
    `Expected behavior:\n${bulletList(rubric.expected)}`,
    `Forbidden stale/distractor terms:\n${bulletList(rubric.forbidden)}`,
    `Memory policy: ${rubric.memoryPolicy ?? "Use relevant memory only when available."}`,
    "",
    "Deterministic analyzer result:",
    jsonBlock({
      benchmark_passed: row.benchmark_passed,
      tests_passed: row.tests_passed,
      public_tests_passed: row.public_tests_passed,
      hidden_tests_passed: row.hidden_tests_passed,
      expected_files_touched: row.expected_files_touched,
      touched_files_allowed: row.touched_files_allowed,
      recall_policy_passed: row.recall_policy_passed,
      recall_decision: row.recall_decision,
      citation_hits: row.citation_hits,
      forbidden_patch_hits: row.forbidden_patch_hits,
      forbidden_output_hits: row.forbidden_output_hits,
      touched_files: row.touched_files,
      unexpected_touched_files: row.unexpected_touched_files,
    }),
    "",
    "Patch diff:",
    patch || "<missing patch artifact>",
    "",
    "Final answer:",
    row.output_preview,
    "",
    "Public test stdout:",
    truncate(row.public_test.stdout ?? "", 1600),
    "",
    "Hidden test stdout:",
    truncate(row.hidden_test.stdout ?? "", 2200),
  ].join("\n");
}

function requiredRubric(
  rubrics: Record<string, FixtureRubric>,
  fixture: string,
) {
  const rubric = rubrics[fixture];
  assert.ok(rubric, `missing rubric for ${fixture}`);
  return rubric;
}

function bulletList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function jsonBlock(value: unknown) {
  return JSON.stringify(value, null, 2);
}

async function readPatch(codeRecallRun: string, row: CodeRecallRow) {
  const patchPath = path.join(
    codeRecallRun,
    "fixtures",
    row.fixture,
    "conditions",
    row.condition,
    "patch.diff",
  );
  return await fs.readFile(patchPath, "utf8").catch(() => "");
}

function parseJudgeResult(rawText: string): JudgeResult {
  const parsed = parseJudgeJson(rawText);
  const rawScore = numberFromUnknown(parsed.score_0_100);
  const normalized = Math.max(0, Math.min(100, rawScore));
  return {
    score_0_100: normalized,
    score_0_1: round(normalized / 100, 4),
    raw_score_0_100: normalized,
    cap_0_100: 100,
    reason: stringFromUnknown(parsed.reason),
    missing: stringArray(parsed.missing),
    issues: stringArray(parsed.issues),
    raw_text: rawText,
  };
}

function parseJudgeJson(rawText: string): JudgeJson {
  try {
    return JSON.parse(rawText) as JudgeJson;
  } catch {}
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`judge did not return JSON: ${rawText}`);
  return JSON.parse(match[0]) as JudgeJson;
}

function numberFromUnknown(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  throw new Error(`judge score is not numeric: ${JSON.stringify(value)}`);
}

function stringFromUnknown(value: unknown) {
  return typeof value === "string" ? value : JSON.stringify(value ?? "");
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function applyProvenanceCaps(result: JudgeResult, row: ProvenanceRow) {
  let cap = 100;
  if (!row.answer_passed) cap = Math.min(cap, 70);
  if (!row.provenance_passed) cap = Math.min(cap, 80);
  if (row.forbidden_hits.length > 0) cap = Math.min(cap, 65);
  if (!row.benchmark_passed) cap = Math.min(cap, 75);
  return applyCap(result, cap);
}

function applyCodeRecallCaps(result: JudgeResult, row: CodeRecallRow) {
  let cap = 100;
  if (!row.public_tests_passed) cap = Math.min(cap, 45);
  if (!row.hidden_tests_passed) cap = Math.min(cap, 65);
  if (!row.expected_files_touched || !row.touched_files_allowed)
    cap = Math.min(cap, 70);
  if (
    row.forbidden_patch_hits.length > 0 ||
    row.forbidden_output_hits.length > 0
  ) {
    cap = Math.min(cap, 60);
  }
  if (!row.recall_policy_passed) cap = Math.min(cap, 75);
  if (!row.benchmark_passed) cap = Math.min(cap, 80);
  return applyCap(result, cap);
}

function applyCap(result: JudgeResult, cap: number): JudgeResult {
  const capped = Math.min(result.raw_score_0_100, cap);
  return {
    ...result,
    score_0_100: round(capped, 2),
    score_0_1: round(capped / 100, 4),
    cap_0_100: cap,
  };
}

function buildOutputAnalysis(
  options: Options,
  records: JudgeRecord[],
): OutputAnalysis {
  return {
    generatedAt: new Date().toISOString(),
    judgeModel: options.modelSlug,
    sourceRuns: {
      provenance: path.relative(repoRoot, options.provenanceRun),
      codeRecall: path.relative(repoRoot, options.codeRecallRun),
    },
    summaries: {
      provenance: summarizeRecords(
        records.filter((record) => record.section === "provenance"),
      ),
      code_recall: summarizeRecords(
        records.filter((record) => record.section === "code_recall"),
      ),
    },
    records,
  };
}

function summarizeRecords(records: JudgeRecord[]) {
  const byCondition = new Map<string, JudgeRecord[]>();
  for (const record of records) {
    const key = `${record.blog_label}\u0000${record.condition}`;
    byCondition.set(key, [...(byCondition.get(key) ?? []), record]);
  }
  return [...byCondition.entries()].map(([key, items]) => {
    const [label = "", condition = ""] = key.split("\u0000");
    const average =
      items.reduce((sum, item) => sum + item.judge.score_0_100, 0) /
      Math.max(1, items.length);
    return {
      label,
      condition,
      cases: items.length,
      judge_score_0_100: round(average, 2),
      judge_score_0_1: round(average / 100, 4),
    };
  });
}

async function writePartial(outDir: string, records: JudgeRecord[]) {
  await fs.writeFile(
    path.join(outDir, "partial-records.json"),
    `${JSON.stringify(records, null, 2)}\n`,
  );
}

async function writeAnalysis(outDir: string, analysis: OutputAnalysis) {
  await fs.writeFile(
    path.join(outDir, "analysis.json"),
    `${JSON.stringify(analysis, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outDir, "analysis.md"),
    await markdownSummary(analysis),
  );
  await fs.rm(path.join(outDir, "partial-records.json"), { force: true });
}

async function markdownSummary(analysis: OutputAnalysis) {
  return [
    "# Blog Judge Scores",
    "",
    `- Judge model: ${analysis.judgeModel}`,
    `- Provenance source: ${analysis.sourceRuns.provenance}`,
    `- Code-recall source: ${analysis.sourceRuns.codeRecall}`,
    "",
    "## Provenance Lookup",
    "",
    "| Condition | Judge Score | Cases |",
    "| --------- | ----------: | ----: |",
    ...analysis.summaries.provenance.map(
      (row) =>
        `| ${row.label} | ${row.judge_score_0_1.toFixed(2)} | ${row.cases} |`,
    ),
    "",
    "## Memory-Aware Coding",
    "",
    "| Condition | Judge Score | Cases |",
    "| --------- | ----------: | ----: |",
    ...analysis.summaries.code_recall.map(
      (row) =>
        `| ${row.label} | ${row.judge_score_0_1.toFixed(2)} | ${row.cases} |`,
    ),
    "",
    "## Per-Case Scores",
    "",
    "| Section | Fixture | Condition | Score | Cap | Reason |",
    "| ------- | ------- | --------- | ----: | --: | ------ |",
    ...analysis.records.map(
      (record) =>
        `| ${record.section} | ${record.fixture} | ${record.blog_label} | ${record.judge.score_0_1.toFixed(2)} | ${record.judge.cap_0_100} | ${escapeCell(record.judge.reason)} |`,
    ),
    "",
  ].join("\n");
}

function escapeCell(value: string) {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function truncate(value: string, maxChars: number) {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n<truncated>`;
}

async function makeOpenCodeRoot(outDir: string) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "decant-blog-judge-"));
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
  outDir: string;
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
    { cwd, env, stdio: ["ignore", "pipe", "pipe"] },
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
          message.info?.finish &&
          message.info.finish !== "tool-calls",
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

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
) {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>(
        (_, reject) =>
          (timeout = setTimeout(() => reject(new Error(message)), timeoutMs)),
      ),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function messageText(message: SessionMessage | undefined) {
  return (message?.parts ?? [])
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("\n");
}

function timestampSlug() {
  return new Date()
    .toISOString()
    .replaceAll(":", "")
    .replace(/\.\d{3}Z$/, "Z")
    .replaceAll("-", "")
    .toLowerCase();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
