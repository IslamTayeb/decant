#!/usr/bin/env node
/**
 * Inspect the context map state for a test environment session.
 *
 * Usage:
 *   node --import tsx tools/inspect-context.ts <temp-root|home-dir|maps-dir> [session-id]
 *
 * If session-id is omitted, lists all sessions.
 * Shows: topic fidelity, effective tokens, message treatments, overrides.
 */
import fs from "node:fs/promises";
import path from "node:path";

import { computeContextPreview, computeEffectiveTreatment } from "../src/core";
import type { ContextMapFile } from "../src/types";

type DebugLog = {
  timestamp?: string;
  totals?: { raw_tokens?: number; effective_tokens?: number };
  topics?: Array<{
    label: string;
    fidelity: string;
    raw_tokens: number;
    effective_tokens: number;
  }>;
};

type TraceEvent = {
  ts?: string;
  event?: string;
  topic_count?: number;
  total_tokens?: number;
  before_count?: number;
  after_count?: number;
  messages_removed?: number;
  prompt_length?: number;
  preview?: {
    total_raw_tokens?: number;
    total_effective_tokens?: number;
    topics?: Array<{
      id?: string;
      label?: string;
      fidelity?: string;
      effective_tokens?: number;
      effective_label?: string;
    }>;
  };
  topic_fidelities?: Record<string, string>;
  payload_messages?: Array<{
    id?: string;
    role?: string;
    topic_id?: string;
    topic_label?: string;
    effective_treatment?: string;
    parts?: Array<{
      type: string;
      text?: string;
      tool?: string;
      status?: string;
      output?: unknown;
    }>;
  }>;
  had_annotation?: boolean;
  annotation_topic?: string;
  effective_tokens?: number;
  topic_policies?: Array<{
    id?: string;
    label?: string;
    fidelity?: string;
    source?: string;
    tokens?: number;
  }>;
};

const tempRoot = process.argv[2];
if (!tempRoot) {
  console.error(
    "Usage: node --import tsx tools/inspect-context.ts <temp-root|home-dir|maps-dir> [session-id]",
  );
  process.exit(1);
}

async function resolveMapsDir(input: string) {
  const candidates = [
    path.join(input, "home", ".opencode", "context-maps"),
    path.join(input, ".opencode", "context-maps"),
    input,
  ];
  for (const candidate of candidates) {
    const stat = await fs.stat(candidate).catch(() => undefined);
    if (stat?.isDirectory()) return candidate;
  }
  console.error(
    `Could not find context maps. Tried:\n${candidates.map((c) => `  ${c}`).join("\n")}`,
  );
  process.exit(1);
}

async function main() {
  const mapsDir = await resolveMapsDir(tempRoot);
  const sessionID = process.argv[3];

  if (!sessionID) {
    // List all sessions
    const files = (await fs.readdir(mapsDir)).filter(
      (f) => f.startsWith("ses_") && f.endsWith(".json"),
    );
    console.log(`\n${files.length} sessions in ${mapsDir}\n`);
    for (const file of files.sort()) {
      const map = JSON.parse(
        await fs.readFile(path.join(mapsDir, file), "utf8"),
      ) as ContextMapFile;
      const topicCount = map.topicOrder?.length ?? 0;
      const msgCount = Object.keys(map.messages ?? {}).length;
      console.log(`  ${map.sessionID}  ${topicCount} topics  ${msgCount} msgs`);
    }

    // Check for debug logs
    const debugFiles = (await fs.readdir(mapsDir)).filter((f) =>
      f.endsWith(".debug.json"),
    );
    if (debugFiles.length > 0) {
      console.log(`\n${debugFiles.length} debug logs available`);
    } else {
      console.log(
        "\nNo debug logs yet. Send a message in a session to generate one.",
      );
    }
    return;
  }

  // Show detailed state for one session
  const mapPath = path.join(mapsDir, `${sessionID}.json`);
  let map: ContextMapFile;
  try {
    map = JSON.parse(await fs.readFile(mapPath, "utf8")) as ContextMapFile;
  } catch {
    console.error(`No context map found at ${mapPath}`);
    process.exit(1);
  }

  console.log(`\nSession: ${map.sessionID}`);
  console.log(`Directory: ${map.directory}`);
  console.log(
    `Topics: ${map.topicOrder.length}  Messages: ${Object.keys(map.messages).length}  Total tokens: ${map.totalTokenEstimate}`,
  );

  // Per-topic breakdown
  console.log("\n── Topics ──");
  const previewByTopic = new Map(
    computeContextPreview(map).topics.map((topic) => [topic.id, topic]),
  );
  for (const topicID of map.topicOrder) {
    const topic = map.topics[topicID];
    if (!topic) continue;

    const effective = previewByTopic.get(topicID)?.effectiveTokens ?? 0;
    const msgCount = topic.messageIDs.length;

    // Count overrides
    const overrides: Record<string, number> = {};
    for (const msgID of topic.messageIDs) {
      const msg = map.messages[msgID];
      if (!msg) continue;
      if (msg.hidden) overrides.hidden = (overrides.hidden ?? 0) + 1;
      else if (msg.fidelityOverride !== "inherit")
        overrides[msg.fidelityOverride] =
          (overrides[msg.fidelityOverride] ?? 0) + 1;
    }
    const overrideStr = Object.entries(overrides)
      .map(([k, v]) => `+${v} ${k}`)
      .join(" ");

    console.log(
      `\n  ${topic.label}  [${topic.fidelity}${overrideStr ? " " + overrideStr : ""}]  set-by:${topic.fidelitySource}`,
    );
    console.log(
      `    raw: ${topic.tokenEstimate} tok  effective: ${effective} tok  msgs: ${msgCount}`,
    );
    console.log(`    placeholder: ${topic.placeholder}`);

    // Per-message detail
    for (const msgID of topic.messageIDs) {
      const msg = map.messages[msgID];
      if (!msg) continue;
      const treatment = computeEffectiveTreatment(msg, topic).toUpperCase();
      const flag =
        msg.fidelityOverride !== "inherit"
          ? ` [override:${msg.fidelityOverride}]`
          : "";
      const hiddenFlag = msg.hidden ? " [HIDDEN]" : "";
      console.log(
        `      ${msg.role.padEnd(9)} ${treatment.padEnd(22)} ~${msg.tokenEstimate} tok${flag}${hiddenFlag}  ${msg.summary.slice(0, 50)}`,
      );
    }
  }

  // Check for debug log
  const debugPath = path.join(mapsDir, `${sessionID}.debug.json`);
  try {
    const debug = JSON.parse(await fs.readFile(debugPath, "utf8")) as DebugLog;
    console.log(`\n── Debug Log (${debug.timestamp ?? "unknown"}) ──`);
    console.log(
      `  Raw: ${debug.totals?.raw_tokens ?? 0} tok  Effective: ${debug.totals?.effective_tokens ?? 0} tok`,
    );
    for (const b of debug.topics ?? []) {
      console.log(
        `  ${b.label.padEnd(30)} ${b.fidelity.padEnd(12)} raw:${b.raw_tokens} eff:${b.effective_tokens}`,
      );
    }
  } catch {
    console.log("\n  No debug log yet (send a message to generate one)");
  }

  // Check for trace log
  const tracePath = path.join(mapsDir, `${sessionID}.trace.jsonl`);
  try {
    const lines = (await fs.readFile(tracePath, "utf8"))
      .trim()
      .split("\n")
      .filter(Boolean);
    const events = lines.map((l) => JSON.parse(l) as TraceEvent);
    console.log(`\n── Trace Log (${events.length} events) ──`);
    for (const e of events) {
      const ts = e.ts?.slice(11, 19) ?? "??";
      if (e.event === "system.transform") {
        console.log(
          `  [${ts}] system.transform  topics=${e.topic_count} total_tok=${e.total_tokens}`,
        );
      } else if (e.event === "messages.transform") {
        console.log(
          `  [${ts}] messages.transform  before=${e.before_count} after=${e.after_count} removed=${e.messages_removed}`,
        );
        if (e.preview) {
          console.log(
            `          preview: raw=${e.preview.total_raw_tokens} eff=${e.preview.total_effective_tokens}`,
          );
          for (const b of e.preview.topics ?? []) {
            console.log(
              `          ${(b.label ?? b.id ?? "unknown").padEnd(25)} ${String(b.fidelity).padEnd(12)} eff=${String(b.effective_tokens).padStart(5)} ${b.effective_label}`,
            );
          }
        }
        if (e.topic_fidelities) {
          const fids = Object.entries(e.topic_fidelities)
            .map(([k, v]) => `${k}=${v}`)
            .join(" ");
          console.log(`          fidelities: ${fids}`);
        }
        if (e.payload_messages) {
          console.log(
            `          payload snapshot: ${e.payload_messages.length} messages`,
          );
          for (const m of e.payload_messages) {
            console.log(
              `          - ${m.role} ${m.id} topic=${m.topic_label ?? m.topic_id ?? "none"} treatment=${m.effective_treatment}`,
            );
            for (const part of m.parts ?? []) {
              if (part.type === "text") {
                console.log(`              text: ${JSON.stringify(part.text)}`);
              } else if (part.type === "tool") {
                console.log(
                  `              tool:${part.tool ?? "unknown"} status=${part.status ?? "unknown"} output=${JSON.stringify(part.output ?? "")}`,
                );
              } else {
                console.log(`              ${part.type}`);
              }
            }
          }
        } else {
          console.log(
            "          payload snapshot disabled; launch with DECANT_TRACE_CONTEXT_PAYLOAD=1 to capture exact transformed text",
          );
        }
      } else if (e.event === "text.complete") {
        console.log(
          `  [${ts}] text.complete  annotation=${e.had_annotation} topic=${e.annotation_topic ?? "fallback"} topics=${e.topic_count} eff=${e.effective_tokens}`,
        );
      } else if (e.event === "session.compacting") {
        console.log(
          `  [${ts}] session.compacting  topics=${e.topic_count} prompt_len=${e.prompt_length}`,
        );
        if (e.topic_policies) {
          for (const p of e.topic_policies) {
            console.log(
              `          ${(p.label ?? p.id ?? "unknown").padEnd(25)} ${p.fidelity?.padEnd(12)} src=${p.source} ~${p.tokens} tok`,
            );
          }
        }
      } else {
        console.log(`  [${ts}] ${e.event}`);
      }
    }
  } catch {
    console.log("\n  No trace log yet (send a message to generate one)");
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
