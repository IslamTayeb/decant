# Code Memory Benchmark Analysis

- Run: ./benchmarks/code-memory/runs/gpt55-initial-matrix
- Generated: 2026-05-13T03:28:54.983Z
- Passed: 7/9

| Fixture | Role | Condition | Pass | Tests | Memory Policy | Expected Files | Allowed Files | Failures | Touched | Unexpected | Input Tok | Cache Read Tok | Cache Hit | Irrelevant Reads |
|---|---|---|---:|---:|---:|---:|---:|---|---|---|---:|---:|---:|---:|
| memory-harmful-refresh | harmful | code-only | false | true | true | true | false |  | src/refresh-queue.mjs, test/refresh-queue.test.mjs | test/refresh-queue.test.mjs | 23,899 | 52,224 | 68.6% | 0 |
| memory-harmful-refresh | harmful | memmould-guided-rlm | true | true | true | true | true |  | src/refresh-queue.mjs |  | 16,527 | 82,944 | 83.4% | 0 |
| memory-harmful-refresh | harmful | rlm-transcript-search | true | true | true | true | true |  | src/refresh-queue.mjs |  | 14,837 | 38,400 | 72.1% | 0 |
| memory-helpful-schema | helpful | code-only | false | false | true | true | true |  | src/schema-header.mjs |  | 13,593 | 57,344 | 80.8% | 0 |
| memory-helpful-schema | helpful | memmould-guided-rlm | true | true | true | true | true |  | src/schema-header.mjs |  | 27,770 | 116,736 | 80.8% | 0 |
| memory-helpful-schema | helpful | rlm-transcript-search | true | true | true | true | true |  | src/schema-header.mjs |  | 31,761 | 49,152 | 60.7% | 0 |
| memory-unnecessary-slug | unnecessary | code-only | true | true | true | true | true |  | src/slug.mjs |  | 8,578 | 50,176 | 85.4% | 0 |
| memory-unnecessary-slug | unnecessary | memmould-guided-rlm | true | true | true | true | true |  | src/slug.mjs |  | 7,663 | 77,824 | 91.0% | 0 |
| memory-unnecessary-slug | unnecessary | rlm-transcript-search | true | true | true | true | true |  | src/slug.mjs |  | 10,850 | 52,224 | 82.8% | 0 |
