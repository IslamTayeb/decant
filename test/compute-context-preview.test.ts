import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFallbackMapFromMessages,
  buildContextMapToolView,
  buildSessionZoomText,
  buildTopicMessageSummaries,
  computeContextPreview,
  matchTopicIDsForQuery,
  mergeContextMaps,
  resetMapAfterCompaction,
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
    source: input.source ?? "derived",
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

function map(topics: TopicEntry[], messages: MessageEntry[]): ContextMapFile {
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

function messageLike(
  id: string,
  text: string,
  role: MessageLike["info"]["role"] = "assistant",
): MessageLike {
  return {
    info: {
      id,
      role,
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

test("context tool view exposes every topic fidelity level", () => {
  const contextMap = map([], []);
  const view = buildContextMapToolView(contextMap);

  assert.deepEqual(view.controls.fidelity_levels, [
    "full",
    "summary",
    "compressed",
    "placeholder",
    "hidden",
  ]);
});

test("compaction reset can keep historical summaries as placeholders", () => {
  const contextMap = map(
    [topic({ id: "auth", messageIDs: ["m1"] })],
    [message({ id: "m1", topicID: "auth" })],
  );

  const reset = resetMapAfterCompaction({
    map: contextMap,
    summaryText: "Long stale auth and docs context.",
    summaryMessageID: "summary",
    summaryFidelity: "placeholder",
  });

  assert.equal(reset.topics.session_summary?.fidelity, "placeholder");
  assert.equal(
    reset.topics.session_summary?.placeholder,
    "Historical context compacted",
  );
});

test("map merge reconciles topic message IDs after preserving annotations", () => {
  const existing = map(
    [topic({ id: "auth", messageIDs: ["m1"] })],
    [message({ id: "m1", topicID: "auth", source: "annotation" })],
  );
  const fresh = map(
    [topic({ id: "broad", messageIDs: ["m1", "m2"] })],
    [
      message({ id: "m1", topicID: "broad" }),
      message({ id: "m2", topicID: "broad" }),
    ],
  );

  const merged = mergeContextMaps(existing, fresh);

  assert.equal(merged.messages.m1?.topicID, "auth");
  assert.equal(merged.messages.m2?.topicID, "broad");
  assert.deepEqual(merged.topics.auth?.messageIDs, ["m1"]);
  assert.deepEqual(merged.topics.broad?.messageIDs, ["m2"]);
  const broad = buildTopicMessageSummaries({ map: merged, topicID: "broad" });
  assert.equal(broad.ok, true);
  assert.deepEqual(broad.ok ? broad.messages.map((item) => item.id) : [], [
    "m2",
  ]);
});

test("map merge preserves existing derived topic assignments", () => {
  const existing = map(
    [topic({ id: "auth", messageIDs: ["m1"] })],
    [message({ id: "m1", topicID: "auth" })],
  );
  const fresh = map(
    [topic({ id: "docs", messageIDs: ["m1"] })],
    [message({ id: "m1", topicID: "docs" })],
  );

  const merged = mergeContextMaps(existing, fresh);

  assert.equal(merged.messages.m1?.topicID, "auth");
  assert.deepEqual(merged.topics.auth?.messageIDs, ["m1"]);
  assert.deepEqual(merged.topics.docs?.messageIDs, []);
});

test("map merge preserves annotation cursor when fallback has none", () => {
  const existing = map(
    [topic({ id: "auth", messageIDs: ["m1"] })],
    [message({ id: "m1", topicID: "auth" })],
  );
  existing.lastAnnotatedMessageID = "m1";
  const fresh = map(
    [topic({ id: "auth", messageIDs: ["m1", "m2"] })],
    [
      message({ id: "m1", topicID: "auth" }),
      message({ id: "m2", topicID: "auth" }),
    ],
  );

  const merged = mergeContextMaps(existing, fresh);

  assert.equal(merged.lastAnnotatedMessageID, "m1");
});

test("fallback map keeps user continuations in the current topic", () => {
  const contextMap = buildFallbackMapFromMessages({
    sessionID: "ses_test",
    messages: [
      messageLike(
        "auth_user_1",
        "We are investigating an auth rate limiter race in src/auth/rate_limiter.ts.",
        "user",
      ),
      messageLike("auth_assistant_1", "Explained the auth rate limiter race."),
      messageLike(
        "docs_user_1",
        "Switch topics. Draft onboarding docs with feature-flag documentation.",
        "user",
      ),
      messageLike("docs_assistant_1", "Outlined onboarding docs."),
      messageLike(
        "auth_user_2",
        "Switch back to auth. The accepted design is a per-tenant async queue helper.",
        "user",
      ),
      messageLike("auth_assistant_2", "Preserved the auth queue design."),
      messageLike(
        "auth_user_3",
        "The rollback flag for the auth queue rollout is FLAG_AUTH_QUEUE_ROLLBACK.",
        "user",
      ),
    ],
  });

  assert.equal(
    contextMap.messages.auth_user_3?.topicID,
    contextMap.messages.auth_user_2?.topicID,
  );
  assert.notEqual(
    contextMap.messages.auth_user_3?.topicID,
    contextMap.messages.docs_user_1?.topicID,
  );
});

test("full session zoom omits duplicate summaries when text is available", () => {
  const contextMap = map(
    [topic({ id: "topic", messageIDs: ["m1"] })],
    [
      message({
        id: "m1",
        topicID: "topic",
        summary: "duplicate summary",
      }),
    ],
  );

  const text = buildSessionZoomText({
    map: contextMap,
    topicID: "topic",
    fidelity: "full",
    messages: [messageLike("m1", "original text", "user")],
  });

  assert.match(text, /Role: user/);
  assert.match(text, /Text:\noriginal text/);
  assert.doesNotMatch(text, /duplicate summary/);
});

test("topic lookup keeps numeric round discriminators", () => {
  const contextMap = map(
    [
      topic({
        id: "session_rotation_2",
        summary: "Topic: session rotation round 2.",
        placeholder: "session rotation round 2",
      }),
      topic({
        id: "session_rotation_3",
        summary: "Topic: session rotation round 3.",
        placeholder: "session rotation round 3",
      }),
      topic({
        id: "session_rotation_4",
        summary: "Topic: session rotation round 4.",
        placeholder: "session rotation round 4",
      }),
    ],
    [],
  );

  assert.equal(
    matchTopicIDsForQuery(
      contextMap,
      "maintained decision for session rotation round 3",
    )[0],
    "session_rotation_3",
  );
});

test("topic lookup ranks maintained decisions ahead of decoys", () => {
  const contextMap = map(
    [
      topic({
        id: "checkout_real",
        summary:
          "Topic: checkout idempotency. Accepted design: per-cart idempotency key store. Rejected design: global checkout mutex.",
        placeholder: "checkout idempotency maintained decision",
      }),
      topic({
        id: "checkout_decoy",
        summary:
          "Explicit DISTRACTOR for checkout idempotency. Wrong flag and wrong design. If asked for the maintained decision, ignore this distractor.",
        placeholder: "checkout idempotency distractor",
      }),
    ],
    [],
  );

  assert.equal(
    matchTopicIDsForQuery(
      contextMap,
      "maintained decision for checkout idempotency",
    )[0],
    "checkout_real",
  );
});
