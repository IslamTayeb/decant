# Code Recall Benchmark Run

- Conditions: default-compaction, rlm-transcript-search, decant-only
- Fixtures: recall-missing-pagination, recall-correction-retry-cap, recall-synthesis-report
- Model: openai/gpt-5.5
- Repeats: 1

| Fixture | Condition | Repeat | Pass | Stats | Error |
|---|---|---:|---:|---|---|
| recall-missing-pagination | default-compaction |  | true | [stats](fixtures/recall-missing-pagination/conditions/default-compaction/stats.json) |  |
| recall-missing-pagination | rlm-transcript-search |  | true | [stats](fixtures/recall-missing-pagination/conditions/rlm-transcript-search/stats.json) |  |
| recall-missing-pagination | decant-only |  | true | [stats](fixtures/recall-missing-pagination/conditions/decant-only/stats.json) |  |
| recall-correction-retry-cap | default-compaction |  | true | [stats](fixtures/recall-correction-retry-cap/conditions/default-compaction/stats.json) |  |
| recall-correction-retry-cap | rlm-transcript-search |  | true | [stats](fixtures/recall-correction-retry-cap/conditions/rlm-transcript-search/stats.json) |  |
| recall-correction-retry-cap | decant-only |  | true | [stats](fixtures/recall-correction-retry-cap/conditions/decant-only/stats.json) |  |
| recall-synthesis-report | default-compaction |  | false | [stats](fixtures/recall-synthesis-report/conditions/default-compaction/stats.json) |  |
| recall-synthesis-report | rlm-transcript-search |  | false | [stats](fixtures/recall-synthesis-report/conditions/rlm-transcript-search/stats.json) |  |
| recall-synthesis-report | decant-only |  | false | [stats](fixtures/recall-synthesis-report/conditions/decant-only/stats.json) |  |

