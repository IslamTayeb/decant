# Provenance Blog Benchmark Run

- Model: openai/gpt-5.5
- Child model: openai/gpt-5.4-mini
- Fixtures: auth-queue-rationale, correction-chain, false-provenance, related-reuse, multi-agent-synthesis, blame-line-rationale
- Conditions: subagent-rlm-transcript-search, subagent-map-zoom

| Fixture | Condition | Pass | Stats | Error |
|---|---|---:|---|---|
| auth-queue-rationale | subagent-rlm-transcript-search | true | [stats](fixtures/auth-queue-rationale/conditions/subagent-rlm-transcript-search/stats.json) |  |
| auth-queue-rationale | subagent-map-zoom | true | [stats](fixtures/auth-queue-rationale/conditions/subagent-map-zoom/stats.json) |  |
| correction-chain | subagent-rlm-transcript-search | true | [stats](fixtures/correction-chain/conditions/subagent-rlm-transcript-search/stats.json) |  |
| correction-chain | subagent-map-zoom | true | [stats](fixtures/correction-chain/conditions/subagent-map-zoom/stats.json) |  |
| false-provenance | subagent-rlm-transcript-search | true | [stats](fixtures/false-provenance/conditions/subagent-rlm-transcript-search/stats.json) |  |
| false-provenance | subagent-map-zoom | true | [stats](fixtures/false-provenance/conditions/subagent-map-zoom/stats.json) |  |
| related-reuse | subagent-rlm-transcript-search | true | [stats](fixtures/related-reuse/conditions/subagent-rlm-transcript-search/stats.json) |  |
| related-reuse | subagent-map-zoom | true | [stats](fixtures/related-reuse/conditions/subagent-map-zoom/stats.json) |  |
| multi-agent-synthesis | subagent-rlm-transcript-search | true | [stats](fixtures/multi-agent-synthesis/conditions/subagent-rlm-transcript-search/stats.json) |  |
| multi-agent-synthesis | subagent-map-zoom | true | [stats](fixtures/multi-agent-synthesis/conditions/subagent-map-zoom/stats.json) |  |
| blame-line-rationale | subagent-rlm-transcript-search | true | [stats](fixtures/blame-line-rationale/conditions/subagent-rlm-transcript-search/stats.json) |  |
| blame-line-rationale | subagent-map-zoom | true | [stats](fixtures/blame-line-rationale/conditions/subagent-map-zoom/stats.json) |  |

