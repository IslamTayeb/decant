# Code Recall Benchmark Analysis

- Run: ./benchmarks/code-recall/runs/gpt55-default-compaction-blog-20260530
- Generated: 2026-05-31T02:20:05.614Z
- Passed: 6/9

| Fixture | Role | Condition | Repeat | Pass | Tests | Recall Policy | Expected Files | Allowed Files | Failures | Touched | Unexpected | Input Tok | Prep Input Tok | Solve Input Tok | Cache Read Tok | Output + Reasoning Tok | Cache Hit | Est. Cost | Irrelevant Reads |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| recall-correction-retry-cap | correction | default-compaction |  | true | true | true | true | true |  | src/retry-delay.mjs |  | 5,006 | 1,027 | 3,979 | 37,888 | 1,248 | 88.3% | $0.08 | 0 |
| recall-correction-retry-cap | correction | rlm-transcript-search |  | true | true | true | true | true |  | src/retry-delay.mjs |  | 15,095 | 0 | 15,095 | 45,056 | 833 | 74.9% | $0.12 | 0 |
| recall-correction-retry-cap | correction | decant-only |  | true | true | true | true | true |  | src/retry-delay.mjs |  | 18,252 | 0 | 18,252 | 65,024 | 1,199 | 78.1% | $0.16 | 0 |
| recall-missing-pagination | missing | default-compaction |  | true | true | true | true | true |  | src/pagination.mjs |  | 4,335 | 861 | 3,474 | 37,376 | 1,085 | 89.6% | $0.07 | 0 |
| recall-missing-pagination | missing | rlm-transcript-search |  | true | true | true | true | true |  | src/pagination.mjs |  | 16,544 | 0 | 16,544 | 23,552 | 749 | 58.7% | $0.12 | 0 |
| recall-missing-pagination | missing | decant-only |  | true | true | true | true | true |  | src/pagination.mjs |  | 9,942 | 0 | 9,942 | 31,232 | 791 | 75.9% | $0.09 | 0 |
| recall-synthesis-report | synthesis | default-compaction |  | false | false | true | true | true |  | src/report.mjs |  | 5,972 | 1,016 | 4,956 | 37,888 | 1,693 | 86.4% | $0.10 | 0 |
| recall-synthesis-report | synthesis | rlm-transcript-search |  | false | false | true | true | true |  | src/report.mjs |  | 18,827 | 0 | 18,827 | 34,304 | 1,035 | 64.6% | $0.14 | 0 |
| recall-synthesis-report | synthesis | decant-only |  | false | false | true | true | true |  | src/report.mjs |  | 14,400 | 0 | 14,400 | 53,760 | 1,128 | 78.9% | $0.13 | 0 |

## By Condition

| Condition | Pass | Total Input | Avg Input | Prep Input | Solve Input | Cache Read | Output + Reasoning | Cache Hit | Est. Cost |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| default-compaction | 2/3 | 15,313 | 5,104 | 2,904 | 12,409 | 113,152 | 4,026 | 88.1% | $0.25 |
| rlm-transcript-search | 2/3 | 50,466 | 16,822 | 0 | 50,466 | 102,912 | 2,617 | 67.1% | $0.38 |
| decant-only | 2/3 | 42,594 | 14,198 | 0 | 42,594 | 150,016 | 3,118 | 77.9% | $0.38 |
