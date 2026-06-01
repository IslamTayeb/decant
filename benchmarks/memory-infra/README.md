# Memory Infra Benchmark

This benchmark is for Decant's infrastructure claim, not general solve rate.
It creates one long historical memory session with many real topics and explicit
distractors, then asks several future questions in fresh sessions.
It can also mix in current-work questions that should not use historical memory.
Set `--query-count 0` for current-only continuation probes.

Conditions:

- `default-compaction`: future queries receive only the generated compaction
  summary.
- `default-opencode-continuation`: the historical session is compacted with
  vanilla OpenCode and future queries continue in that same session, without a
  pasted summary artifact.
- `rgb-context`: future queries receive one RGB-style maintained memory context
  produced before the future questions are known.
- `decant-map`: future queries receive no carried memory text and must route
  through Decant session/topic/message tools.
- `decant-direct`: future recall queries use one `session_lookup` call with
  included detail; current-work queries should not call context tools.
- `decant-archive-continuation`: the historical session is compacted with
  Decant enabled, future queries continue in that same session, and recall
  queries must route through the compacted archive exposed by `view_context`.

The main metrics split memory maintenance from later query cost:

- prep input/cost
- query input/cost
- carried context characters per query
- average and max query input
- route/tool policy
- unnecessary context-tool calls on current-work queries
- exact-fact recall pass rate
- current-work pass rate

Example:

```sh
DECANT_E2E_MODEL=openai/gpt-5.5-fast \
npm run benchmark:memory-infra -- \
  --conditions default-compaction,rgb-context,decant-map \
  --topic-count 12 \
  --query-count 4 \
  --current-query-count 4 \
  --decoys-per-topic 1 \
  --irregular-facts \
  --out benchmarks/memory-infra/runs/gpt55fast-pilot
```
