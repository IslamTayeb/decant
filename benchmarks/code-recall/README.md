# Code Recall Benchmark

This benchmark tests whether prior session context helps, hurts, or should be ignored during a coding task. It is intentionally separate from provenance QA: the primary output is a patch plus passing tests.

## Run

```sh
export DECANT_E2E_MODEL="<provider>/<model>"
bun run benchmark:code-recall -- --prepare-only
bun run benchmark:code-recall
bun run benchmark:code-recall -- --model "<provider>/<model>" --prepare-only
```

Useful options:

```sh
bun run benchmark:code-recall -- --fixtures recall-helpful-schema
bun run benchmark:code-recall -- --conditions default-compaction,rlm-transcript-search,decant-only,decant-guided-rlm
bun run benchmark:code-recall -- --combine-runs benchmarks/code-recall/runs/run-a,benchmarks/code-recall/runs/run-b --out benchmarks/code-recall/runs/combined
bun run benchmark:code-recall -- --model "<provider>/<model>" --fixtures recall-helpful-schema --conditions code-only --repeats 1
bun run benchmark:code-recall -- --repeats 3 --out benchmarks/code-recall/runs/repeats
bun run benchmark:code-recall -- --distractor-scale 3 --fixtures recall-helpful-schema --conditions default-compaction,rgb-editable-context,decant-only
bun run benchmark:code-recall -- --prompt-timeout-minutes 12
bun run benchmark:code-recall -- --fixtures recall-unnecessary-slug --conditions code-only --workers 4
bun run benchmark:code-recall -- --analyze-run benchmarks/code-recall/runs/<run>
bun run benchmark:code-recall -- --out benchmarks/code-recall/runs/manual
```

## Conditions

- `code-only`: no prior context corpus and no decant plugin; solve from the repository and tests.
- `default-compaction`: old session logs are pasted into a normal OpenCode session, unrelated later turns push them out of the recent tail, normal OpenCode compaction is forced, then the solve turn relies only on the compacted session context.
- `rlm-transcript-search`: prior sessions are transcript files under `recall/transcripts/`; the agent may use grep/read/bash as an RLM-style recall baseline.
- `rgb-editable-context`: prior sessions are transcript files first. The agent uses read/grep/bash over that raw context, writes `recall/rgb-context.md`, then a fresh solve turn receives only that rewritten file as prior memory.
- `decant-only`: prior sessions are seeded as real OpenCode sessions with decant enabled; no transcript corpus is available.
- `decant-guided-rlm`: prior sessions are seeded as real OpenCode sessions with decant enabled, and a transcript corpus with real session/message IDs is also available.

Note: the `rlm-*` names here mean transcript-file search inspired by RLM-style externalized context. The `rgb-editable-context` condition is closer to the RGB-agent pattern: file-based memory, read/grep/bash over raw logs, and a rewritten context file fed to the next turn. Neither condition implements recursive LM calls.

## Fixtures

- `recall-unnecessary-slug`: current repo/tests fully specify the slug fix; prior context is distractor context and should be ignored.
- `recall-helpful-schema`: visible tests cover a simple parser case, while hidden tests require a prior accepted quote-handling decision.
- `recall-harmful-refresh`: old sessions contain stale/global-mutex queue guidance, while the current task requires per-tenant refresh coalescing.
- `recall-missing-pagination`: prior sessions are related distractors; the agent should not invent provenance.
- `recall-correction-retry-cap`: stale retry-delay context is superseded by a later accepted correction.
- `recall-synthesis-report`: hidden behavior requires preserving a parent synthesis of child-agent findings.

## Scoring

Each run records:

- public and hidden `node --test` results.
- patch bytes, expected touched files, and unexpected file edits.
- forbidden stale terms in patch/output.
- transcript reads, irrelevant reads, context-tool calls, token/cache metrics, and estimated normalized cost.
- memory-prep token/cost split from solve token/cost. For `default-compaction`, memory prep is the compaction summary call; for RGB conditions, memory prep is the context rewrite turn.
- RGB context presence, preserved session/message IDs, and whether the solve turn avoided raw transcript reads.
- recall policy: unnecessary prior context should be avoided, helpful context should cite the relevant session/message, and harmful context should not be cited or copied.

Fair claim if this benchmark separates conditions:

> decant can act as a routing/provenance layer for coding-agent recall, helping decide when prior sessions are useful, irrelevant, or stale.

Avoid claiming:

> decant generally improves coding-agent solve rate.
