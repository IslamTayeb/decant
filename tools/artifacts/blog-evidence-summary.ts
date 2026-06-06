import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(process.cwd());

const defaultPaths = {
  blogJudge: path.join(
    repoRoot,
    "artifacts",
    "benchmark-runs",
    "blog-judge",
    "default-compaction-gpt55-judge",
    "analysis.json",
  ),
  contextCanaries: path.join(
    repoRoot,
    "artifacts",
    "benchmark-runs",
    "context-canaries",
    "gpt55-all-hypotheses",
    "analysis.json",
  ),
  reversibleMemory: path.join(
    repoRoot,
    "artifacts",
    "benchmark-runs",
    "reversible-memory",
    "gpt55-reversible-memory-final3-20260525",
    "analysis.json",
  ),
  codeRecall: path.join(
    repoRoot,
    "artifacts",
    "benchmark-runs",
    "code-recall",
    "gpt55-secondary-missing-20260515",
    "analysis.json",
  ),
};

type Options = {
  out?: string;
  blogJudge: string;
  contextCanaries: string;
  reversibleMemory: string;
  codeRecall: string;
};

type TokenBucket = {
  input?: number;
  output?: number;
  reasoning?: number;
  cacheRead?: number;
};

type BlogJudgeAnalysis = {
  generatedAt: string;
  judgeModel: string;
  sourceRuns: {
    provenance?: string;
    codeRecall?: string;
  };
  summaries: {
    provenance?: Array<JudgeSummary>;
    code_recall?: Array<JudgeSummary>;
  };
};

type JudgeSummary = {
  label: string;
  condition: string;
  cases: number;
  judge_score_0_1: number;
};

type Analysis<Row> = {
  outDir?: string;
  generatedAt?: string;
  rows: Row[];
};

type CanaryRow = {
  condition: string;
  canaryPassed: boolean;
  contextHygienePassed: boolean;
  tokens: TokenBucket;
};

type ReversibleRow = {
  condition: string;
  cleanup_passed: boolean;
  recovery_passed: boolean;
  route_passed: boolean;
  tokens: TokenBucket;
  estimated_cost_usd?: number;
};

type RunRow = {
  fixture?: string;
  condition: string;
  benchmark_passed?: boolean;
  tokens: TokenBucket;
  estimated_cost_usd?: number;
};

type Aggregate = {
  cases: number;
  passed: number;
  tokens: Required<TokenBucket>;
  estimatedCost: number;
};

const provenanceLabels = new Map([
  ["Default", "default-compaction"],
  ["Default Compaction", "default-compaction"],
  ["RGB-agent", "rlm-transcript-search"],
  ["Decant", "decant-map-zoom"],
]);

const codeLabels = new Map([
  ["Default", "code-only"],
  ["RGB-agent", "rlm-transcript-search"],
  ["Decant", "decant-only"],
]);

async function main() {
  const options = parseOptions();
  const blogJudge = await readJson<BlogJudgeAnalysis>(options.blogJudge);
  const canaries = await readJson<Analysis<CanaryRow>>(
    options.contextCanaries,
  );
  const reversible = await readJson<Analysis<ReversibleRow>>(
    options.reversibleMemory,
  );
  const codeRecall = await readJson<Analysis<RunRow>>(options.codeRecall);
  const provenanceRun = await readOptionalAnalysis<RunRow>(
    resolveSourcePath(blogJudge.sourceRuns.provenance),
  );

  const markdown = renderMarkdown({
    options,
    blogJudge,
    canaries,
    reversible,
    codeRecall,
    provenanceRun,
  });

  if (options.out) {
    await fs.mkdir(path.dirname(options.out), { recursive: true });
    await fs.writeFile(options.out, `${markdown}\n`);
  }
  console.log(markdown);
}

function parseOptions(): Options {
  const options: Options = { ...defaultPaths };
  for (let index = 2; index < process.argv.length; index++) {
    const arg = process.argv[index]!;
    if (arg === "--out") {
      options.out = path.resolve(requireValue(arg, process.argv[++index]));
      continue;
    }
    if (arg.startsWith("--out=")) {
      options.out = path.resolve(arg.slice("--out=".length));
      continue;
    }
    if (arg === "--blog-judge") {
      options.blogJudge = path.resolve(requireValue(arg, process.argv[++index]));
      continue;
    }
    if (arg === "--code-recall") {
      options.codeRecall = path.resolve(
        requireValue(arg, process.argv[++index]),
      );
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

function requireValue(flag: string, value: string | undefined) {
  if (!value || value.startsWith("--")) throw new Error(`${flag} needs a value`);
  return value;
}

async function readJson<Value>(file: string): Promise<Value> {
  return JSON.parse(await fs.readFile(file, "utf8")) as Value;
}

async function readOptionalAnalysis<Row>(
  file: string | undefined,
): Promise<Analysis<Row> | undefined> {
  if (!file) return undefined;
  return await readJson<Analysis<Row>>(file).catch(() => undefined);
}

function resolveSourcePath(source: string | undefined) {
  if (!source) return undefined;
  const publicArtifact = publicArtifactPathForSource(source);
  if (publicArtifact) return publicArtifact;
  const candidate = path.isAbsolute(source)
    ? source
    : path.join(repoRoot, source, "analysis.json");
  return candidate.endsWith(".json") ? candidate : path.join(candidate);
}

function publicArtifactPathForSource(source: string) {
  const normalized = source.replaceAll(path.sep, "/");
  const match = normalized.match(/^benchmarks\/([^/]+)\/runs\/([^/]+)$/);
  if (!match) return undefined;
  return path.join(
    repoRoot,
    "artifacts",
    "benchmark-runs",
    match[1]!,
    match[2]!,
    "analysis.json",
  );
}

function renderMarkdown(input: {
  options: Options;
  blogJudge: BlogJudgeAnalysis;
  canaries: Analysis<CanaryRow>;
  reversible: Analysis<ReversibleRow>;
  codeRecall: Analysis<RunRow>;
  provenanceRun?: Analysis<RunRow>;
}) {
  const lines = [
    "# Blog Evidence Summary",
    "",
    `- Generated: ${new Date().toISOString()}`,
    `- Judge model: ${input.blogJudge.judgeModel}`,
    `- Blog judge: ${sourceLine(input.options.blogJudge)}`,
    `- Context canaries: ${sourceLine(input.options.contextCanaries)}`,
    `- Reversible memory: ${sourceLine(input.options.reversibleMemory)}`,
    `- Code recall metrics: ${sourceLine(input.options.codeRecall)}`,
  ];
  if (input.blogJudge.sourceRuns.provenance) {
    lines.push(
      `- Provenance judge source: ${sourceLine(resolveSourcePath(input.blogJudge.sourceRuns.provenance) ?? input.blogJudge.sourceRuns.provenance)}`,
    );
  }
  lines.push("");

  lines.push("## Context Canaries", "");
  lines.push(
    "| Condition | Canary Pass | Hygiene Pass | Input Tok | Cached Tok | Cache Hit |",
  );
  lines.push("|---|---:|---:|---:|---:|---:|");
  for (const row of canaryRows(input.canaries.rows)) {
    lines.push(
      `| ${row.condition} | ${row.canaryPass} | ${row.hygienePass} | ${formatTokens(row.tokens.input)} | ${formatTokens(row.tokens.cacheRead)} | ${formatPercent(cacheHitShare(row.tokens))} |`,
    );
  }

  lines.push("", "## Reversible Memory", "");
  lines.push(
    "| Condition | Clean Prompt | Recovered Old Fact | Route | Input Tok | Cached Tok | Est. Cost |",
  );
  lines.push("|---|---:|---:|---:|---:|---:|---:|");
  for (const row of reversibleRows(input.reversible.rows)) {
    lines.push(
      `| ${row.condition} | ${boolCell(row.clean)} | ${boolCell(row.recovered)} | ${boolCell(row.route)} | ${formatTokens(row.tokens.input)} | ${formatTokens(row.tokens.cacheRead)} | ${formatMoney(row.estimatedCost)} |`,
    );
  }

  lines.push("", "## Provenance Lookup", "");
  const provenanceScores = input.blogJudge.summaries.provenance ?? [];
  if (!input.provenanceRun) {
    lines.push(
      "_No portable provenance metric source was found for the judge source. Scores are available, but token/cost cells cannot be regenerated from curated artifacts._",
      "",
    );
  }
  lines.push(
    "| Condition | Judge Score | Cases | Input Tok | Cached Tok | Output + Reasoning Tok | Cache Hit | Est. Cost |",
  );
  lines.push("|---|---:|---:|---:|---:|---:|---:|---:|");
  for (const score of provenanceScores) {
    const condition = provenanceLabels.get(score.label) ?? score.condition;
    const metrics = input.provenanceRun
      ? aggregateRows(input.provenanceRun.rows, condition, score.cases)
      : undefined;
    lines.push(judgeMetricRow(score, metrics));
  }

  lines.push("", "## Memory-Aware Coding", "");
  lines.push(
    "| Condition | Judge Score | Cases | Input Tok | Cached Tok | Output + Reasoning Tok | Cache Hit | Est. Cost |",
  );
  lines.push("|---|---:|---:|---:|---:|---:|---:|---:|");
  for (const score of input.blogJudge.summaries.code_recall ?? []) {
    const condition = codeLabels.get(score.label) ?? score.condition;
    const metrics = aggregateRows(input.codeRecall.rows, condition, score.cases);
    lines.push(judgeMetricRow(score, metrics));
  }

  lines.push("", "## Claim Ledger", "");
  lines.push("| Claim | Status | Evidence | Caveat |");
  lines.push("|---|---|---|---|");
  for (const row of claimLedger(input)) {
    lines.push(
      `| ${row.claim} | ${row.status} | ${row.evidence} | ${row.caveat} |`,
    );
  }

  lines.push("", "## Interpretation", "");
  lines.push(...interpretationBullets(input));
  return lines.join("\n");
}

function sourceLine(file: string) {
  const relative = path.relative(repoRoot, file).replaceAll(path.sep, "/");
  const publicArtifact = relative.startsWith("artifacts/benchmark-runs/");
  return `${relative}${publicArtifact ? "" : " (not a curated public artifact)"}`;
}

function canaryRows(rows: CanaryRow[]) {
  return [...new Set(rows.map((row) => row.condition))].map((condition) => {
    const matching = rows.filter((row) => row.condition === condition);
    return {
      condition: displayCondition(condition),
      canaryPass: passCell(matching.filter((row) => row.canaryPassed).length, matching.length),
      hygienePass: passCell(
        matching.filter((row) => row.contextHygienePassed).length,
        matching.length,
      ),
      tokens: aggregateTokens(matching.map((row) => row.tokens)),
    };
  });
}

function reversibleRows(rows: ReversibleRow[]) {
  const order = ["default", "default-compaction", "rgb-agent", "decant", "decant-guided-rgb"];
  return [...rows]
    .sort((a, b) => order.indexOf(a.condition) - order.indexOf(b.condition))
    .map((row) => ({
      condition: displayCondition(row.condition),
      clean: row.cleanup_passed,
      recovered: row.recovery_passed,
      route: row.route_passed,
      tokens: fillTokens(row.tokens),
      estimatedCost: row.estimated_cost_usd ?? estimateCost(row.tokens),
    }));
}

function aggregateRows(rows: RunRow[], condition: string, caseLimit?: number) {
  const matching = rows
    .filter((row) => row.condition === condition)
    .slice(0, caseLimit);
  const tokens = aggregateTokens(matching.map((row) => row.tokens));
  return {
    cases: matching.length,
    passed: matching.filter((row) => row.benchmark_passed).length,
    tokens,
    estimatedCost: matching.reduce(
      (sum, row) => sum + (row.estimated_cost_usd ?? estimateCost(row.tokens)),
      0,
    ),
  };
}

function aggregateTokens(values: TokenBucket[]): Required<TokenBucket> {
  const total = fillTokens({});
  for (const tokens of values) {
    total.input += tokens.input ?? 0;
    total.output += tokens.output ?? 0;
    total.reasoning += tokens.reasoning ?? 0;
    total.cacheRead += tokens.cacheRead ?? 0;
  }
  return total;
}

function fillTokens(tokens: TokenBucket): Required<TokenBucket> {
  return {
    input: tokens.input ?? 0,
    output: tokens.output ?? 0,
    reasoning: tokens.reasoning ?? 0,
    cacheRead: tokens.cacheRead ?? 0,
  };
}

function judgeMetricRow(score: JudgeSummary, metrics: Aggregate | undefined) {
  const tokens = metrics?.tokens ?? fillTokens({});
  return [
    `| ${score.label}`,
    formatScore(score.judge_score_0_1),
    String(score.cases),
    formatTokens(tokens.input),
    formatTokens(tokens.cacheRead),
    formatTokens(tokens.output + tokens.reasoning),
    formatPercent(cacheHitShare(tokens)),
    metrics ? formatMoney(metrics.estimatedCost) : "",
  ].join(" | ") + " |";
}

function interpretationBullets(input: {
  blogJudge: BlogJudgeAnalysis;
  canaries: Analysis<CanaryRow>;
  reversible: Analysis<ReversibleRow>;
  codeRecall: Analysis<RunRow>;
}) {
  const lines: string[] = [];
  const canary = canaryRows(input.canaries.rows);
  const decantCanary = canary.find((row) =>
    row.condition.toLowerCase().includes("decant"),
  );
  if (decantCanary?.canaryPass === "4/4" && decantCanary.hygienePass === "4/4") {
    lines.push(
      "- Decant's strongest hygiene evidence is context canaries: it keeps the current task clean where default compaction leaks stale summaries.",
    );
  }
  const reversibleDecant = input.reversible.rows.find(
    (row) => row.condition === "decant",
  );
  if (
    reversibleDecant?.cleanup_passed &&
    reversibleDecant.recovery_passed &&
    reversibleDecant.route_passed
  ) {
    lines.push(
      "- Reversible memory is capability evidence: Decant hides old context from the prompt and later recovers exact facts, but the saved run is not a cost win.",
    );
  }
  const codeRows = input.blogJudge.summaries.code_recall ?? [];
  const codeDecant = codeRows.find((row) => row.label === "Decant");
  const codeRgb = codeRows.find((row) => row.label === "RGB-agent");
  if (
    codeDecant &&
    codeRgb &&
    codeDecant.judge_score_0_1 >= codeRgb.judge_score_0_1
  ) {
    lines.push(
      "- Code recall is secondary evidence: Decant is quality-competitive with RGB in the saved judge run, but should not be presented as a clean cost win.",
    );
  }
  return lines;
}

function claimLedger(input: {
  blogJudge: BlogJudgeAnalysis;
  canaries: Analysis<CanaryRow>;
  reversible: Analysis<ReversibleRow>;
  codeRecall: Analysis<RunRow>;
  provenanceRun?: Analysis<RunRow>;
}) {
  const canary = canaryRows(input.canaries.rows);
  const defaultCanary = canary.find((row) =>
    row.condition.toLowerCase().includes("default"),
  );
  const decantCanary = canary.find((row) =>
    row.condition.toLowerCase().includes("decant"),
  );
  const reversible = reversibleRows(input.reversible.rows);
  const reversibleDefault = reversible.find((row) => row.condition === "Default");
  const reversibleRgb = reversible.find((row) => row.condition === "RGB-agent");
  const reversibleDecant = reversible.find((row) => row.condition === "Decant");
  const provenanceScores = input.blogJudge.summaries.provenance ?? [];
  const provenanceDecant = provenanceScores.find((row) => row.label === "Decant");
  const provenanceRgb = provenanceScores.find((row) => row.label === "RGB-agent");
  const provenanceDefault = provenanceScores.find((row) =>
    row.label.toLowerCase().includes("default"),
  );
  const provenanceDecantMetrics =
    input.provenanceRun && provenanceDecant
      ? aggregateRows(
          input.provenanceRun.rows,
          provenanceLabels.get(provenanceDecant.label) ??
            provenanceDecant.condition,
          provenanceDecant.cases,
        )
      : undefined;
  const provenanceRgbMetrics =
    input.provenanceRun && provenanceRgb
      ? aggregateRows(
          input.provenanceRun.rows,
          provenanceLabels.get(provenanceRgb.label) ?? provenanceRgb.condition,
          provenanceRgb.cases,
        )
      : undefined;
  const codeScores = input.blogJudge.summaries.code_recall ?? [];
  const codeDecant = codeScores.find((row) => row.label === "Decant");
  const codeRgb = codeScores.find((row) => row.label === "RGB-agent");
  const codeDecantMetrics = codeDecant
    ? aggregateRows(
        input.codeRecall.rows,
        codeLabels.get(codeDecant.label) ?? codeDecant.condition,
        codeDecant.cases,
      )
    : undefined;
  const codeRgbMetrics = codeRgb
    ? aggregateRows(
        input.codeRecall.rows,
        codeLabels.get(codeRgb.label) ?? codeRgb.condition,
        codeRgb.cases,
      )
    : undefined;

  return [
    {
      claim:
        "Decant prevents stale compacted context from leaking into a task switch better than default compaction.",
      status: "supported",
      evidence: `Context canaries: Decant ${decantCanary?.canaryPass ?? "?"} canary / ${decantCanary?.hygienePass ?? "?"} hygiene vs Default ${defaultCanary?.canaryPass ?? "?"} / ${defaultCanary?.hygienePass ?? "?"}.`,
      caveat: "Small synthetic canaries; Decant used more input/cache tokens in this run.",
    },
    {
      claim:
        "Decant can hide old context from the prompt while preserving exact recovery later.",
      status: "supported as capability evidence",
      evidence: `Reversible memory: Default clean=${boolCell(reversibleDefault?.clean ?? false)} recover=${boolCell(reversibleDefault?.recovered ?? false)}, RGB clean=${boolCell(reversibleRgb?.clean ?? false)} recover=${boolCell(reversibleRgb?.recovered ?? false)}, Decant clean=${boolCell(reversibleDecant?.clean ?? false)} recover=${boolCell(reversibleDecant?.recovered ?? false)}.`,
      caveat: "Not a cost win in the saved run; recovery route is still expensive.",
    },
    {
      claim:
        "On provenance lookup, Decant matches default/RGB quality while using lower normalized cost.",
      status:
        provenanceDecant &&
        provenanceDefault &&
        provenanceRgb &&
        provenanceDecantMetrics &&
        provenanceRgbMetrics &&
        provenanceDecant.judge_score_0_1 >= provenanceDefault.judge_score_0_1 &&
        provenanceDecantMetrics.estimatedCost < provenanceRgbMetrics.estimatedCost
          ? "supported"
          : "partially supported",
      evidence: `Judge scores: Default ${formatScore(provenanceDefault?.judge_score_0_1 ?? 0)}, RGB ${formatScore(provenanceRgb?.judge_score_0_1 ?? 0)}, Decant ${formatScore(provenanceDecant?.judge_score_0_1 ?? 0)}; Decant cost ${formatMoney(provenanceDecantMetrics?.estimatedCost ?? 0)} vs RGB ${formatMoney(provenanceRgbMetrics?.estimatedCost ?? 0)}.`,
      caveat: "Five direct provenance questions over seeded synthetic sessions.",
    },
    {
      claim:
        "On memory-aware coding, Decant is quality-competitive with RGB-agent.",
      status:
        codeDecant &&
        codeRgb &&
        codeDecant.judge_score_0_1 >= codeRgb.judge_score_0_1
          ? "secondary support"
          : "not supported",
      evidence: `Judge scores: RGB ${formatScore(codeRgb?.judge_score_0_1 ?? 0)}, Decant ${formatScore(codeDecant?.judge_score_0_1 ?? 0)}.`,
      caveat: `Do not claim a coding cost win: Decant ${formatMoney(codeDecantMetrics?.estimatedCost ?? 0)} vs RGB ${formatMoney(codeRgbMetrics?.estimatedCost ?? 0)} in this saved run.`,
    },
    {
      claim:
        "Decant generally improves coding solve rate or SWE-bench performance.",
      status: "not established",
      evidence: "No broad live GPT SWE-style solve-rate run proves this yet.",
      caveat: "Keep public claims to context hygiene, provenance routing, and narrow synthetic memory checks.",
    },
    {
      claim: "Decant is cheaper than default/RGB across all infra measures.",
      status: "not supported",
      evidence:
        "Provenance is the clean cost win; reversible memory and code recall are not.",
      caveat:
        "The next GPT run should scale stale-chat volume and split prep/cleanup/recovery cost before making broader cost claims.",
    },
  ];
}

function displayCondition(condition: string) {
  return condition
    .replace("polluted-default-compact", "Default compaction")
    .replace("polluted-decant-cache-stable-boundary-compact", "Decant placeholder")
    .replace("default-compaction", "Default compaction")
    .replace("rgb-agent", "RGB-agent")
    .replace("decant-guided-rgb", "Decant + RGB")
    .replace("decant", "Decant")
    .replace("default", "Default");
}

function estimateCost(tokens: TokenBucket) {
  return (
    ((tokens.input ?? 0) * 5) / 1_000_000 +
    ((tokens.cacheRead ?? 0) * 0.5) / 1_000_000 +
    (((tokens.output ?? 0) + (tokens.reasoning ?? 0)) * 30) / 1_000_000
  );
}

function cacheHitShare(tokens: TokenBucket) {
  const input = tokens.input ?? 0;
  const cacheRead = tokens.cacheRead ?? 0;
  const denominator = input + cacheRead;
  return denominator === 0 ? 0 : cacheRead / denominator;
}

function passCell(pass: number, total: number) {
  return `${pass}/${total}`;
}

function boolCell(value: boolean) {
  return value ? "yes" : "no";
}

function formatScore(value: number) {
  return value.toFixed(2);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatTokens(value: number) {
  if (value === 0) return "";
  if (value < 10_000) return value.toLocaleString();
  return `${Math.round(value / 1000)}K`;
}

await main();
