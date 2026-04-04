import assert from "node:assert/strict";
import test from "node:test";

import {
  applyAnnotationEnvelope,
  applyAssistantAnnotation,
  buildFallbackMapFromMessages,
  capturePendingRetroactiveMessage,
  parseAnnotationBlock,
  transformMessagesForContext,
  updateBlobFidelity,
} from "../src/context-map/core";
import { createEmptyContextMap } from "../src/context-map/storage";
import type { MessageLike } from "../src/context-map/types";

function message(
  id: string,
  role: "user" | "assistant",
  text: string,
  createdAt: number,
): MessageLike {
  return {
    info: {
      id,
      role,
      metadata: {
        time: {
          created: createdAt,
        },
      },
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

function toolOnlyMessage(
  id: string,
  tool: string,
  createdAt: number,
): MessageLike {
  return {
    info: {
      id,
      role: "assistant",
      metadata: {
        time: {
          created: createdAt,
        },
      },
    },
    parts: [
      {
        id: `${id}-tool`,
        type: "tool",
        callID: `${id}-call`,
        messageID: id,
        tool,
        state: {
          status: "completed",
          title: `Ran ${tool}`,
          output: "ok",
        },
      },
    ],
  };
}

test("parseAnnotationBlock extracts annotation and strips visible text", () => {
  const parsed = parseAnnotationBlock(
    `Visible answer\n<annotation>{"blob":"auth_debugging","is_new_blob":false,"message_summary":"Found the race.","blob_summary":"Investigated auth race condition.","placeholder":"Auth race condition investigation","key_facts":["line 42"]}</annotation>`,
  );

  assert.equal(parsed.cleanText, "Visible answer");
  assert.equal(parsed.annotation?.current.blob, "auth_debugging");
  assert.deepEqual(parsed.annotation?.current.key_facts, ["line 42"]);
  assert.deepEqual(parsed.annotation?.retroactive, []);
});

test("parseAnnotationBlock supports current plus retroactive annotation envelope", () => {
  const parsed = parseAnnotationBlock(
    `Visible answer\n<annotation>{"current":{"blob":"docs_update","is_new_blob":false,"message_summary":"Updated docs.","blob_summary":"Updated onboarding docs.","placeholder":"Docs update","key_facts":["quickstart docs"]},"retroactive":[{"message_id":"msg-tool","blob":"auth_debugging","message_summary":"Ran auth concurrency tests.","key_facts":["mutex failed tests"]}]}</annotation>`,
  );

  assert.equal(parsed.annotation?.current.blob, "docs_update");
  assert.equal(parsed.annotation?.retroactive[0]?.message_id, "msg-tool");
  assert.deepEqual(parsed.annotation?.retroactive[0]?.key_facts, [
    "mutex failed tests",
  ]);
});

test("applyAssistantAnnotation assigns pending user and assistant messages to the annotated blob", () => {
  const user = message(
    "msg-user",
    "user",
    "Why is line 42 using an async queue?",
    1,
  );
  const assistant = message(
    "msg-assistant",
    "assistant",
    "It was changed after the mutex failed.",
    2,
  );
  const map = createEmptyContextMap({ sessionID: "ses-test" });

  const next = applyAssistantAnnotation({
    map,
    messages: [user, assistant],
    assistantMessageID: "msg-assistant",
    annotation: {
      blob: "auth_debugging",
      is_new_blob: true,
      message_summary:
        "Explained that the mutex approach failed tests and the code switched to an async queue.",
      blob_summary:
        "Investigated auth debugging and captured the failed mutex attempt before switching to an async queue.",
      placeholder: "Debugging auth race condition",
      key_facts: ["mutex failed tests", "async queue on line 42"],
    },
  });

  assert.equal(next.blobOrder.length, 1);
  assert.equal(next.messages["msg-user"]?.blobID, "auth_debugging");
  assert.equal(next.messages["msg-assistant"]?.blobID, "auth_debugging");
  assert.equal(next.messages["msg-assistant"]?.source, "annotation");
  assert.deepEqual(next.blobs.auth_debugging?.keyFacts, [
    "mutex failed tests",
    "async queue on line 42",
  ]);
});

test("updateBlobFidelity refuses agent overrides of user-controlled blobs without force", () => {
  const map = createEmptyContextMap({ sessionID: "ses-test" });
  map.blobs.auth_debugging = {
    id: "auth_debugging",
    label: "auth_debugging",
    summary: "Summary",
    placeholder: "Placeholder",
    keyFacts: [],
    fidelity: "compressed",
    fidelitySource: "user",
    messageIDs: [],
    tokenEstimate: 10,
    createdAt: 1,
    lastActiveAt: 1,
    commitHashes: [],
  };
  map.blobOrder.push("auth_debugging");

  const denied = updateBlobFidelity({
    map,
    blobID: "auth_debugging",
    fidelity: "drop",
    source: "agent",
  });

  assert.equal(denied.ok, false);
  assert.equal(map.blobs.auth_debugging?.fidelity, "compressed");

  const forced = updateBlobFidelity({
    map,
    blobID: "auth_debugging",
    fidelity: "drop",
    source: "agent",
    force: true,
  });

  assert.equal(forced.ok, true);
  assert.equal(map.blobs.auth_debugging?.fidelity, "drop");
});

test("transformMessagesForContext compresses a blob to one synthetic summary message", () => {
  const user = message(
    "msg-user",
    "user",
    "Why is line 42 using an async queue?",
    1,
  );
  const assistant = message(
    "msg-assistant",
    "assistant",
    "It was changed after the mutex failed.",
    2,
  );
  const map = createEmptyContextMap({ sessionID: "ses-test" });
  map.blobs.auth_debugging = {
    id: "auth_debugging",
    label: "auth_debugging",
    summary:
      "Investigated the auth race and switched from a mutex to an async queue.",
    placeholder: "Auth race condition investigation",
    keyFacts: ["line 42", "mutex failed tests"],
    fidelity: "compressed",
    fidelitySource: "user",
    messageIDs: ["msg-user", "msg-assistant"],
    tokenEstimate: 20,
    createdAt: 1,
    lastActiveAt: 2,
    commitHashes: [],
  };
  map.blobOrder.push("auth_debugging");
  map.messages["msg-user"] = {
    id: "msg-user",
    role: "user",
    blobID: "auth_debugging",
    summary: "Asked why line 42 uses an async queue.",
    keyFacts: [],
    hidden: false,
    hiddenSource: "default",
    fidelityOverride: "inherit",
    fidelitySource: "default",
    tokenEstimate: 5,
    createdAt: 1,
    updatedAt: 1,
    source: "derived",
    partTypes: ["text"],
    toolNames: [],
  };
  map.messages["msg-assistant"] = {
    id: "msg-assistant",
    role: "assistant",
    blobID: "auth_debugging",
    summary: "Explained the async queue change.",
    keyFacts: ["mutex failed tests"],
    hidden: false,
    hiddenSource: "default",
    fidelityOverride: "inherit",
    fidelitySource: "default",
    tokenEstimate: 15,
    createdAt: 2,
    updatedAt: 2,
    source: "annotation",
    partTypes: ["text"],
    toolNames: [],
  };

  const transformed = transformMessagesForContext([user, assistant], map);

  assert.equal(transformed.length, 1);
  assert.match(
    (transformed[0]?.parts[0] as { text?: string })?.text ?? "",
    /Blob summary: auth_debugging/,
  );
});

test("buildFallbackMapFromMessages creates reusable blobs for repeated topics", () => {
  const map = buildFallbackMapFromMessages({
    sessionID: "ses-test",
    messages: [
      message("u1", "user", "Investigate auth race condition in line 42", 1),
      message(
        "a1",
        "assistant",
        "The auth queue replaced the mutex after failures.",
        2,
      ),
      message("u2", "user", "Outline onboarding docs for API contributors", 3),
      message(
        "a2",
        "assistant",
        "Create quickstart, contribution, and API overview docs.",
        4,
      ),
      message(
        "u3",
        "user",
        "Investigate auth race condition again and mention the queue",
        5,
      ),
      message(
        "a3",
        "assistant",
        "The queue stayed because the mutex failed tests.",
        6,
      ),
    ],
  });

  assert.equal(map.blobOrder.length, 2);
  assert.equal(map.blobs[map.blobOrder[0]!]!.messageIDs.length, 4);
  assert.equal(map.blobs[map.blobOrder[1]!]!.messageIDs.length, 2);
});

test("retroactive annotation captures tool-only messages and clears pending state", () => {
  const user = message(
    "msg-user",
    "user",
    "Investigate the auth race condition on line 42",
    1,
  );
  const tool = toolOnlyMessage("msg-tool", "bash", 2);
  const assistant = message(
    "msg-assistant",
    "assistant",
    "The mutex failed tests, so the async queue stayed.",
    3,
  );
  const map = createEmptyContextMap({ sessionID: "ses-test" });

  capturePendingRetroactiveMessage({
    map,
    messages: [user, tool, assistant],
    messageID: "msg-tool",
    suggestedBlobID: "auth_debugging",
  });

  assert.equal(
    map.pendingRetroactive["msg-tool"]?.suggestedBlobID,
    "auth_debugging",
  );

  const next = applyAnnotationEnvelope({
    map,
    messages: [user, tool, assistant],
    assistantMessageID: "msg-assistant",
    annotation: {
      current: {
        blob: "auth_debugging",
        is_new_blob: false,
        message_summary:
          "Explained that the mutex failed tests and the async queue remained the fix.",
        blob_summary:
          "Investigated the auth race and kept the async queue after the mutex failed tests.",
        placeholder: "Auth race condition investigation",
        key_facts: ["mutex failed tests", "async queue final fix"],
      },
      retroactive: [
        {
          message_id: "msg-tool",
          blob: "auth_debugging",
          message_summary:
            "Ran the auth concurrency reproduction and confirmed the mutex failed tests.",
          key_facts: ["mutex failed tests"],
        },
      ],
    },
  });

  assert.equal(next.messages["msg-tool"]?.blobID, "auth_debugging");
  assert.equal(next.messages["msg-tool"]?.source, "annotation");
  assert.equal(next.pendingRetroactive["msg-tool"], undefined);
});
