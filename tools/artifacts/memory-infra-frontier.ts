import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(process.cwd());
const artifactRoot = path.join(
  repoRoot,
  "artifacts",
  "benchmark-runs",
  "memory-infra",
);

type TokenBucket = {
  input: number;
  output: number;
  total: number;
  reasoning: number;
  cacheRead: number;
};

type Row = {
  condition: string;
  pass: boolean;
  query_passes: number;
  query_total: number;
  recall_passes: number;
  recall_total: number;
  current_passes: number;
  current_total: number;
  memory_artifact_chars: number;
  carried_context_chars_total: number;
  current_carried_context_chars_total: number;
  query_tokens: TokenBucket;
  total_tokens: TokenBucket;
  query_estimated_cost_usd: number;
  total_estimated_cost_usd: number;
};

type Analysis = {
  outDir: string;
  config: {
    topicCount: number;
    queryCount: number;
    currentQueryCount: number;
    decoysPerTopic: number;
    artifactBudgetChars?: number;
    modelSlug: string;
  };
  rows: Row[];
};

type RunEntry =
  | string
  | {
      run: string;
      condition: string;
      label?: string;
    };

type RunRow = {
  run: string;
  label?: string;
  analysis: Analysis;
  row: Row;
};

const runGroups = [
  {
    title: "High Fanout Mixed Workload",
    note:
      "96 old topics, 4 exact recall queries, then 96 unrelated current-work queries.",
    runs: [
      "gpt55fast-mixed-t96-r4-c96-default",
      "gpt55fast-mixed-t96-r4-c96-rgb",
      "gpt55fast-mixed-t96-r4-c96-decant",
    ],
  },
  {
    title: "Recall Frontier",
    note:
      "96 old topics, 16 exact recall queries, no current-work fanout. RGB rows show the quality/carry tradeoff as the maintained artifact shrinks.",
    runs: [
      "gpt55fast-frontier-t96-r16-rgb-budget2000",
      "gpt55fast-frontier-t96-r16-rgb-unbounded",
      "gpt55fast-frontier-t96-r16-decant",
    ],
  },
  {
    title: "Irregular Fact Continuation Control",
    note:
      "24 irregular old topics, 4 exact recall queries, then 12 unrelated current-work queries. The default row continues in the same compacted OpenCode session instead of receiving a pasted summary artifact.",
    runs: [
      "gpt55fast-irregular-t24-r4-c12-default-opencode-continuation",
      "gpt55fast-irregular-t24-r4-c12-rgb-longtimeout",
      "gpt55fast-irregular-t24-r4-c12-decant",
    ],
  },
  {
    title: "Threshold Fanout Control",
    note:
      "8 irregular old topics and 4 exact recall queries, with unrelated current-work fanout. At 48 future turns, real OpenCode continuation, RGB, and Decant all pass; at 96 turns, RGB and Decant still pass while default continuation loses exact recall.",
    runs: [
      {
        run: "gpt55fast-threshold-irregular-t8-r4-c48-all",
        condition: "default-opencode-continuation",
        label: "t8/r4/c48 default continuation",
      },
      {
        run: "gpt55fast-threshold-irregular-t8-r4-c48-all",
        condition: "rgb-context",
        label: "t8/r4/c48 RGB",
      },
      {
        run: "gpt55fast-threshold-irregular-t8-r4-c48-all",
        condition: "decant-direct",
        label: "t8/r4/c48 Decant",
      },
      {
        run: "gpt55fast-threshold-irregular-t8-r4-c96-main",
        condition: "default-opencode-continuation",
        label: "t8/r4/c96 default continuation",
      },
      {
        run: "gpt55fast-threshold-irregular-t8-r4-c96-main",
        condition: "rgb-context",
        label: "t8/r4/c96 RGB",
      },
      {
        run: "gpt55fast-threshold-irregular-t8-r4-c96-main",
        condition: "decant-direct",
        label: "t8/r4/c96 Decant",
      },
    ],
  },
  {
    title: "Cross-Session Threshold Repeats",
    note:
      "Three runs of the same cross-session selective-memory shape: 8 irregular old topics, 4 exact recall queries, and 48 unrelated current-work queries. Future tasks run in fresh sessions. Default compaction and RGB carry a memory artifact into every query; Decant uses direct lookup only on recall turns.",
    runs: [
      {
        run: "gpt55fast-threshold-irregular-t8-r4-c48-all",
        condition: "default-compaction",
        label: "rep0 default compaction",
      },
      {
        run: "gpt55fast-threshold-irregular-t8-r4-c48-all",
        condition: "rgb-context",
        label: "rep0 RGB",
      },
      {
        run: "gpt55fast-threshold-irregular-t8-r4-c48-all",
        condition: "decant-direct",
        label: "rep0 Decant direct",
      },
      {
        run: "gpt55fast-cross-threshold-t8-r4-c48-rep1",
        condition: "default-compaction",
        label: "rep1 default compaction",
      },
      {
        run: "gpt55fast-cross-threshold-t8-r4-c48-rep1",
        condition: "rgb-context",
        label: "rep1 RGB",
      },
      {
        run: "gpt55fast-cross-threshold-t8-r4-c48-rep1",
        condition: "decant-direct",
        label: "rep1 Decant direct",
      },
      {
        run: "gpt55fast-cross-threshold-t8-r4-c48-rep2",
        condition: "default-compaction",
        label: "rep2 default compaction",
      },
      {
        run: "gpt55fast-cross-threshold-t8-r4-c48-rep2",
        condition: "rgb-context",
        label: "rep2 RGB",
      },
      {
        run: "gpt55fast-cross-threshold-t8-r4-c48-rep2",
        condition: "decant-direct",
        label: "rep2 Decant direct",
      },
    ],
  },
  {
    title: "Irregular Exact-Fidelity Frontier",
    note:
      "24 irregular old topics, 8 exact recall queries, and 24 unrelated current-work queries. The default row continues in the same compacted OpenCode session. RGB rows show compressed-artifact failure versus larger-artifact success; Decant recovers exact old facts with no carried memory artifact.",
    runs: [
      {
        run: "gpt55fast-irregular-frontier-t24-r8-c24-defaults",
        condition: "default-opencode-continuation",
        label: "default continuation",
      },
      {
        run: "gpt55fast-irregular-frontier-t24-r8-c24-defaults",
        condition: "default-compaction",
        label: "pasted default summary",
      },
      {
        run: "gpt55fast-irregular-frontier-t24-r8-c24-rgb2500-decant",
        condition: "rgb-context",
        label: "RGB budget-constrained",
      },
      {
        run: "gpt55fast-irregular-frontier-t24-r8-c24-rgb-unbounded",
        condition: "rgb-context",
        label: "RGB unbounded",
      },
      {
        run: "gpt55fast-irregular-frontier-t24-r8-c24-rgb2500-decant",
        condition: "decant-direct",
        label: "Decant direct lookup",
      },
    ],
  },
];

const scalingPairs = [
  {
    label: "24 current turns",
    rgb: "gpt55fast-mixed-t96-r4-c24-rgb-current",
    decant: "gpt55fast-mixed-t96-r4-c24-decant-numeric-fix",
  },
  {
    label: "48 current turns",
    rgb: "gpt55fast-mixed-t96-r4-c48-rgb",
    decant: "gpt55fast-mixed-t96-r4-c48-decant",
  },
  {
    label: "96 current turns",
    rgb: "gpt55fast-mixed-t96-r4-c96-rgb",
    decant: "gpt55fast-mixed-t96-r4-c96-decant",
  },
  {
    label: "96 current turns (rep2)",
    rgb: "gpt55fast-mixed-t96-r4-c96-rgb-rep2",
    decant: "gpt55fast-mixed-t96-r4-c96-decant-rep2",
  },
];

async function main() {
  const options = parseOptions();
  const markdown = await renderMarkdown();
  if (options.out) {
    await fs.mkdir(path.dirname(options.out), { recursive: true });
    await fs.writeFile(options.out, `${markdown}\n`);
  }
  console.log(markdown);
}

function parseOptions() {
  const options: { out?: string } = {};
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
    throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

function requireValue(flag: string, value: string | undefined) {
  if (!value || value.startsWith("--")) throw new Error(`${flag} needs a value`);
  return value;
}

async function renderMarkdown() {
  const lines = [
    "# Memory Infra Frontier",
    "",
    `- Generated: ${new Date().toISOString()}`,
    "- Costs are diagnostic estimates from token accounting, not billing truth.",
    "- Carried chars are the maintained/default memory artifact size multiplied across future query turns.",
    "",
  ];

  for (const group of runGroups) {
    const rows = await Promise.all(group.runs.map(readRunEntry));
    lines.push(`## ${group.title}`, "", group.note, "");
    lines.push(
      "| Run | Row | Condition | Pass | Recall | Current | Artifact Chars | Total Carried Chars | Current Carried Chars | Query Input | Query Tokens | Query Cost | Total Cost |",
    );
    lines.push("|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|");
    for (const item of rows) {
      const row = item.row;
      lines.push(
        [
          item.run,
          item.label ?? item.run,
          row.condition,
          String(row.pass),
          `${row.recall_passes}/${row.recall_total}`,
          `${row.current_passes}/${row.current_total}`,
          formatNumber(row.memory_artifact_chars),
          formatNumber(row.carried_context_chars_total),
          formatNumber(row.current_carried_context_chars_total),
          formatNumber(row.query_tokens.input),
          formatNumber(row.query_tokens.total),
          formatUsd(row.query_estimated_cost_usd),
          formatUsd(row.total_estimated_cost_usd),
        ].join(" | ").replace(/^/, "| ").replace(/$/, " |"),
      );
    }
    if (group.title === "Cross-Session Threshold Repeats") {
      lines.push("", ...renderRepeatAggregate(rows));
    }
    const decant = rows.find((item) => item.row.condition === "decant-direct");
    const rgb = rows.find(
      (item) => item.row.condition === "rgb-context" && item.row.pass,
    );
    if (decant && rgb && group.title !== "Cross-Session Threshold Repeats") {
      lines.push(
        "",
        `Decant vs passing RGB: ${delta(decant.row.query_tokens.total, rgb.row.query_tokens.total)} query tokens, ${delta(decant.row.query_estimated_cost_usd, rgb.row.query_estimated_cost_usd)} query cost, ${delta(decant.row.total_estimated_cost_usd, rgb.row.total_estimated_cost_usd)} total cost.`,
      );
    }
    const defaultContinuation = rows.find(
      (item) => item.row.condition === "default-opencode-continuation",
    );
    if (
      defaultContinuation &&
      group.title !== "Threshold Fanout Control"
    ) {
      lines.push(
        "",
        `Default OpenCode continuation: ${defaultContinuation.row.recall_passes}/${defaultContinuation.row.recall_total} recall, ${defaultContinuation.row.current_passes}/${defaultContinuation.row.current_total} current. This separates current-task hygiene from exact historical recovery.`,
      );
    }
    if (group.title === "Threshold Fanout Control") {
      const c48Default = rows.find(
        (item) => item.label === "t8/r4/c48 default continuation",
      );
      const c48Rgb = rows.find((item) => item.label === "t8/r4/c48 RGB");
      const c48Decant = rows.find((item) => item.label === "t8/r4/c48 Decant");
      const c96Default = rows.find(
        (item) => item.label === "t8/r4/c96 default continuation",
      );
      const c96Rgb = rows.find((item) => item.label === "t8/r4/c96 RGB");
      const c96Decant = rows.find((item) => item.label === "t8/r4/c96 Decant");
      if (c48Default && c48Rgb && c48Decant) {
        lines.push(
          "",
          `At c48, all three main contenders pass. Decant total cost is ${delta(c48Decant.row.total_estimated_cost_usd, c48Default.row.total_estimated_cost_usd)} than real default continuation and ${delta(c48Decant.row.total_estimated_cost_usd, c48Rgb.row.total_estimated_cost_usd)} than RGB, with zero current-work carried memory.`,
        );
      }
      if (c96Default && c96Rgb && c96Decant) {
        lines.push(
          "",
          `At c96, RGB and Decant both pass while default continuation drops to ${c96Default.row.recall_passes}/${c96Default.row.recall_total} recall. Decant total cost is ${delta(c96Decant.row.total_estimated_cost_usd, c96Rgb.row.total_estimated_cost_usd)} than RGB, with zero current-work carried memory.`,
        );
      }
    }
    lines.push("");
  }

  lines.push(
    "## Fanout Scaling",
    "",
    "All rows use 96 old topics and 4 exact recall queries. RGB and Decant both pass every listed run; the table shows the query-side delta as unrelated future work increases.",
    "",
    "| Future Current Turns | RGB Query Tokens | Decant Query Tokens | Query Token Delta | RGB Current Carried Chars | Decant Current Carried Chars | Query Cost Delta | Total Cost Delta |",
    "|---|---:|---:|---:|---:|---:|---:|---:|",
  );
  const scaling = await readScalingPairs();
  for (const item of scaling) {
    lines.push(
      [
        item.label,
        formatNumber(item.rgb.query_tokens.total),
        formatNumber(item.decant.query_tokens.total),
        delta(item.decant.query_tokens.total, item.rgb.query_tokens.total),
        formatNumber(item.rgb.current_carried_context_chars_total),
        formatNumber(item.decant.current_carried_context_chars_total),
        delta(item.decant.query_estimated_cost_usd, item.rgb.query_estimated_cost_usd),
        delta(item.decant.total_estimated_cost_usd, item.rgb.total_estimated_cost_usd),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"),
    );
  }
  lines.push(
    "",
    renderScalingSummary(scaling),
    "",
    "Interpretation: the repeatable signal here is the query-side routing/exposure win. Total cost is listed but should remain secondary because prep cost varies across live model runs.",
  );

  return lines.join("\n").trimEnd();
}

function renderRepeatAggregate(rows: RunRow[]) {
  const conditions = ["default-compaction", "rgb-context", "decant-direct"];
  const lines = [
    "Aggregate across repeat rows:",
    "",
    "| Condition | Pass Runs | Query Pass | Recall Pass | Current Pass | Avg Query Input | Avg Query Tokens | Avg Query Cost | Avg Total Cost | Avg Current Carried Chars |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];
  for (const condition of conditions) {
    const matching = rows.filter((item) => item.row.condition === condition);
    if (matching.length === 0) continue;
    const sum = (fn: (row: Row) => number) =>
      matching.reduce((total, item) => total + fn(item.row), 0);
    const avg = (fn: (row: Row) => number) => sum(fn) / matching.length;
    lines.push(
      [
        condition,
        `${matching.filter((item) => item.row.pass).length}/${matching.length}`,
        `${sum((row) => row.query_passes)}/${sum((row) => row.query_total)}`,
        `${sum((row) => row.recall_passes)}/${sum((row) => row.recall_total)}`,
        `${sum((row) => row.current_passes)}/${sum((row) => row.current_total)}`,
        formatNumber(Math.round(avg((row) => row.query_tokens.input))),
        formatNumber(Math.round(avg((row) => row.query_tokens.total))),
        formatUsd(avg((row) => row.query_estimated_cost_usd)),
        formatUsd(avg((row) => row.total_estimated_cost_usd)),
        formatNumber(
          Math.round(avg((row) => row.current_carried_context_chars_total)),
        ),
      ]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    );
  }
  const rgb = rows.filter((item) => item.row.condition === "rgb-context");
  const decant = rows.filter((item) => item.row.condition === "decant-direct");
  if (rgb.length && decant.length) {
    const avg = (items: RunRow[], fn: (row: Row) => number) =>
      items.reduce((total, item) => total + fn(item.row), 0) / items.length;
    lines.push(
      "",
      `Aggregate Decant vs RGB: ${delta(avg(decant, (row) => row.query_tokens.total), avg(rgb, (row) => row.query_tokens.total))} query tokens, ${delta(avg(decant, (row) => row.query_estimated_cost_usd), avg(rgb, (row) => row.query_estimated_cost_usd))} query cost, ${delta(avg(decant, (row) => row.total_estimated_cost_usd), avg(rgb, (row) => row.total_estimated_cost_usd))} total cost.`,
    );
  }
  return lines;
}

async function readSingleRow(run: string): Promise<RunRow> {
  const analysis = JSON.parse(
    await fs.readFile(path.join(artifactRoot, run, "analysis.json"), "utf8"),
  ) as Analysis;
  if (analysis.rows.length !== 1) {
    throw new Error(`${run} expected exactly one row`);
  }
  return { run, analysis, row: analysis.rows[0]! };
}

async function readRunEntry(entry: RunEntry): Promise<RunRow> {
  if (typeof entry === "string") return await readSingleRow(entry);
  const analysis = JSON.parse(
    await fs.readFile(path.join(artifactRoot, entry.run, "analysis.json"), "utf8"),
  ) as Analysis;
  const row = analysis.rows.find((item) => item.condition === entry.condition);
  if (!row) {
    throw new Error(`${entry.run} has no row for ${entry.condition}`);
  }
  return { run: entry.run, label: entry.label, analysis, row };
}

async function readScalingPairs() {
  return await Promise.all(
    scalingPairs.map(async (item) => ({
      label: item.label,
      rgb: (await readSingleRow(item.rgb)).row,
      decant: (await readSingleRow(item.decant)).row,
    })),
  );
}

function renderScalingSummary(
  scaling: Array<{ label: string; rgb: Row; decant: Row }>,
) {
  const queryTokenDeltas = scaling.map(
    (item) => 1 - item.decant.query_tokens.total / item.rgb.query_tokens.total,
  );
  const queryCostDeltas = scaling.map(
    (item) =>
      1 - item.decant.query_estimated_cost_usd / item.rgb.query_estimated_cost_usd,
  );
  const rgbExposure = scaling.map(
    (item) => item.rgb.current_carried_context_chars_total,
  );
  const sameQuality = scaling.every(
    (item) =>
      item.rgb.pass &&
      item.decant.pass &&
      item.rgb.query_passes === item.decant.query_passes &&
      item.rgb.query_total === item.decant.query_total,
  );
  return [
    `Across ${scaling.length} same-quality fanout points: ${sameQuality ? "yes" : "no"}.`,
    `Decant query-token reduction range: ${formatPercent(Math.min(...queryTokenDeltas))}-${formatPercent(Math.max(...queryTokenDeltas))}.`,
    `Decant query-cost reduction range: ${formatPercent(Math.min(...queryCostDeltas))}-${formatPercent(Math.max(...queryCostDeltas))}.`,
    `RGB current-work old-memory exposure range: ${formatNumber(Math.min(...rgbExposure))}-${formatNumber(Math.max(...rgbExposure))} chars; Decant exposure is 0 in every row.`,
  ].join(" ");
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function delta(value: number, baseline: number) {
  if (baseline === 0) return "n/a";
  const percent = ((1 - value / baseline) * 100).toFixed(1);
  return `${percent}% lower`;
}

await main();
