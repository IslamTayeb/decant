import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { readContextMap, sessionMapPath } from "../src/storage";

test("readContextMap migrates legacy drop fidelity to hidden", async () => {
  const oldHome = process.env.HOME;
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "decant-test-"));
  process.env.HOME = home;

  try {
    const sessionID = "ses_legacy_drop";
    const filePath = sessionMapPath(sessionID);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(
      filePath,
      JSON.stringify({
        version: 1,
        sessionID,
        createdAt: 1,
        updatedAt: 1,
        totalTokenEstimate: 0,
        topicOrder: ["old_topic"],
        topics: {
          old_topic: {
            id: "old_topic",
            label: "old_topic",
            summary: "Old topic",
            placeholder: "Old topic",
            keyFacts: [],
            fidelity: "drop",
            fidelitySource: "user",
            messageIDs: [],
            tokenEstimate: 0,
            createdAt: 1,
            lastActiveAt: 1,
            commitHashes: [],
          },
        },
        messages: {},
        pendingRetroactive: {},
      }),
    );

    const map = await readContextMap({ sessionID });
    assert.equal(map.topics.old_topic?.fidelity, "hidden");
  } finally {
    process.env.HOME = oldHome;
    await fs.rm(home, { recursive: true, force: true });
  }
});
