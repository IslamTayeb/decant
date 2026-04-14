#!/usr/bin/env node
/**
 * Inspect the context map state for a test environment session.
 *
 * Usage:
 *   node --import tsx scripts/inspect-context.ts <temp-root> [session-id]
 *
 * If session-id is omitted, lists all sessions.
 * Shows: blob fidelity, effective tokens, message treatments, overrides.
 */
import fs from "node:fs/promises";
import path from "node:path";

const tempRoot = process.argv[2];
if (!tempRoot) {
  console.error(
    "Usage: node --import tsx scripts/inspect-context.ts <temp-root> [session-id]",
  );
  process.exit(1);
}

const mapsDir = path.join(tempRoot, "home", ".opencode", "context-maps");

async function main() {
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
      );
      const blobCount = map.blobOrder?.length ?? 0;
      const msgCount = Object.keys(map.messages ?? {}).length;
      console.log(`  ${map.sessionID}  ${blobCount} blobs  ${msgCount} msgs`);
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
  let map: any;
  try {
    map = JSON.parse(await fs.readFile(mapPath, "utf8"));
  } catch {
    console.error(`No context map found at ${mapPath}`);
    process.exit(1);
  }

  console.log(`\nSession: ${map.sessionID}`);
  console.log(`Directory: ${map.directory}`);
  console.log(
    `Blobs: ${map.blobOrder.length}  Messages: ${Object.keys(map.messages).length}  Total tokens: ${map.totalTokenEstimate}`,
  );

  // Per-blob breakdown
  console.log("\n── Blobs ──");
  for (const blobID of map.blobOrder) {
    const blob = map.blobs[blobID];
    if (!blob) continue;

    // Compute effective tokens
    let effective: number;
    const msgCount = blob.messageIDs.length;
    switch (blob.fidelity) {
      case "full": {
        effective = blob.messageIDs.reduce((s: number, id: string) => {
          const m = map.messages[id];
          return s + (m && !m.hidden ? m.tokenEstimate : 0);
        }, 0);
        break;
      }
      case "summary":
        effective = Math.min(blob.tokenEstimate, msgCount * 60);
        break;
      case "compressed":
        effective = Math.min(blob.tokenEstimate, 150);
        break;
      case "placeholder":
        effective = Math.min(blob.tokenEstimate, 30);
        break;
      case "drop":
        effective = 0;
        break;
      default:
        effective = blob.tokenEstimate;
    }

    // Count overrides
    const overrides: Record<string, number> = {};
    for (const msgID of blob.messageIDs) {
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
      `\n  ${blob.label}  [${blob.fidelity}${overrideStr ? " " + overrideStr : ""}]  set-by:${blob.fidelitySource}`,
    );
    console.log(
      `    raw: ${blob.tokenEstimate} tok  effective: ${effective} tok  msgs: ${msgCount}`,
    );
    console.log(`    placeholder: ${blob.placeholder}`);

    // Per-message detail
    for (const msgID of blob.messageIDs) {
      const msg = map.messages[msgID];
      if (!msg) continue;
      let treatment: string;
      if (blob.fidelity === "drop") treatment = "DROPPED";
      else if (blob.fidelity === "placeholder") treatment = "PLACEHOLDER-STUB";
      else if (blob.fidelity === "compressed") treatment = "COMPRESSED";
      else if (msg.hidden) treatment = "HIDDEN";
      else if (blob.fidelity === "summary") {
        treatment =
          msg.fidelityOverride === "full"
            ? "KEPT-FULL (override)"
            : "SUMMARIZED";
      } else {
        treatment =
          msg.fidelityOverride === "summary"
            ? "SUMMARIZED (override)"
            : "KEPT-FULL";
      }
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
    const debug = JSON.parse(await fs.readFile(debugPath, "utf8"));
    console.log(`\n── Debug Log (${debug.timestamp}) ──`);
    console.log(
      `  Raw: ${debug.totals.raw_tokens} tok  Effective: ${debug.totals.effective_tokens} tok`,
    );
    for (const b of debug.blobs) {
      console.log(
        `  ${b.label.padEnd(30)} ${b.fidelity.padEnd(12)} raw:${b.raw_tokens} eff:${b.effective_tokens}`,
      );
    }
  } catch {
    console.log("\n  No debug log yet (send a message to generate one)");
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
