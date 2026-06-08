import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { createOpencodeClient } from "@opencode-ai/sdk/v2";

import { parseModelSlug, requiredModelSlug } from "../../tools/model";
import {
  createSession as createOpenCodeSession,
  listProviders,
  listSessionMessages as listOpenCodeSessionMessages,
} from "../../tools/opencode-sdk";

const repoRoot = path.resolve(process.cwd());
const defaultOutDir = path.join(
  repoRoot,
  "benchmarks",
  "memory-infra",
  "runs",
  timestampForPath(new Date()),
);

type ConditionID =
  | "default-compaction"
  | "default-opencode-continuation"
  | "rgb-context"
  | "decant-map"
  | "decant-direct"
  | "decant-archive-continuation";

type Options = {
  conditions: ConditionID[];
  outDir: string;
  modelSlug: string;
  promptTimeoutMs: number;
  topicCount: number;
  queryCount: number;
  currentQueryCount: number;
  decoysPerTopic: number;
  artifactBudgetChars?: number;
  irregularFacts: boolean;
};

type SessionMessage = {
  id?: string;
  info?: {
    id?: string;
    role?: string;
    finish?: string;
    summary?: boolean;
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
  finish?: string;
  parts?: Array<{
    type: string;
    text?: string;
    tool?: string;
    state?: {
      status?: string;
      input?: unknown;
      output?: unknown;
    };
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

type Topic = {
  id: string;
  title: string;
  file: string;
  flag: string;
  test: string;
  accepted: string;
  rejected: string;
  why: string;
  avoid: string;
};

type CurrentCase = {
  id: string;
  title: string;
  ticket: string;
  file: string;
  owner: string;
  guardrail: string;
  check: string;
  avoid: string;
};

type Query = {
  kind: "recall" | "current";
  id: string;
  topic?: Topic;
  current?: CurrentCase;
  text: string;
  required: string[];
  forbidden: string[];
};

type QueryStats = {
  kind: Query["kind"];
  query_id: string;
  topic_id: string;
  passed: boolean;
  required_hits: string[];
  missing_required: string[];
  forbidden_hits: string[];
  output_preview: string;
  tool_names: string[];
  context_tool_call_count: number;
  tokens: TokenBucket;
};

type RunStats = {
  condition: ConditionID;
  pass: boolean;
  query_passes: number;
  query_total: number;
  recall_passes: number;
  recall_total: number;
  current_passes: number;
  current_total: number;
  topic_count: number;
  decoys_per_topic: number;
  memory_artifact_chars: number;
  raw_log_chars: number;
  carried_context_chars_per_query: number;
  carried_context_chars_total: number;
  current_carried_context_chars_total: number;
  prep_tokens: TokenBucket;
  query_tokens: TokenBucket;
  recall_query_tokens: TokenBucket;
  current_query_tokens: TokenBucket;
  total_tokens: TokenBucket;
  prep_estimated_cost_usd: number;
  query_estimated_cost_usd: number;
  total_estimated_cost_usd: number;
  avg_query_input_tokens: number;
  max_query_input_tokens: number;
  avg_query_tool_calls: number;
  unnecessary_context_tool_calls: number;
  route_passed: boolean;
  queries: QueryStats[];
  memory_artifact_preview: string;
  duration_ms: number;
  error?: string;
};

type Analysis = {
  outDir: string;
  generatedAt: string;
  config: {
    topicCount: number;
    queryCount: number;
    currentQueryCount: number;
    decoysPerTopic: number;
    artifactBudgetChars?: number;
    irregularFacts?: boolean;
    modelSlug: string;
  };
  rows: RunStats[];
};

const defaultConditions: ConditionID[] = [
  "default-compaction",
  "rgb-context",
  "decant-map",
  "decant-direct",
];
const validConditions: ConditionID[] = [
  ...defaultConditions,
  "default-opencode-continuation",
  "decant-archive-continuation",
];

const topicSeeds = [
  [
    "checkout idempotency",
    "src/checkout/idempotency.ts",
    "FLAG_CHECKOUT_IDEMPOTENCY_V3",
    "checkout_dedupes_retry_after_timeout",
    "per-cart idempotency key store",
    "global checkout mutex",
    "preserves shard-local ordering while letting unrelated carts retry independently",
    "billing retry backoff",
  ],
  [
    "search index freshness",
    "src/search/freshness.ts",
    "FLAG_INDEX_EPOCH_GUARD",
    "search_rejects_stale_epoch_publish",
    "epoch-stamped publish barrier",
    "blind last-write-wins publish",
    "prevents a slow crawl from replacing a newer index snapshot",
    "autocomplete ranking cleanup",
  ],
  [
    "email digest batching",
    "src/mail/digest.ts",
    "FLAG_DIGEST_BATCH_WINDOW",
    "digest_batches_by_workspace_timezone",
    "workspace-local send window",
    "single UTC midnight cron",
    "keeps quiet-hour promises without delaying every workspace behind one global clock",
    "template footer rewrite",
  ],
  [
    "webhook replay protection",
    "src/webhooks/replay.ts",
    "FLAG_WEBHOOK_NONCE_LEDGER",
    "webhook_rejects_reused_nonce",
    "nonce ledger keyed by provider event id",
    "timestamp-only replay window",
    "blocks fast replays even when the attacker stays inside the timestamp tolerance",
    "stripe retry cosmetics",
  ],
  [
    "cache namespace TTL",
    "src/cache/namespace_ttl.ts",
    "FLAG_NAMESPACE_TTL_CAP",
    "cache_caps_noisy_namespace_ttl",
    "namespace maximum TTL cap",
    "provider-wide hard-coded TTL",
    "lets each namespace set a bounded freshness budget without penalizing unrelated caches",
    "image preview freshness",
  ],
  [
    "feature rollout sampling",
    "src/rollout/sampling.ts",
    "FLAG_STICKY_ROLLOUT_HASH",
    "rollout_keeps_user_bucket_stable",
    "stable hash over actor and flag",
    "per-request random sampling",
    "prevents a user from bouncing between treatment and control across refreshes",
    "analytics dashboard color",
  ],
  [
    "csv import quarantine",
    "src/imports/quarantine.ts",
    "FLAG_IMPORT_ROW_QUARANTINE",
    "import_quarantines_bad_rows_only",
    "row-level quarantine ledger",
    "abort entire import on first invalid row",
    "lets clean rows commit while preserving exact diagnostics for rejected rows",
    "spreadsheet column autosize",
  ],
  [
    "notification fanout",
    "src/notify/fanout.ts",
    "FLAG_FANOUT_BACKPRESSURE",
    "fanout_applies_channel_backpressure",
    "per-channel bounded queue",
    "unbounded global fanout array",
    "prevents a slow SMS provider from exhausting memory for email and push sends",
    "notification icon set",
  ],
  [
    "session rotation",
    "src/session/rotation.ts",
    "FLAG_SESSION_ROTATION_GRACE",
    "session_accepts_previous_cookie_once",
    "one-use previous-cookie grace",
    "accept every old cookie until expiry",
    "avoids logout races during rotation while still closing replay opportunities",
    "login page copy",
  ],
  [
    "audit log redaction",
    "src/audit/redact.ts",
    "FLAG_AUDIT_FIELD_ALLOWLIST",
    "audit_redacts_unknown_fields",
    "field allowlist redactor",
    "regex-only secret scrubber",
    "keeps newly added sensitive fields private even before regexes are updated",
    "audit table pagination",
  ],
  [
    "report export leases",
    "src/reports/export_lease.ts",
    "FLAG_EXPORT_LEASE_STEAL",
    "export_worker_steals_expired_lease",
    "expiring worker lease with compare-and-swap",
    "permanent worker ownership",
    "lets a new worker recover abandoned exports without duplicating active work",
    "CSV heading title case",
  ],
  [
    "tenant config snapshots",
    "src/config/snapshot.ts",
    "FLAG_CONFIG_SNAPSHOT_PIN",
    "config_pins_snapshot_for_request",
    "request-scoped config snapshot",
    "live config reads at every call site",
    "keeps one request internally consistent while allowing later requests to see updates",
    "settings sidebar grouping",
  ],
] as const;

async function main() {
  const options = parseOptions();
  await fs.mkdir(options.outDir, { recursive: true });
  await fs.writeFile(
    path.join(options.outDir, "config.json"),
    `${JSON.stringify(options, null, 2)}\n`,
  );

  const topics = buildTopics(options.topicCount, options.irregularFacts);
  const queries = interleaveQueries(
    buildQueries(topics, options.queryCount),
    buildCurrentQueries(options.currentQueryCount),
  );
  const rows: RunStats[] = [];
  for (const condition of options.conditions) {
    const conditionDir = path.join(options.outDir, "conditions", condition);
    await fs.mkdir(conditionDir, { recursive: true });
    rows.push(await runCondition(condition, conditionDir, options, topics, queries));
  }

  const analysis: Analysis = {
    outDir: options.outDir,
    generatedAt: new Date().toISOString(),
    config: {
      topicCount: options.topicCount,
      queryCount: options.queryCount,
      currentQueryCount: options.currentQueryCount,
      decoysPerTopic: options.decoysPerTopic,
      artifactBudgetChars: options.artifactBudgetChars,
      irregularFacts: options.irregularFacts,
      modelSlug: options.modelSlug,
    },
    rows,
  };
  await writeAnalysisFiles(options.outDir, analysis);
  console.log(renderAnalysisMarkdown(analysis));
  console.log(`Memory infra artifacts written to ${options.outDir}`);
}

async function runCondition(
  condition: ConditionID,
  conditionDir: string,
  options: Options,
  topics: Topic[],
  queries: Query[],
): Promise<RunStats> {
  const startedAt = Date.now();
  const worktree = path.join(conditionDir, "worktree");
  const opencodeRoot = resolveOpenCodeRoot(conditionDir);
  let server: Awaited<ReturnType<typeof startServer>> | undefined;
  let client: ReturnType<typeof createOpencodeClient> | undefined;
  let memoryArtifact = "";
  let rawLogChars = 0;
  let prepMessages: SessionMessage[] = [];
  let prepSession: string | undefined;
  const queryStats: QueryStats[] = [];
  const queryMessages: SessionMessage[] = [];
  try {
    await prepareWorktree(worktree);
    const env = await buildOpenCodeEnv({
      opencodeRoot,
      conditionDir,
      modelSlug: options.modelSlug,
      plugin: isDecantCondition(condition),
      taskBoundary: condition === "decant-archive-continuation",
    });
    server = await startServer(env, worktree);
    client = createOpencodeClient({ baseUrl: server.url });
    await pickModel(client, worktree, options.modelSlug, 60_000);
    console.log(`memory-infra: ${condition} prep`);

    prepSession = await createSession(
      client,
      worktree,
      `memory infra ${condition} prep`,
    );
    const seedTurns = buildSeedTurns(topics, options.decoysPerTopic);
    for (const turn of seedTurns) {
      await prompt(
        client,
        worktree,
        prepSession,
        turn,
        seedSystemPrompt(),
        {},
        options.promptTimeoutMs,
      );
    }

    if (
      condition === "default-compaction" ||
      condition === "default-opencode-continuation" ||
      condition === "decant-archive-continuation"
    ) {
      await summarizeSession(
        client,
        worktree,
        prepSession,
        options.modelSlug,
        options.promptTimeoutMs,
      );
      const compacted = await listSessionMessages(client, worktree, prepSession);
      const summary = [...compacted]
        .reverse()
        .find(
          (message) =>
            (message.info?.role ?? message.role) === "assistant" &&
            message.info?.summary === true &&
            messageText(message).trim().length > 0,
        );
      assert.ok(summary, "default compaction did not create a summary");
      memoryArtifact = messageText(summary).trim();
    }

    prepMessages = await listSessionMessages(client, worktree, prepSession);
    await fs.writeFile(
      path.join(conditionDir, "prep-messages.json"),
      `${JSON.stringify(prepMessages, null, 2)}\n`,
    );
    if (memoryArtifact) {
      await fs.writeFile(path.join(conditionDir, "memory-artifact.md"), memoryArtifact);
    }
    if (condition === "rgb-context") {
      rawLogChars = await writeRgbRawLog(worktree, conditionDir, prepMessages);
    }

    for (const query of queries) {
      console.log(`memory-infra: ${condition} ${query.id}`);
      if (condition === "rgb-context") {
        await prepareRgbEditableContext(worktree, query.id);
      }
      const querySession = isSameSessionContinuation(condition)
        ? prepSession
        : await createSession(
            client,
            worktree,
            `memory infra ${condition} ${query.id}`,
          );
      const input = buildQueryPrompt(condition, query, memoryArtifact, worktree);
      const before = await listSessionMessages(client, worktree, querySession);
      const beforeIDs = new Set(before.map(sessionMessageID));
      await prompt(
        client,
        worktree,
        querySession,
        input.text,
        input.system,
        input.tools,
        options.promptTimeoutMs,
      );
      const after = await listSessionMessages(client, worktree, querySession);
      const messages = after.filter(
        (message) => !beforeIDs.has(sessionMessageID(message)),
      );
      queryMessages.push(...messages);
      const stats = buildQueryStats(condition, query, messages);
      queryStats.push(stats);
      const queryDir = path.join(conditionDir, "queries", query.id);
      await fs.mkdir(queryDir, { recursive: true });
      if (condition === "rgb-context") {
        await archiveRgbEditableContext(worktree, query.id, queryDir);
      }
      await fs.writeFile(
        path.join(queryDir, "messages.json"),
        `${JSON.stringify(messages, null, 2)}\n`,
      );
      await fs.writeFile(
        path.join(queryDir, "stats.json"),
        `${JSON.stringify(stats, null, 2)}\n`,
      );
    }

    const stats = buildRunStats({
      condition,
      topicCount: topics.length,
      options,
      startedAt,
      memoryArtifact,
      rawLogChars,
      prepMessages,
      queryMessages,
      queryStats,
    });
    await fs.writeFile(
      path.join(conditionDir, "stats.json"),
      `${JSON.stringify(stats, null, 2)}\n`,
    );
    await server?.close();
    server = undefined;
    await cleanupRunState(conditionDir, worktree);
    return stats;
  } catch (error) {
    const message =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    if (server && client && prepSession && prepMessages.length === 0) {
      prepMessages = await listSessionMessages(client, worktree, prepSession).catch(
        () => [],
      );
    }
    const stats = buildRunStats({
      condition,
      topicCount: topics.length,
      options,
      startedAt,
      memoryArtifact,
      rawLogChars,
      prepMessages,
      queryMessages,
      queryStats,
      error: message,
    });
    await fs.writeFile(
      path.join(conditionDir, "stats.json"),
      `${JSON.stringify(stats, null, 2)}\n`,
    );
    await server?.close().catch(() => undefined);
    server = undefined;
    await cleanupRunState(conditionDir, worktree);
    return stats;
  } finally {
    await server?.close();
  }
}

function parseOptions(): Options {
  const args = process.argv.slice(2);
  const conditions = valueArg(args, "--conditions")
    ? (splitList(valueArg(args, "--conditions")!) as ConditionID[])
    : defaultConditions;
  for (const condition of conditions) {
    assert.ok(validConditions.includes(condition), `unknown condition: ${condition}`);
  }
  const topicCount = Number(valueArg(args, "--topic-count") ?? "12");
  const queryCount = Number(valueArg(args, "--query-count") ?? "4");
  const currentQueryCount = Number(valueArg(args, "--current-query-count") ?? "0");
  const decoysPerTopic = Number(valueArg(args, "--decoys-per-topic") ?? "1");
  const artifactBudgetChars = valueArg(args, "--artifact-budget-chars");
  const timeoutMinutes = Number(valueArg(args, "--prompt-timeout-minutes") ?? "10");
  const irregularFacts = args.includes("--irregular-facts");
  assert.ok(Number.isInteger(topicCount) && topicCount >= 1);
  assert.ok(Number.isInteger(queryCount) && queryCount >= 0);
  assert.ok(Number.isInteger(currentQueryCount) && currentQueryCount >= 0);
  assert.ok(Number.isInteger(decoysPerTopic) && decoysPerTopic >= 0);
  assert.ok(Number.isFinite(timeoutMinutes) && timeoutMinutes > 0);
  if (artifactBudgetChars) {
    assert.ok(
      Number.isFinite(Number(artifactBudgetChars)) &&
        Number(artifactBudgetChars) > 0,
      "--artifact-budget-chars must be a positive number",
    );
  }
  return {
    conditions,
    outDir: path.resolve(valueArg(args, "--out") ?? defaultOutDir),
    modelSlug: requiredModelSlug(),
    promptTimeoutMs: timeoutMinutes * 60_000,
    topicCount,
    queryCount: Math.min(queryCount, topicCount),
    currentQueryCount,
    decoysPerTopic,
    irregularFacts,
    artifactBudgetChars: artifactBudgetChars
      ? Number(artifactBudgetChars)
      : undefined,
  };
}

function buildTopics(count: number, irregularFacts = false) {
  return Array.from({ length: count }, (_, index): Topic => {
    const seed = topicSeeds[index % topicSeeds.length];
    const cycle = Math.floor(index / topicSeeds.length) + 1;
    if (irregularFacts) return irregularTopic(seed, index, cycle);
    const suffix = count > topicSeeds.length ? `_R${cycle}` : "";
    return {
      id: `${seed[0].replaceAll(" ", "_")}_${cycle}`,
      title: cycle === 1 ? seed[0] : `${seed[0]} round ${cycle}`,
      file: seed[1],
      flag: `${seed[2]}${suffix}`,
      test: `${seed[3]}${suffix.toLowerCase()}`,
      accepted: cycle === 1 ? seed[4] : `${seed[4]} round ${cycle}`,
      rejected: cycle === 1 ? seed[5] : `${seed[5]} round ${cycle}`,
      why: cycle === 1 ? seed[6] : `${seed[6]} in round ${cycle}`,
      avoid: cycle === 1 ? seed[7] : `${seed[7]} round ${cycle}`,
    };
  });
}

function irregularTopic(
  seed: (typeof topicSeeds)[number],
  index: number,
  cycle: number,
): Topic {
  const base = seed[0].replaceAll(" ", "_");
  const caseCode = stableCode(`${base}:${index}:case`);
  const flagCode = stableCode(`${base}:${index}:flag`);
  const testCode = stableCode(`${base}:${index}:test`).toLowerCase();
  const acceptedCode = stableCode(`${base}:${index}:accepted`);
  const rejectedCode = stableCode(`${base}:${index}:rejected`);
  const whyCode = stableCode(`${base}:${index}:why`);
  const title = `${seed[0]} incident ${caseCode.toLowerCase()}`;
  return {
    id: `${base}_${caseCode.toLowerCase()}`,
    title,
    file: seed[1].replace(/\.ts$/, `.${caseCode.toLowerCase()}.ts`),
    flag: `${seed[2]}_${flagCode}`,
    test: `${seed[3]}_${testCode}`,
    accepted: `${seed[4]} with ${wordAt(index, 0)}-${wordAt(index, 3)} guard ${acceptedCode}`,
    rejected: `${seed[5]} after ${wordAt(index, 7)}-${wordAt(index, 11)} rollback ${rejectedCode}`,
    why: `${seed[6]}; marker ${whyCode} preserved ${wordAt(index, 17)} isolation for case ${cycle}`,
    avoid: `${seed[7]} stale path ${stableCode(`${base}:${index}:avoid`)}`,
  };
}

function stableCode(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(7, "0");
}

function wordAt(index: number, offset: number) {
  const words = [
    "amber",
    "brisk",
    "cedar",
    "dovetail",
    "ember",
    "fennel",
    "glacier",
    "harbor",
    "indigo",
    "jigsaw",
    "keystone",
    "lantern",
    "marble",
    "nickel",
    "onyx",
    "prairie",
    "quartz",
    "rivet",
    "saffron",
    "topaz",
    "umbra",
    "velvet",
    "willow",
    "xenon",
  ];
  return words[(index * 5 + offset) % words.length]!;
}

function buildQueries(topics: Topic[], queryCount: number): Query[] {
  const selected = evenlySample(topics, queryCount);
  return selected.map((topic, index) => ({
    kind: "recall",
    id: `q${String(index + 1).padStart(2, "0")}_${topic.id}`,
    topic,
    text: [
      `Recall the maintained decision for ${topic.title}.`,
      `Return the rollout flag, failed/protective test, accepted design, rejected design, and why the accepted design won.`,
      "Use only the memory mechanism available in this condition; do not guess from general knowledge.",
    ].join(" "),
    required: [topic.flag, topic.test, topic.accepted, topic.rejected, topic.why],
    forbidden: [topic.avoid, "decoy", "distractor"],
  }));
}

function buildCurrentQueries(count: number): Query[] {
  return Array.from({ length: count }, (_, index) => {
    const current = buildCurrentCase(index + 1);
    const distractors = [index + 101, index + 202, index + 303]
      .map((item) => buildCurrentCase(item))
      .filter((item) => item.id !== current.id);
    return {
      kind: "current",
      id: `c${String(index + 1).padStart(2, "0")}_${current.id}`,
      current,
      text: [
        "Current work packet, unrelated to historical memory:",
        "```text",
        ...[current, ...distractors].map(formatCurrentCase),
        "```",
        `Find ticket ${current.ticket}.`,
        "Return the ticket, owner, patch file, guardrail, and expected check exactly as written.",
        "Do not use historical memory, rollout flags, old decisions, or context tools for this current packet.",
      ].join("\n"),
      required: [
        current.ticket,
        current.owner,
        current.file,
        current.guardrail,
        current.check,
      ],
      forbidden: [current.avoid, "FLAG_", "rollout flag", "historical memory"],
    };
  });
}

function buildCurrentCase(index: number): CurrentCase {
  const owners = [
    "maya-current",
    "noah-current",
    "lina-current",
    "omar-current",
    "priya-current",
    "sol-current",
  ];
  const guardrails = [
    "reject writes unless current_workspace_id matches envelope",
    "cap retry window at the active deploy generation",
    "require local checksum before publishing the manifest",
    "pin the request clock before evaluating freshness",
    "isolate dry-run output from committed audit rows",
    "compare normalized route keys before cache lookup",
  ];
  const checks = [
    "current_packet_rejects_cross_workspace_write",
    "current_packet_caps_retry_generation",
    "current_packet_verifies_manifest_checksum",
    "current_packet_pins_request_clock",
    "current_packet_keeps_dry_run_out_of_audit",
    "current_packet_normalizes_route_cache_key",
  ];
  const slot = (index - 1) % owners.length;
  return {
    id: `current_packet_${index}`,
    title: `current packet ${index}`,
    ticket: `CURR-${String(index).padStart(4, "0")}`,
    file: `src/current/work_packet_${String(index).padStart(3, "0")}.ts`,
    owner: owners[slot]!,
    guardrail: guardrails[slot]!,
    check: checks[slot]!,
    avoid: `avoid: stale-current-decoy-${String(index).padStart(4, "0")}`,
  };
}

function formatCurrentCase(item: CurrentCase) {
  return [
    `ticket: ${item.ticket}`,
    `title: ${item.title}`,
    `patch_file: ${item.file}`,
    `owner: ${item.owner}`,
    `guardrail: ${item.guardrail}`,
    `expected_check: ${item.check}`,
    item.avoid,
  ].join(" | ");
}

function interleaveQueries(recall: Query[], current: Query[]) {
  const output: Query[] = [];
  const max = Math.max(recall.length, current.length);
  for (let index = 0; index < max; index++) {
    if (current[index]) output.push(current[index]!);
    if (recall[index]) output.push(recall[index]!);
  }
  return output;
}

function buildSeedTurns(topics: Topic[], decoysPerTopic: number) {
  const turns: string[] = [];
  for (const topic of topics) {
    turns.push(relevantTurn(topic));
    for (let index = 1; index <= decoysPerTopic; index++) {
      turns.push(decoyTurn(topic, index));
    }
  }
  turns.push(
    "Boundary note: the product-memory investigation is complete. Future questions may ask for one old decision at a time. Do not carry every old detail into unrelated work unless a memory tool or maintained context marks it relevant.",
  );
  return turns;
}

function relevantTurn(topic: Topic) {
  return [
    `Switch topics. Topic: ${topic.title}.`,
    `Source file: ${topic.file}.`,
    `Important rollout flag: ${topic.flag}.`,
    `Protective test: ${topic.test}.`,
    `Accepted design: ${topic.accepted}.`,
    `Rejected design: ${topic.rejected}.`,
    `Why accepted won: ${topic.why}.`,
    `Stale neighboring detail to avoid for this topic: ${topic.avoid}.`,
    "Preserve these exact strings for future selective-memory questions.",
  ].join("\n");
}

function decoyTurn(topic: Topic, index: number) {
  return [
    `Switch topics to an explicit DISTRACTOR for ${topic.title}, variant ${index}.`,
    `This is explicitly not the accepted decision for ${topic.file}.`,
    `Wrong flag: FLAG_DECOY_${topic.id.toUpperCase()}_${index}.`,
    `Wrong test: decoy_${topic.id}_${index}_test.`,
    `Wrong design: ${topic.avoid}.`,
    "If a future question asks for the maintained decision, ignore this distractor.",
  ].join("\n");
}

function seedSystemPrompt() {
  return [
    "This is historical memory for an agent-infra benchmark.",
    "Do not edit files or call tools.",
    "Acknowledge concisely while preserving exact flags, tests, accepted designs, rejected designs, and stale details to avoid.",
  ].join(" ");
}

function rgbFileAgentSystemPrompt() {
  return [
    "You are an RGB-agent file-memory runner for a memory-infra benchmark.",
    "Use only read, grep, and bash over the provided editable context file, raw log, and scratch directory.",
    "Do not use Decant tools.",
    "Do not edit source files, benchmark files, or recall/log.txt.",
    "You may rewrite, trim, annotate, or otherwise edit the provided context.txt copy inside the scratch directory.",
    "Use bash/python3 only for search, extraction, or editing files inside the provided scratch directory.",
    "After any tool use, answer with compact JSON only.",
  ].join(" ");
}

function rgbFileAgentTools() {
  return {
    ...noTools(),
    read: true,
    grep: true,
    bash: true,
  };
}

function buildRgbFileAgentPrompt(
  worktree: string,
  query: Query,
  outputContract: string,
) {
  const logPath = rgbLogPath(worktree);
  const scratchDir = rgbScratchDir(worktree, query.id);
  const contextPath = rgbEditableContextPath(worktree, query.id);
  const taskInstruction =
    query.kind === "current"
      ? [
          "This is a current-work packet. The current packet below is the source of truth.",
          "The context file and raw log are old memory. Do not use old rollout flags, old decisions, or stale facts for this answer.",
          "You may edit context.txt down to an irrelevant-memory note if that helps keep the final answer clean.",
        ]
      : [
          "This is an old-memory recall question.",
          "Search context.txt or the raw log for the exact historical topic and exact strings requested below.",
          "You may edit context.txt into a smaller evidence file before answering.",
          "Prefer targeted grep/read calls before broader bash/python3 parsing.",
        ];
  return [
    `Raw historical log: ${logPath}`,
    `Editable context file: ${contextPath}`,
    `Scratch directory: ${scratchDir}`,
    "",
    "Rules:",
    "- Do not modify recall/log.txt.",
    "- You may edit context.txt and create scratch files inside the scratch directory.",
    "- Do not edit files outside the scratch directory.",
    "- Do not answer from general knowledge.",
    "- End with only the compact JSON object requested below.",
    "",
    ...taskInstruction,
    "",
    query.text,
    outputContract,
  ].join("\n");
}

function rgbLogPath(worktree: string) {
  return path.join(worktree, "recall", "log.txt");
}

function rgbScratchDir(worktree: string, queryID: string) {
  return path.join(worktree, "recall", "rgb-work", queryID);
}

function rgbEditableContextPath(worktree: string, queryID: string) {
  return path.join(rgbScratchDir(worktree, queryID), "context.txt");
}

function buildQueryPrompt(
  condition: ConditionID,
  query: Query,
  memoryArtifact: string,
  worktree: string,
): { text: string; system: string; tools: Record<string, boolean> } {
  if (query.kind === "current") {
    const outputContract = [
      "Return compact JSON with keys ticket, owner, patch_file, guardrail, expected_check, source.",
      "The answer must include exact strings from the current work packet only.",
    ].join(" ");
    const textWithArtifact = (label: string) =>
      [
        `${label}:`,
        "```md",
        memoryArtifact,
        "```",
        "",
        query.text,
        outputContract,
      ].join("\n");

    if (condition === "default-compaction") {
      return {
        system: jsonSystemPrompt(),
        tools: noTools(),
        text: textWithArtifact("Default compaction summary"),
      };
    }
    if (
      condition === "default-opencode-continuation" ||
      condition === "decant-archive-continuation"
    ) {
      return {
        system: jsonSystemPrompt(),
        tools: noTools(),
        text: [query.text, outputContract].join("\n"),
      };
    }
    if (condition === "rgb-context") {
      return {
        system: rgbFileAgentSystemPrompt(),
        tools: rgbFileAgentTools(),
        text: buildRgbFileAgentPrompt(worktree, query, outputContract),
      };
    }
    const decantTools =
      condition === "decant-direct"
        ? { ...noTools(), session_lookup: true }
        : {
            session_lookup: true,
            session_detail: true,
            message_detail: true,
            view_context: false,
            session_tree: false,
            set_fidelity: false,
            bash: false,
            read: false,
            grep: false,
          };
    return {
      system: [
        jsonSystemPrompt(),
        "This is a current-work packet, not a historical-memory question.",
        "Do not call Decant context tools for current packets.",
        "Answer only from the current packet in the user message.",
      ].join(" "),
      tools: decantTools,
      text: [query.text, outputContract].join("\n"),
    };
  }

  const outputContract = [
    "Return compact JSON with keys title, flag, test, accepted_design, rejected_design, why, citation, ignored.",
    "The answer must include exact strings from memory.",
  ].join(" ");
  if (condition === "default-compaction") {
    return {
      system: jsonSystemPrompt(),
      tools: noTools(),
      text: [
        "Default compaction summary:",
        "```md",
        memoryArtifact,
        "```",
        "",
        query.text,
        outputContract,
      ].join("\n"),
    };
  }
  if (condition === "default-opencode-continuation") {
    return {
      system: jsonSystemPrompt(),
      tools: noTools(),
      text: [query.text, outputContract].join("\n"),
    };
  }
  if (condition === "decant-archive-continuation") {
    return {
      system: [
        jsonSystemPrompt(),
        "This is the same session after compaction.",
        "Use view_context to inspect compacted_archive topics.",
        "Then call session_detail exactly once on the matching archived topic with detail='full'.",
        "Answer from the compaction archive detail. Do not use session_lookup or raw transcript files.",
      ].join(" "),
      tools: {
        ...noTools(),
        view_context: true,
        session_detail: true,
      },
      text: [query.text, outputContract].join("\n"),
    };
  }
  if (condition === "rgb-context") {
    return {
      system: rgbFileAgentSystemPrompt(),
      tools: rgbFileAgentTools(),
      text: buildRgbFileAgentPrompt(worktree, query, outputContract),
    };
  }
  if (condition === "decant-direct") {
    return {
      system: [
        jsonSystemPrompt(),
        "Use Decant session_lookup to find the relevant historical topic.",
        "Call session_lookup exactly once with the exact topic title, limit=1, and detail='full'.",
        "Answer from the included topic detail. Do not use raw transcript files.",
      ].join(" "),
      tools: {
        ...noTools(),
        session_lookup: true,
      },
      text: [query.text, outputContract].join("\n"),
    };
  }
  return {
    system: [
      jsonSystemPrompt(),
      "Use Decant tools to find the relevant historical topic.",
      "Call session_lookup with the exact topic title first. Use at most two lookup calls.",
      "Then use session_detail on the best returned topic and message_detail only if needed.",
      "Do not use raw transcript files.",
    ].join(" "),
    tools: {
      session_lookup: true,
      session_detail: true,
      message_detail: true,
      view_context: false,
      session_tree: false,
      set_fidelity: false,
      bash: false,
      read: false,
      grep: false,
    },
    text: [query.text, outputContract].join("\n"),
  };
}

function noTools() {
  return {
    bash: false,
    glob: false,
    grep: false,
    read: false,
    write: false,
    edit: false,
    apply_patch: false,
    session_lookup: false,
    session_detail: false,
    message_detail: false,
    session_tree: false,
    view_context: false,
    set_fidelity: false,
  };
}

function jsonSystemPrompt() {
  return "Answer with compact JSON only. Do not edit files.";
}

function buildQueryStats(
  condition: ConditionID,
  query: Query,
  messages: SessionMessage[],
): QueryStats {
  const output = messageText(latestAssistantMessage(messages));
  const requiredHits = query.required.filter((term) => includesTerm(output, term));
  const missingRequired = query.required.filter(
    (term) => !includesTerm(output, term),
  );
  const forbiddenHits = query.forbidden.filter((term) => includesTerm(output, term));
  const toolNames = toolParts(messages)
    .map((part) => part.tool)
    .filter((tool): tool is string => Boolean(tool));
  const contextToolCount = toolNames.filter((tool) =>
    ["view_context", "set_fidelity", "session_lookup", "session_detail", "message_detail"].includes(tool),
  ).length;
  const routeOk = queryRoutePolicyPassed(condition, query, toolNames);
  const contentOk =
    missingRequired.length === 0 &&
    (query.kind === "current" ? forbiddenHits.length === 0 : true);
  return {
    kind: query.kind,
    query_id: query.id,
    topic_id: query.topic?.id ?? query.current?.id ?? query.id,
    passed: contentOk && routeOk,
    required_hits: requiredHits,
    missing_required: missingRequired,
    forbidden_hits: forbiddenHits,
    output_preview: output.slice(0, 1200),
    tool_names: toolNames,
    context_tool_call_count: contextToolCount,
    tokens: summarizeTokens(messages),
  };
}

function routePolicyPassed(condition: ConditionID, queries: QueryStats[]) {
  return queries.every((query) =>
    query.kind === "current"
      ? query.context_tool_call_count === 0
      : queryRoutePolicyPassed(condition, query, query.tool_names),
  );
}

function queryRoutePolicyPassed(
  condition: ConditionID,
  query: Pick<Query, "kind">,
  toolNames: string[],
) {
  const contextToolCount = toolNames.filter((tool) =>
    ["view_context", "set_fidelity", "session_lookup", "session_detail", "message_detail"].includes(tool),
  ).length;
  if (query.kind === "current") return contextToolCount === 0;
  if (condition === "rgb-context") {
    return toolNames.some((tool) => ["read", "grep", "bash"].includes(tool));
  }
  if (!isDecantCondition(condition)) return contextToolCount === 0;
  if (condition === "decant-archive-continuation") {
    return (
      toolNames.includes("view_context") &&
      toolNames.includes("session_detail")
    );
  }
  if (condition === "decant-direct") return toolNames.includes("session_lookup");
  return (
    toolNames.includes("session_lookup") &&
    (toolNames.includes("session_detail") || toolNames.includes("message_detail"))
  );
}

function isDecantCondition(condition: ConditionID) {
  return (
    condition === "decant-map" ||
    condition === "decant-direct" ||
    condition === "decant-archive-continuation"
  );
}

function isSameSessionContinuation(condition: ConditionID) {
  return (
    condition === "default-opencode-continuation" ||
    condition === "decant-archive-continuation"
  );
}

function buildRunStats({
  condition,
  topicCount,
  options,
  startedAt,
  memoryArtifact,
  rawLogChars,
  prepMessages,
  queryMessages,
  queryStats,
  error,
}: {
  condition: ConditionID;
  topicCount: number;
  options: Options;
  startedAt: number;
  memoryArtifact: string;
  rawLogChars: number;
  prepMessages: SessionMessage[];
  queryMessages: SessionMessage[];
  queryStats: QueryStats[];
  error?: string;
}): RunStats {
  const prepTokens = summarizeTokens(prepMessages);
  const queryTokens = summarizeTokens(queryMessages);
  const totalTokens = combineTokenBuckets([prepTokens, queryTokens]);
  const routePassed = routePolicyPassed(condition, queryStats);
  const recallStats = queryStats.filter((query) => query.kind === "recall");
  const currentStats = queryStats.filter((query) => query.kind === "current");
  const recallTokens = combineTokenBuckets(
    recallStats.map((query) => query.tokens),
  );
  const currentTokens = combineTokenBuckets(
    currentStats.map((query) => query.tokens),
  );
  const carriedContextChars = isDecantCondition(condition) || condition === "rgb-context"
    ? 0
    : memoryArtifact.length;
  const queryCount = queryStats.length;
  const maxQueryInputTokens =
    queryCount === 0
      ? 0
      : Math.max(...queryStats.map((query) => query.tokens.input));
  return {
    condition,
    pass: !error && queryStats.every((query) => query.passed) && routePassed,
    query_passes: queryStats.filter((query) => query.passed).length,
    query_total: queryCount || options.queryCount + options.currentQueryCount,
    recall_passes: recallStats.filter((query) => query.passed).length,
    recall_total: recallStats.length || options.queryCount,
    current_passes: currentStats.filter((query) => query.passed).length,
    current_total: currentStats.length || options.currentQueryCount,
    topic_count: topicCount,
    decoys_per_topic: options.decoysPerTopic,
    memory_artifact_chars: memoryArtifact.length,
    raw_log_chars: rawLogChars,
    carried_context_chars_per_query: carriedContextChars,
    carried_context_chars_total: carriedContextChars * queryCount,
    current_carried_context_chars_total:
      carriedContextChars * currentStats.length,
    prep_tokens: prepTokens,
    query_tokens: queryTokens,
    recall_query_tokens: recallTokens,
    current_query_tokens: currentTokens,
    total_tokens: totalTokens,
    prep_estimated_cost_usd: estimateCostUSD(prepTokens),
    query_estimated_cost_usd: estimateCostUSD(queryTokens),
    total_estimated_cost_usd: estimateCostUSD(totalTokens),
    avg_query_input_tokens:
      queryCount === 0 ? 0 : Math.round(queryTokens.input / queryCount),
    max_query_input_tokens: maxQueryInputTokens,
    avg_query_tool_calls:
      queryCount === 0
        ? 0
        : queryStats.reduce((sum, query) => sum + query.tokens.toolCalls, 0) /
          queryCount,
    unnecessary_context_tool_calls: currentStats.reduce(
      (sum, query) => sum + query.context_tool_call_count,
      0,
    ),
    route_passed: routePassed,
    queries: queryStats,
    memory_artifact_preview: memoryArtifact.slice(0, 1600),
    duration_ms: Date.now() - startedAt,
    error,
  };
}

async function prepareWorktree(worktree: string) {
  await fs.mkdir(worktree, { recursive: true });
  await fs.writeFile(
    path.join(worktree, "README.md"),
    "# Memory infra benchmark\n\nSynthetic workspace for memory-only queries.\n",
  );
}

async function writeRgbRawLog(
  worktree: string,
  conditionDir: string,
  messages: SessionMessage[],
) {
  const recallDir = path.join(worktree, "recall");
  await fs.mkdir(recallDir, { recursive: true });
  const log = messages
    .map((message, index) => {
      const role = message.info?.role ?? message.role ?? "unknown";
      const id = sessionMessageID(message) ?? `message-${index + 1}`;
      return [
        `## message ${index + 1}`,
        `id: ${id}`,
        `role: ${role}`,
        messageText(message),
        "",
      ].join("\n");
    })
    .join("\n");
  await fs.writeFile(rgbLogPath(worktree), log);
  await fs.writeFile(path.join(conditionDir, "raw-log.txt"), log);
  return log.length;
}

async function prepareRgbEditableContext(worktree: string, queryID: string) {
  const scratchDir = rgbScratchDir(worktree, queryID);
  await fs.mkdir(scratchDir, { recursive: true });
  await fs.copyFile(rgbLogPath(worktree), rgbEditableContextPath(worktree, queryID));
}

async function archiveRgbEditableContext(
  worktree: string,
  queryID: string,
  queryDir: string,
) {
  await fs.copyFile(
    rgbEditableContextPath(worktree, queryID),
    path.join(queryDir, "context.txt"),
  );
}

async function cleanupRunState(conditionDir: string, worktree: string) {
  await Promise.all([
    fs.rm(path.join(conditionDir, "opencode-root"), {
      recursive: true,
      force: true,
    }),
    fs.rm(worktree, { recursive: true, force: true }),
  ]).catch(() => undefined);
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
  taskBoundary?: boolean;
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
    ...(input.taskBoundary ? { DECANT_TASK_BOUNDARY: "1" } : {}),
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
  proc.stderr.on("data", (chunk) => (stderr += chunk.toString()));
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
      reject(new Error(`Sandbox server exited early with code ${code}\n${stderr}`));
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
      const exited = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5_000);
        proc.once("exit", () => {
          clearTimeout(timeout);
          resolve(true);
        });
      });
      if (!exited && proc.exitCode === null) {
        proc.kill("SIGKILL");
        await new Promise((resolve) => proc.once("exit", resolve));
      }
    },
  };
}

async function pickModel(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  modelSlug: string,
  timeoutMs: number,
) {
  const requested = parseModelSlug(modelSlug);
  const providers = await withTimeout(
    listProviders(client, directory),
    timeoutMs,
    "list providers timed out",
  );
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
  assert.ok(session.id, "created session is missing id");
  return session.id;
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

async function summarizeSession(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  sessionID: string,
  modelSlug: string,
  timeoutMs: number,
) {
  const model = parseModelSlug(modelSlug);
  const raw = (await withTimeout(
    client.session.summarize({
      sessionID,
      directory,
      providerID: model.providerID,
      modelID: model.modelID,
      auto: false,
    }),
    timeoutMs,
    `compaction timed out in ${sessionID}`,
  )) as { data?: unknown; error?: unknown };
  const dataError =
    raw.data && typeof raw.data === "object"
      ? (raw.data as { error?: unknown }).error
      : undefined;
  if (raw.error || dataError) {
    throw new Error(JSON.stringify(raw.error ?? dataError));
  }
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
  const beforeIDs = new Set(before.map(sessionMessageID));
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
    const reversed = [...messages].reverse();
    const errored = reversed.find(
      (message) =>
        (message.info?.role ?? message.role) === "assistant" &&
        !beforeIDs.has(sessionMessageID(message)) &&
        assistantError(message),
    );
    if (errored) {
      throw new Error(
        `assistant error in ${sessionID}: ${JSON.stringify(assistantError(errored))}`,
      );
    }
    const completed = reversed.find(
      (message) =>
        (message.info?.role ?? message.role) === "assistant" &&
        !beforeIDs.has(sessionMessageID(message)) &&
        assistantFinish(message) &&
        assistantFinish(message) !== "tool-calls",
    );
    if (completed) return completed;
  }
  throw new Error(`timed out waiting for assistant message in ${sessionID}`);
}

function sessionMessageID(message: SessionMessage) {
  return message.info?.id ?? message.id;
}

function assistantError(message: SessionMessage) {
  return message.info?.error ?? message.error;
}

function assistantFinish(message: SessionMessage) {
  return message.info?.finish ?? message.finish;
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

function toolParts(messages: SessionMessage[]) {
  return messages.flatMap((message) =>
    (message.parts ?? []).filter((part) => part.type === "tool"),
  );
}

function summarizeTokens(messages: SessionMessage[]) {
  const bucket = emptyTokenBucket();
  bucket.messages = messages.length;
  for (const message of messages) {
    if ((message.info?.role ?? message.role) === "assistant") {
      bucket.assistant += 1;
    }
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
    bucket.toolCalls += (message.parts ?? []).filter(
      (part) => part.type === "tool",
    ).length;
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

function combineTokenBuckets(buckets: TokenBucket[]) {
  const total = emptyTokenBucket();
  for (const bucket of buckets) {
    total.messages += bucket.messages;
    total.assistant += bucket.assistant;
    total.input += bucket.input;
    total.output += bucket.output;
    total.total += bucket.total;
    total.reasoning += bucket.reasoning;
    total.cacheRead += bucket.cacheRead;
    total.cacheWrite += bucket.cacheWrite;
    total.toolCalls += bucket.toolCalls;
    total.maxInput = Math.max(total.maxInput, bucket.maxInput);
  }
  return total;
}

function estimateCostUSD(tokens: TokenBucket) {
  return (
    (tokens.input * 5) / 1_000_000 +
    (tokens.cacheRead * 0.5) / 1_000_000 +
    ((tokens.output + tokens.reasoning) * 30) / 1_000_000
  );
}

function includesTerm(text: string, term: string) {
  return text.toLowerCase().includes(term.toLowerCase());
}

function evenlySample<T>(items: T[], count: number) {
  if (count >= items.length) return items;
  if (count <= 1) return items.slice(0, count);
  return Array.from({ length: count }, (_, index) => {
    const itemIndex = Math.round((index * (items.length - 1)) / (count - 1));
    return items[itemIndex]!;
  });
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function valueArg(args: string[], name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function timestampForPath(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "Z");
}

async function writeAnalysisFiles(outDir: string, analysis: Analysis) {
  await fs.writeFile(
    path.join(outDir, "analysis.json"),
    `${JSON.stringify(analysis, null, 2)}\n`,
  );
  await fs.writeFile(path.join(outDir, "analysis.md"), renderAnalysisMarkdown(analysis));
  await fs.writeFile(path.join(outDir, "analysis.csv"), renderAnalysisCsv(analysis));
}

function renderAnalysisMarkdown(analysis: Analysis) {
  const lines = [
    "# Memory Infra Benchmark Analysis",
    "",
    `- Run: ${analysis.outDir}`,
    `- Generated: ${analysis.generatedAt}`,
    `- Topics: ${analysis.config.topicCount}`,
    `- Recall queries: ${analysis.config.queryCount}`,
    `- Current queries: ${analysis.config.currentQueryCount}`,
    `- Decoys/topic: ${analysis.config.decoysPerTopic}`,
    `- Irregular facts: ${String(Boolean(analysis.config.irregularFacts))}`,
    ...(analysis.config.artifactBudgetChars
      ? [`- Artifact budget chars: ${analysis.config.artifactBudgetChars}`]
      : []),
    "",
    "| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Raw Log Chars | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];
  for (const row of analysis.rows) {
    lines.push(
      `| ${row.condition} | ${String(row.pass)} | ${row.query_passes}/${row.query_total} | ${row.recall_passes}/${row.recall_total} | ${row.current_passes}/${row.current_total} | ${row.prep_tokens.input.toLocaleString()} | ${row.query_tokens.input.toLocaleString()} | ${row.recall_query_tokens.input.toLocaleString()} | ${row.current_query_tokens.input.toLocaleString()} | ${row.avg_query_input_tokens.toLocaleString()} | ${row.max_query_input_tokens.toLocaleString()} | ${row.query_tokens.total.toLocaleString()} | ${row.raw_log_chars.toLocaleString()} | ${row.carried_context_chars_per_query.toLocaleString()} | ${row.carried_context_chars_total.toLocaleString()} | ${row.current_carried_context_chars_total.toLocaleString()} | $${row.prep_estimated_cost_usd.toFixed(2)} | $${row.query_estimated_cost_usd.toFixed(2)} | ${row.unnecessary_context_tool_calls.toLocaleString()} | ${String(row.route_passed)} |`,
    );
  }
  lines.push("", "## Query Details", "");
  lines.push(
    "| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |",
  );
  lines.push("|---|---|---|---:|---|---|---|---:|");
  for (const row of analysis.rows) {
    for (const query of row.queries) {
      lines.push(
        `| ${row.condition} | ${query.kind} | ${query.query_id} | ${String(query.passed)} | ${query.missing_required.join("; ")} | ${query.forbidden_hits.join("; ")} | ${query.tool_names.join(" -> ")} | ${query.tokens.input.toLocaleString()} |`,
      );
    }
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function renderAnalysisCsv(analysis: Analysis) {
  const rows = [
    [
      "condition",
      "pass",
      "query_passes",
      "query_total",
      "recall_passes",
      "recall_total",
      "current_passes",
      "current_total",
      "irregular_facts",
      "prep_input",
      "query_input",
      "recall_input",
      "current_input",
      "avg_query_input",
      "max_query_input",
      "query_total_tokens",
      "raw_log_chars",
      "carried_context_chars_per_query",
      "carried_context_chars_total",
      "current_carried_context_chars_total",
      "prep_cost",
      "query_cost",
      "unnecessary_context_tool_calls",
      "route_passed",
    ],
    ...analysis.rows.map((row) => [
      row.condition,
      String(row.pass),
      String(row.query_passes),
      String(row.query_total),
      String(row.recall_passes),
      String(row.recall_total),
      String(row.current_passes),
      String(row.current_total),
      String(Boolean(analysis.config.irregularFacts)),
      String(row.prep_tokens.input),
      String(row.query_tokens.input),
      String(row.recall_query_tokens.input),
      String(row.current_query_tokens.input),
      String(row.avg_query_input_tokens),
      String(row.max_query_input_tokens),
      String(row.query_tokens.total),
      String(row.raw_log_chars),
      String(row.carried_context_chars_per_query),
      String(row.carried_context_chars_total),
      String(row.current_carried_context_chars_total),
      row.prep_estimated_cost_usd.toFixed(6),
      row.query_estimated_cost_usd.toFixed(6),
      String(row.unnecessary_context_tool_calls),
      String(row.route_passed),
    ]),
  ];
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function csvCell(value: string) {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

await main();
