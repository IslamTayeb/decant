# Code Memory Benchmark Run

- Conditions: code-only, rlm-transcript-search, memmould-only, memmould-guided-rlm
- Fixtures: memory-missing-pagination, memory-correction-retry-cap, memory-synthesis-report
- Model: openai/gpt-5.5
- Repeats: 1

| Fixture | Condition | Repeat | Pass | Stats | Error |
|---|---|---:|---:|---|---|
| memory-missing-pagination | code-only |  | true | [stats](fixtures/memory-missing-pagination/conditions/code-only/stats.json) |  |
| memory-missing-pagination | rlm-transcript-search |  | true | [stats](fixtures/memory-missing-pagination/conditions/rlm-transcript-search/stats.json) |  |
| memory-missing-pagination | memmould-only |  | true | [stats](fixtures/memory-missing-pagination/conditions/memmould-only/stats.json) |  |
| memory-missing-pagination | memmould-guided-rlm |  | true | [stats](fixtures/memory-missing-pagination/conditions/memmould-guided-rlm/stats.json) |  |
| memory-correction-retry-cap | code-only |  | false | [stats](fixtures/memory-correction-retry-cap/conditions/code-only/stats.json) |  |
| memory-correction-retry-cap | rlm-transcript-search |  | true | [stats](fixtures/memory-correction-retry-cap/conditions/rlm-transcript-search/stats.json) |  |
| memory-correction-retry-cap | memmould-only |  | true | [stats](fixtures/memory-correction-retry-cap/conditions/memmould-only/stats.json) |  |
| memory-correction-retry-cap | memmould-guided-rlm |  | true | [stats](fixtures/memory-correction-retry-cap/conditions/memmould-guided-rlm/stats.json) |  |
| memory-synthesis-report | code-only |  | false | [stats](fixtures/memory-synthesis-report/conditions/code-only/stats.json) |  |
| memory-synthesis-report | rlm-transcript-search |  | false | [stats](fixtures/memory-synthesis-report/conditions/rlm-transcript-search/stats.json) |  |
| memory-synthesis-report | memmould-only |  | false | [stats](fixtures/memory-synthesis-report/conditions/memmould-only/stats.json) |  |
| memory-synthesis-report | memmould-guided-rlm |  | false | [stats](fixtures/memory-synthesis-report/conditions/memmould-guided-rlm/stats.json) |  |

