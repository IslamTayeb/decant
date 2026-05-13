# Provenance Blog Benchmark Run

- Model: openai/gpt-5.5
- Child model: inherits parent
- Fixtures: auth-queue-rationale, correction-chain, false-provenance, related-reuse, multi-agent-synthesis, blame-line-rationale
- Conditions: rlm-transcript-search, subagent-rlm-transcript-search, memmould-map-zoom, subagent-map-zoom, memmould-blame-lookup

| Fixture | Condition | Pass | Stats | Error |
|---|---|---:|---|---|
| auth-queue-rationale | rlm-transcript-search | false | [stats](fixtures/auth-queue-rationale/conditions/rlm-transcript-search/stats.json) |  |
| auth-queue-rationale | subagent-rlm-transcript-search | true | [stats](fixtures/auth-queue-rationale/conditions/subagent-rlm-transcript-search/stats.json) |  |
| auth-queue-rationale | memmould-map-zoom | true | [stats](fixtures/auth-queue-rationale/conditions/memmould-map-zoom/stats.json) |  |
| auth-queue-rationale | subagent-map-zoom | true | [stats](fixtures/auth-queue-rationale/conditions/subagent-map-zoom/stats.json) |  |
| correction-chain | rlm-transcript-search | true | [stats](fixtures/correction-chain/conditions/rlm-transcript-search/stats.json) |  |
| correction-chain | subagent-rlm-transcript-search | true | [stats](fixtures/correction-chain/conditions/subagent-rlm-transcript-search/stats.json) |  |
| correction-chain | memmould-map-zoom | false | [stats](fixtures/correction-chain/conditions/memmould-map-zoom/stats.json) |  |
| correction-chain | subagent-map-zoom | true | [stats](fixtures/correction-chain/conditions/subagent-map-zoom/stats.json) |  |
| false-provenance | rlm-transcript-search | true | [stats](fixtures/false-provenance/conditions/rlm-transcript-search/stats.json) |  |
| false-provenance | subagent-rlm-transcript-search | true | [stats](fixtures/false-provenance/conditions/subagent-rlm-transcript-search/stats.json) |  |
| false-provenance | memmould-map-zoom | true | [stats](fixtures/false-provenance/conditions/memmould-map-zoom/stats.json) |  |
| false-provenance | subagent-map-zoom | true | [stats](fixtures/false-provenance/conditions/subagent-map-zoom/stats.json) |  |
| related-reuse | rlm-transcript-search | true | [stats](fixtures/related-reuse/conditions/rlm-transcript-search/stats.json) |  |
| related-reuse | subagent-rlm-transcript-search | true | [stats](fixtures/related-reuse/conditions/subagent-rlm-transcript-search/stats.json) |  |
| related-reuse | memmould-map-zoom | true | [stats](fixtures/related-reuse/conditions/memmould-map-zoom/stats.json) |  |
| related-reuse | subagent-map-zoom | true | [stats](fixtures/related-reuse/conditions/subagent-map-zoom/stats.json) |  |
| multi-agent-synthesis | rlm-transcript-search | false | [stats](fixtures/multi-agent-synthesis/conditions/rlm-transcript-search/stats.json) |  |
| multi-agent-synthesis | subagent-rlm-transcript-search | false | [stats](fixtures/multi-agent-synthesis/conditions/subagent-rlm-transcript-search/stats.json) |  |
| multi-agent-synthesis | memmould-map-zoom | true | [stats](fixtures/multi-agent-synthesis/conditions/memmould-map-zoom/stats.json) |  |
| multi-agent-synthesis | subagent-map-zoom | true | [stats](fixtures/multi-agent-synthesis/conditions/subagent-map-zoom/stats.json) |  |
| blame-line-rationale | rlm-transcript-search | false | [stats](fixtures/blame-line-rationale/conditions/rlm-transcript-search/stats.json) |  |
| blame-line-rationale | subagent-rlm-transcript-search | true | [stats](fixtures/blame-line-rationale/conditions/subagent-rlm-transcript-search/stats.json) |  |
| blame-line-rationale | memmould-map-zoom | true | [stats](fixtures/blame-line-rationale/conditions/memmould-map-zoom/stats.json) |  |
| blame-line-rationale | subagent-map-zoom | true | [stats](fixtures/blame-line-rationale/conditions/subagent-map-zoom/stats.json) |  |
| blame-line-rationale | memmould-blame-lookup | true | [stats](fixtures/blame-line-rationale/conditions/memmould-blame-lookup/stats.json) |  |

