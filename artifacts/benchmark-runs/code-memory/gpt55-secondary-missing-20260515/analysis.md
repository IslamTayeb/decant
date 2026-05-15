# Code Memory Benchmark Analysis

- Run: ./benchmarks/code-memory/runs/gpt55-secondary-missing-20260515
- Generated: 2026-05-15T02:05:04.340Z
- Passed: 7/12

| Fixture | Role | Condition | Repeat | Pass | Tests | Memory Policy | Expected Files | Allowed Files | Failures | Touched | Unexpected | Input Tok | Cache Read Tok | Cache Hit | Irrelevant Reads |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---|---|---:|---:|---:|---:|
| memory-correction-retry-cap | correction | code-only |  | false | false | true | true | true |  | src/retry-delay.mjs |  | 16,572 | 71,680 | 81.2% | 0 |
| memory-correction-retry-cap | correction | rlm-transcript-search |  | true | true | true | true | true |  | src/retry-delay.mjs |  | 24,127 | 48,640 | 66.8% | 0 |
| memory-correction-retry-cap | correction | memmould-only |  | true | true | true | true | true |  | src/retry-delay.mjs |  | 8,069 | 76,288 | 90.4% | 0 |
| memory-correction-retry-cap | correction | memmould-guided-rlm |  | true | true | true | true | true |  | src/retry-delay.mjs |  | 16,659 | 59,904 | 78.2% | 0 |
| memory-missing-pagination | missing | code-only |  | true | true | true | true | true |  | src/pagination.mjs |  | 22,599 | 39,424 | 63.6% | 0 |
| memory-missing-pagination | missing | rlm-transcript-search |  | true | true | true | true | true |  | src/pagination.mjs |  | 22,435 | 30,208 | 57.4% | 0 |
| memory-missing-pagination | missing | memmould-only |  | true | true | true | true | true |  | src/pagination.mjs |  | 24,062 | 41,472 | 63.3% | 0 |
| memory-missing-pagination | missing | memmould-guided-rlm |  | true | true | true | true | true |  | src/pagination.mjs |  | 13,788 | 53,248 | 79.4% | 0 |
| memory-synthesis-report | synthesis | code-only |  | false | false | true | true | true |  | src/report.mjs |  | 16,674 | 41,472 | 71.3% | 0 |
| memory-synthesis-report | synthesis | rlm-transcript-search |  | false | false | true | true | true |  | src/report.mjs |  | 14,764 | 57,856 | 79.7% | 0 |
| memory-synthesis-report | synthesis | memmould-only |  | false | false | true | true | true |  | src/report.mjs |  | 32,110 | 80,896 | 71.6% | 0 |
| memory-synthesis-report | synthesis | memmould-guided-rlm |  | false | false | true | true | true |  | src/report.mjs |  | 23,561 | 62,464 | 72.6% | 0 |

## By Condition

| Condition | Pass | Total Input | Avg Input | Cache Read | Cache Hit |
|---|---:|---:|---:|---:|---:|
| code-only | 1/3 | 55,845 | 18,615 | 152,576 | 73.2% |
| rlm-transcript-search | 2/3 | 61,326 | 20,442 | 136,704 | 69.0% |
| memmould-only | 2/3 | 64,241 | 21,414 | 198,656 | 75.6% |
| memmould-guided-rlm | 2/3 | 54,008 | 18,003 | 175,616 | 76.5% |
