import assert from "node:assert/strict";
import test from "node:test";

import {
  findGitAiLineAttributions,
  gitAiPromptDecantKey,
  gitAiPromptTranscriptHash,
  parseGitAiAuthorshipLog,
} from "../src/git-ai";

test("parseGitAiAuthorshipLog maps file line ranges to prompt metadata", () => {
  const log = parseGitAiAuthorshipLog(`src/main.ts
  abcd1234abcd1234 1-4,9,11-12
"src/file with spaces.ts"
  e5be5f8723e02b52 2
---
{
  "schema_version": "authorship/3.0.0",
  "git_ai_version": "1.4.8",
  "base_commit_sha": "7734793b756b3921c88db5375a8c156e9532447b",
  "prompts": {
    "abcd1234abcd1234": {
      "agent_id": {
        "tool": "cursor",
        "id": "conversation-1",
        "model": "claude-4.5-opus"
      },
      "human_author": "Developer <dev@example.com>",
      "messages": [
        { "type": "user", "text": "Add error handling" }
      ],
      "total_additions": 7,
      "total_deletions": 1,
      "accepted_lines": 6,
      "overriden_lines": 0
    },
    "e5be5f8723e02b52": {
      "agent_id": {
        "tool": "opencode",
        "id": "session-2",
        "model": "gpt-5.5"
      },
      "messages_url": "https://prompt-store.example/e5be5f8723e02b52",
      "messages": []
    }
  }
}
`);

  assert.equal(log.metadata.schema_version, "authorship/3.0.0");
  assert.equal(log.entries.length, 2);

  const [attribution] = findGitAiLineAttributions({
    log,
    file: "./src/main.ts",
    line: 11,
  });
  assert.equal(attribution?.prompt_id, "abcd1234abcd1234");
  assert.equal(attribution?.line_spec, "1-4,9,11-12");
  assert.equal(attribution?.prompt?.agent_id?.tool, "cursor");
  assert.equal(attribution?.prompt?.agent_id?.model, "claude-4.5-opus");
  assert.equal(attribution?.prompt?.messages?.length, 1);

  const [quotedPathAttribution] = findGitAiLineAttributions({
    log,
    file: "src/file with spaces.ts",
    line: 2,
  });
  assert.equal(quotedPathAttribution?.prompt_id, "e5be5f8723e02b52");
  assert.equal(
    quotedPathAttribution?.prompt?.messages_url,
    "https://prompt-store.example/e5be5f8723e02b52",
  );
});

test("findGitAiLineAttributions returns no result outside mapped ranges", () => {
  const log = parseGitAiAuthorshipLog(`src/main.ts
  abcd1234abcd1234 1-2
---
{ "prompts": {} }
`);

  assert.deepEqual(
    findGitAiLineAttributions({ log, file: "src/main.ts", line: 3 }),
    [],
  );
});

test("parseGitAiAuthorshipLog rejects malformed notes", () => {
  assert.throws(
    () => parseGitAiAuthorshipLog("src/main.ts\n  abcd1234abcd1234 1"),
    /missing metadata separator/,
  );
});

test("gitAiPromptTranscriptHash is stable for object key ordering", () => {
  const first = gitAiPromptTranscriptHash({
    agent_id: { tool: "cursor", model: "claude" },
    messages: [{ type: "user", text: "Fix the cache" }],
  });
  const second = gitAiPromptTranscriptHash({
    messages: [{ text: "Fix the cache", type: "user" }],
    agent_id: { model: "claude", tool: "cursor" },
  });

  assert.equal(first, second);
  assert.equal(
    gitAiPromptDecantKey({
      promptID: "abcd1234abcd1234",
      transcriptHash: first,
    }),
    `abcd1234abcd1234:${first}`,
  );
});
