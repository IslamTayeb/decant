# Provenance Blog Benchmark Run

- Model: openai/gpt-5.5
- Child model: inherits parent
- Fixtures: auth-queue-rationale, correction-chain, false-provenance, related-reuse, multi-agent-synthesis, blame-line-rationale
- Conditions: rlm-transcript-search, subagent-rlm-transcript-search, memmould-guided-rlm, subagent-memmould-guided-rlm

| Fixture | Condition | Pass | Stats | Error |
|---|---|---:|---|---|
| auth-queue-rationale | rlm-transcript-search | true | [stats](fixtures/auth-queue-rationale/conditions/rlm-transcript-search/stats.json) |  |
| auth-queue-rationale | subagent-rlm-transcript-search | true | [stats](fixtures/auth-queue-rationale/conditions/subagent-rlm-transcript-search/stats.json) |  |
| auth-queue-rationale | memmould-guided-rlm | true | [stats](fixtures/auth-queue-rationale/conditions/memmould-guided-rlm/stats.json) |  |
| auth-queue-rationale | subagent-memmould-guided-rlm | true | [stats](fixtures/auth-queue-rationale/conditions/subagent-memmould-guided-rlm/stats.json) |  |
| correction-chain | rlm-transcript-search | true | [stats](fixtures/correction-chain/conditions/rlm-transcript-search/stats.json) |  |
| correction-chain | subagent-rlm-transcript-search | true | [stats](fixtures/correction-chain/conditions/subagent-rlm-transcript-search/stats.json) |  |
| correction-chain | memmould-guided-rlm | true | [stats](fixtures/correction-chain/conditions/memmould-guided-rlm/stats.json) |  |
| correction-chain | subagent-memmould-guided-rlm | true | [stats](fixtures/correction-chain/conditions/subagent-memmould-guided-rlm/stats.json) |  |
| false-provenance | rlm-transcript-search | true | [stats](fixtures/false-provenance/conditions/rlm-transcript-search/stats.json) |  |
| false-provenance | subagent-rlm-transcript-search | true | [stats](fixtures/false-provenance/conditions/subagent-rlm-transcript-search/stats.json) |  |
| false-provenance | memmould-guided-rlm | true | [stats](fixtures/false-provenance/conditions/memmould-guided-rlm/stats.json) |  |
| false-provenance | subagent-memmould-guided-rlm | true | [stats](fixtures/false-provenance/conditions/subagent-memmould-guided-rlm/stats.json) |  |
| related-reuse | rlm-transcript-search | true | [stats](fixtures/related-reuse/conditions/rlm-transcript-search/stats.json) |  |
| related-reuse | subagent-rlm-transcript-search | true | [stats](fixtures/related-reuse/conditions/subagent-rlm-transcript-search/stats.json) |  |
| related-reuse | memmould-guided-rlm | true | [stats](fixtures/related-reuse/conditions/memmould-guided-rlm/stats.json) |  |
| related-reuse | subagent-memmould-guided-rlm | true | [stats](fixtures/related-reuse/conditions/subagent-memmould-guided-rlm/stats.json) |  |
| multi-agent-synthesis | rlm-transcript-search | true | [stats](fixtures/multi-agent-synthesis/conditions/rlm-transcript-search/stats.json) |  |
| multi-agent-synthesis | subagent-rlm-transcript-search | true | [stats](fixtures/multi-agent-synthesis/conditions/subagent-rlm-transcript-search/stats.json) |  |
| multi-agent-synthesis | memmould-guided-rlm | true | [stats](fixtures/multi-agent-synthesis/conditions/memmould-guided-rlm/stats.json) |  |
| multi-agent-synthesis | subagent-memmould-guided-rlm | true | [stats](fixtures/multi-agent-synthesis/conditions/subagent-memmould-guided-rlm/stats.json) |  |
| blame-line-rationale | rlm-transcript-search | true | [stats](fixtures/blame-line-rationale/conditions/rlm-transcript-search/stats.json) |  |
| blame-line-rationale | subagent-rlm-transcript-search | true | [stats](fixtures/blame-line-rationale/conditions/subagent-rlm-transcript-search/stats.json) |  |
| blame-line-rationale | memmould-guided-rlm | true | [stats](fixtures/blame-line-rationale/conditions/memmould-guided-rlm/stats.json) |  |
| blame-line-rationale | subagent-memmould-guided-rlm | true | [stats](fixtures/blame-line-rationale/conditions/subagent-memmould-guided-rlm/stats.json) |  |

