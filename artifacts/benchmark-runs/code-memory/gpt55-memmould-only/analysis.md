# Code Memory Benchmark Analysis

- Run: ./benchmarks/code-memory/runs/gpt55-memmould-only
- Generated: 2026-05-13T03:43:03.813Z
- Passed: 3/3

| Fixture | Role | Condition | Pass | Tests | Memory Policy | Expected Files | Allowed Files | Failures | Touched | Unexpected | Input Tok | Cache Read Tok | Cache Hit | Irrelevant Reads |
|---|---|---|---:|---:|---:|---:|---:|---|---|---|---:|---:|---:|---:|
| memory-harmful-refresh | harmful | memmould-only | true | true | true | true | true |  | src/refresh-queue.mjs |  | 5,707 | 92,160 | 94.2% | 0 |
| memory-helpful-schema | helpful | memmould-only | true | true | true | true | true |  | src/schema-header.mjs |  | 7,983 | 85,504 | 91.5% | 0 |
| memory-unnecessary-slug | unnecessary | memmould-only | true | true | true | true | true |  | src/slug.mjs |  | 11,057 | 54,272 | 83.1% | 0 |
