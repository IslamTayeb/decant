# Code Memory Benchmark Run

- Conditions: code-only, rlm-transcript-search, memmould-guided-rlm
- Fixtures: memory-unnecessary-slug, memory-helpful-schema, memory-harmful-refresh
- Model: openai/gpt-5.5

| Fixture | Condition | Pass | Stats | Error |
|---|---|---:|---|---|
| memory-unnecessary-slug | code-only | true | [stats](fixtures/memory-unnecessary-slug/conditions/code-only/stats.json) |  |
| memory-unnecessary-slug | rlm-transcript-search | true | [stats](fixtures/memory-unnecessary-slug/conditions/rlm-transcript-search/stats.json) |  |
| memory-unnecessary-slug | memmould-guided-rlm | true | [stats](fixtures/memory-unnecessary-slug/conditions/memmould-guided-rlm/stats.json) |  |
| memory-helpful-schema | code-only | false | [stats](fixtures/memory-helpful-schema/conditions/code-only/stats.json) |  |
| memory-helpful-schema | rlm-transcript-search | true | [stats](fixtures/memory-helpful-schema/conditions/rlm-transcript-search/stats.json) |  |
| memory-helpful-schema | memmould-guided-rlm | true | [stats](fixtures/memory-helpful-schema/conditions/memmould-guided-rlm/stats.json) |  |
| memory-harmful-refresh | code-only | false | [stats](fixtures/memory-harmful-refresh/conditions/code-only/stats.json) |  |
| memory-harmful-refresh | rlm-transcript-search | true | [stats](fixtures/memory-harmful-refresh/conditions/rlm-transcript-search/stats.json) |  |
| memory-harmful-refresh | memmould-guided-rlm | true | [stats](fixtures/memory-harmful-refresh/conditions/memmould-guided-rlm/stats.json) |  |

