# Code Recall Benchmark Run

- Conditions: code-only, rlm-transcript-search, decant-only, decant-guided-rlm
- Fixtures: recall-missing-pagination, recall-correction-retry-cap, recall-synthesis-report
- Model: openai/gpt-5.5
- Repeats: 1

| Fixture | Condition | Repeat | Pass | Stats | Error |
|---|---|---:|---:|---|---|
| recall-missing-pagination | code-only |  | true | [stats](fixtures/recall-missing-pagination/conditions/code-only/stats.json) |  |
| recall-missing-pagination | rlm-transcript-search |  | true | [stats](fixtures/recall-missing-pagination/conditions/rlm-transcript-search/stats.json) |  |
| recall-missing-pagination | decant-only |  | true | [stats](fixtures/recall-missing-pagination/conditions/decant-only/stats.json) |  |
| recall-missing-pagination | decant-guided-rlm |  | true | [stats](fixtures/recall-missing-pagination/conditions/decant-guided-rlm/stats.json) |  |
| recall-correction-retry-cap | code-only |  | false | [stats](fixtures/recall-correction-retry-cap/conditions/code-only/stats.json) |  |
| recall-correction-retry-cap | rlm-transcript-search |  | true | [stats](fixtures/recall-correction-retry-cap/conditions/rlm-transcript-search/stats.json) |  |
| recall-correction-retry-cap | decant-only |  | true | [stats](fixtures/recall-correction-retry-cap/conditions/decant-only/stats.json) |  |
| recall-correction-retry-cap | decant-guided-rlm |  | true | [stats](fixtures/recall-correction-retry-cap/conditions/decant-guided-rlm/stats.json) |  |
| recall-synthesis-report | code-only |  | false | [stats](fixtures/recall-synthesis-report/conditions/code-only/stats.json) |  |
| recall-synthesis-report | rlm-transcript-search |  | false | [stats](fixtures/recall-synthesis-report/conditions/rlm-transcript-search/stats.json) |  |
| recall-synthesis-report | decant-only |  | false | [stats](fixtures/recall-synthesis-report/conditions/decant-only/stats.json) |  |
| recall-synthesis-report | decant-guided-rlm |  | false | [stats](fixtures/recall-synthesis-report/conditions/decant-guided-rlm/stats.json) |  |

