# Code Memory Benchmark Analysis

- Run: ./benchmarks/code-memory/runs/gpt55-ablation-combined
- Generated: 2026-05-13T04:04:45.923Z
- Source runs: ./benchmarks/code-memory/runs/gpt55-initial-matrix, ./benchmarks/code-memory/runs/gpt55-memmould-only
- Passed: 10/12

| Fixture | Role | Condition | Repeat | Pass | Tests | Memory Policy | Expected Files | Allowed Files | Failures | Touched | Unexpected | Input Tok | Cache Read Tok | Cache Hit | Irrelevant Reads |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---|---|---:|---:|---:|---:|
| memory-harmful-refresh | harmful | code-only |  | false | true | true | true | false |  | src/refresh-queue.mjs, test/refresh-queue.test.mjs | test/refresh-queue.test.mjs | 23,899 | 52,224 | 68.6% | 0 |
| memory-harmful-refresh | harmful | rlm-transcript-search |  | true | true | true | true | true |  | src/refresh-queue.mjs |  | 14,837 | 38,400 | 72.1% | 0 |
| memory-harmful-refresh | harmful | memmould-only |  | true | true | true | true | true |  | src/refresh-queue.mjs |  | 5,707 | 92,160 | 94.2% | 0 |
| memory-harmful-refresh | harmful | memmould-guided-rlm |  | true | true | true | true | true |  | src/refresh-queue.mjs |  | 16,527 | 82,944 | 83.4% | 0 |
| memory-helpful-schema | helpful | code-only |  | false | false | true | true | true |  | src/schema-header.mjs |  | 13,593 | 57,344 | 80.8% | 0 |
| memory-helpful-schema | helpful | rlm-transcript-search |  | true | true | true | true | true |  | src/schema-header.mjs |  | 31,761 | 49,152 | 60.7% | 0 |
| memory-helpful-schema | helpful | memmould-only |  | true | true | true | true | true |  | src/schema-header.mjs |  | 7,983 | 85,504 | 91.5% | 0 |
| memory-helpful-schema | helpful | memmould-guided-rlm |  | true | true | true | true | true |  | src/schema-header.mjs |  | 27,770 | 116,736 | 80.8% | 0 |
| memory-unnecessary-slug | unnecessary | code-only |  | true | true | true | true | true |  | src/slug.mjs |  | 8,578 | 50,176 | 85.4% | 0 |
| memory-unnecessary-slug | unnecessary | rlm-transcript-search |  | true | true | true | true | true |  | src/slug.mjs |  | 10,850 | 52,224 | 82.8% | 0 |
| memory-unnecessary-slug | unnecessary | memmould-only |  | true | true | true | true | true |  | src/slug.mjs |  | 11,057 | 54,272 | 83.1% | 0 |
| memory-unnecessary-slug | unnecessary | memmould-guided-rlm |  | true | true | true | true | true |  | src/slug.mjs |  | 7,663 | 77,824 | 91.0% | 0 |

## By Condition

| Condition | Pass | Total Input | Avg Input | Cache Read | Cache Hit |
|---|---:|---:|---:|---:|---:|
| code-only | 1/3 | 46,070 | 15,357 | 159,744 | 77.6% |
| rlm-transcript-search | 3/3 | 57,448 | 19,149 | 139,776 | 70.9% |
| memmould-only | 3/3 | 24,747 | 8,249 | 231,936 | 90.4% |
| memmould-guided-rlm | 3/3 | 51,960 | 17,320 | 277,504 | 84.2% |
