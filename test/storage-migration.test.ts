import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  archiveContextMapForCompaction,
  readCompactionArchive,
  readContextMap,
  sessionMapPath,
} from "../src/storage";
import type { ContextMapFile } from "../src/types";

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

test("readCompactionArchive returns archived context map", async () => {
  const oldHome = process.env.HOME;
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "decant-test-"));
  process.env.HOME = home;

  try {
    const map = {
      version: 1,
      sessionID: "ses_archive",
      createdAt: 1,
      updatedAt: 1,
      totalTokenEstimate: 10,
      settings: {
        placeholderIncludesKeyFacts: true,
        placeholderIncludesKeyFactsSource: "default",
        toolHistoryCleanup: true,
        stablePlaceholders: false,
        stablePlaceholdersSource: "default",
        stableAnchors: false,
        stableAnchorsSource: "default",
      },
      topicOrder: ["auth"],
      topics: {
        auth: {
          id: "auth",
          label: "auth",
          summary: "Auth topic",
          placeholder: "Auth topic",
          keyFacts: ["queue won"],
          fidelity: "full",
          fidelitySource: "default",
          messageIDs: ["m1"],
          tokenEstimate: 10,
          createdAt: 1,
          lastActiveAt: 1,
          commitHashes: [],
        },
      },
      messages: {
        m1: {
          id: "m1",
          role: "assistant",
          topicID: "auth",
          summary: "Explained auth queue",
          keyFacts: ["queue won"],
          hidden: false,
          hiddenSource: "default",
          fidelityOverride: "inherit",
          fidelitySource: "default",
          tokenEstimate: 10,
          createdAt: 1,
          updatedAt: 1,
          source: "derived",
          partTypes: ["text"],
          toolNames: [],
        },
      },
      pendingRetroactive: {},
    } satisfies ContextMapFile;

    const archivePath = await archiveContextMapForCompaction({
      map,
      compactedAt: 2,
      summaryMessageID: "summary",
      summaryText: "Compacted summary",
    });
    const archive = await readCompactionArchive(archivePath);

    assert.equal(archive?.sessionID, "ses_archive");
    assert.equal(archive?.map.topics.auth?.keyFacts[0], "queue won");
    assert.equal(archive?.compaction.summaryText, "Compacted summary");
  } finally {
    process.env.HOME = oldHome;
    await fs.rm(home, { recursive: true, force: true });
  }
});
