import assert from "node:assert/strict";
import test from "node:test";

import {
  computeContextPreview,
  transformMessagesForContext,
  updateMessageControls,
} from "../src/core";
import type {
  ContextMapFile,
  MessageEntry,
  MessageLike,
  TopicEntry,
} from "../src/types";

const now = 1;

function message(input: Partial<MessageEntry> & Pick<MessageEntry, "id">) {
  return {
    id: input.id,
    role: "assistant",
    topicID: input.topicID,
    summary: input.summary ?? input.id,
    keyFacts: [],
    hidden: input.hidden ?? false,
    hiddenSource: input.hiddenSource ?? "default",
    fidelityOverride: input.fidelityOverride ?? "inherit",
    fidelitySource: input.fidelitySource ?? "default",
    tokenEstimate: input.tokenEstimate ?? 1000,
    createdAt: now,
    updatedAt: now,
    source: "derived",
    partTypes: ["text"],
    toolNames: [],
  } satisfies MessageEntry;
}

function topic(input: Partial<TopicEntry> & Pick<TopicEntry, "id">) {
  const messageIDs = input.messageIDs ?? [];
  return {
    id: input.id,
    label: input.label ?? input.id,
    summary: input.summary ?? input.id,
    placeholder: input.placeholder ?? input.id,
    keyFacts: [],
    fidelity: input.fidelity ?? "full",
    fidelitySource: "default",
    messageIDs,
    tokenEstimate: input.tokenEstimate ?? messageIDs.length * 1000,
    createdAt: now,
    lastActiveAt: now,
    commitHashes: [],
  } satisfies TopicEntry;
}

function map(topics: TopicEntry[], messages: MessageEntry[]) {
  return {
    version: 1,
    sessionID: "ses_test",
    createdAt: now,
    updatedAt: now,
    totalTokenEstimate: topics.reduce(
      (sum, item) => sum + item.tokenEstimate,
      0,
    ),
    settings: {
      placeholderIncludesKeyFacts: true,
      placeholderIncludesKeyFactsSource: "default",
      toolHistoryCleanup: true,
      stablePlaceholders: false,
      stablePlaceholdersSource: "default",
      stableAnchors: false,
      stableAnchorsSource: "default",
    },
    topicOrder: topics.map((item) => item.id),
    topics: Object.fromEntries(topics.map((item) => [item.id, item])),
    messages: Object.fromEntries(messages.map((item) => [item.id, item])),
    pendingRetroactive: {},
  } satisfies ContextMapFile;
}

function messageLike(id: string, text: string): MessageLike {
  return {
    info: {
      id,
      role: "assistant",
      time: { created: now },
    },
    parts: [
      {
        id: `${id}-part`,
        type: "text",
        text,
      },
    ],
  };
}

test("context preview token percentages include message overrides", () => {
  const messages = [
    message({ id: "full", topicID: "full_topic", tokenEstimate: 1000 }),
    message({
      id: "summarized",
      topicID: "full_topic",
      tokenEstimate: 1000,
      fidelityOverride: "summary",
    }),
    message({
      id: "hidden",
      topicID: "full_topic",
      tokenEstimate: 1000,
      hidden: true,
    }),
    message({ id: "summary", topicID: "summary_topic", tokenEstimate: 1000 }),
    message({
      id: "forced_full",
      topicID: "summary_topic",
      tokenEstimate: 1000,
      fidelityOverride: "full",
    }),
  ];
  const preview = computeContextPreview(
    map(
      [
        topic({
          id: "full_topic",
          fidelity: "full",
          messageIDs: ["full", "summarized", "hidden"],
          tokenEstimate: 3000,
        }),
        topic({
          id: "summary_topic",
          fidelity: "summary",
          messageIDs: ["summary", "forced_full"],
          tokenEstimate: 2000,
        }),
      ],
      messages,
    ),
  );

  assert.equal(preview.topics[0]?.effectiveTokens, 1060);
  assert.equal(preview.topics[1]?.effectiveTokens, 1060);
  assert.equal(preview.totalEffective, 2120);
});

test("message summary locks are preserved inside summary topics", () => {
  const contextMap = map(
    [topic({ id: "summary_topic", fidelity: "summary", messageIDs: ["m1"] })],
    [message({ id: "m1", topicID: "summary_topic" })],
  );

  const result = updateMessageControls({
    map: contextMap,
    messageID: "m1",
    fidelityOverride: "summary",
    source: "user",
  });

  assert.equal(result.ok, true);
  assert.equal(contextMap.messages.m1?.fidelityOverride, "summary");
  assert.equal(contextMap.messages.m1?.fidelitySource, "user");
});

test("agent message changes do not override user fidelity locks", () => {
  const contextMap = map(
    [topic({ id: "summary_topic", fidelity: "summary", messageIDs: ["m1"] })],
    [
      message({
        id: "m1",
        topicID: "summary_topic",
        fidelityOverride: "summary",
        fidelitySource: "user",
      }),
    ],
  );

  const result = updateMessageControls({
    map: contextMap,
    messageID: "m1",
    fidelityOverride: "full",
    source: "agent",
  });

  assert.equal(result.ok, false);
  assert.equal(contextMap.messages.m1?.fidelityOverride, "summary");
});

test("message hidden state clears fidelity locks", () => {
  const contextMap = map(
    [topic({ id: "topic", fidelity: "full", messageIDs: ["m1"] })],
    [
      message({
        id: "m1",
        topicID: "topic",
        fidelityOverride: "full",
      }),
    ],
  );

  updateMessageControls({
    map: contextMap,
    messageID: "m1",
    hidden: true,
    fidelityOverride: "inherit",
    source: "user",
  });

  assert.equal(contextMap.messages.m1?.hidden, true);
  assert.equal(contextMap.messages.m1?.fidelityOverride, "inherit");
});

test("message visible states clear hidden state", () => {
  const contextMap = map(
    [topic({ id: "topic", fidelity: "hidden", messageIDs: ["m1"] })],
    [
      message({
        id: "m1",
        topicID: "topic",
        hidden: true,
      }),
    ],
  );

  updateMessageControls({
    map: contextMap,
    messageID: "m1",
    hidden: false,
    fidelityOverride: "summary",
    source: "user",
  });

  assert.equal(contextMap.messages.m1?.hidden, false);
  assert.equal(contextMap.messages.m1?.fidelityOverride, "summary");
});

test("hidden topics allow explicit full and summary message overrides", () => {
  const entries = [
    message({ id: "auto", topicID: "hidden_topic", tokenEstimate: 1000 }),
    message({
      id: "summary",
      topicID: "hidden_topic",
      summary: "locked summary",
      tokenEstimate: 1000,
      fidelityOverride: "summary",
    }),
    message({
      id: "full",
      topicID: "hidden_topic",
      tokenEstimate: 1000,
      fidelityOverride: "full",
    }),
    message({
      id: "hidden_message",
      topicID: "hidden_topic",
      tokenEstimate: 1000,
      hidden: true,
      fidelityOverride: "full",
    }),
  ];
  const contextMap = map(
    [
      topic({
        id: "hidden_topic",
        fidelity: "hidden",
        messageIDs: entries.map((entry) => entry.id),
        tokenEstimate: 4000,
      }),
    ],
    entries,
  );

  const transformed = transformMessagesForContext(
    [
      messageLike("auto", "auto full text"),
      messageLike("summary", "summary full text"),
      messageLike("full", "full text"),
      messageLike("hidden_message", "hidden full text"),
    ],
    contextMap,
  );
  const preview = computeContextPreview(contextMap);

  assert.deepEqual(
    transformed.map((item) => item.info.id),
    ["summary", "full"],
  );
  assert.equal(
    transformed[0]?.parts[0]?.text,
    "[Message summary] locked summary",
  );
  assert.equal(transformed[1]?.parts[0]?.text, "full text");
  assert.equal(preview.topics[0]?.effectiveTokens, 1060);
  assert.equal(preview.topics[0]?.effectiveLabel, "2 overrides");
});
