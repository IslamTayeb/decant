# Provenance Blog Benchmark Run

- Model: openai/gpt-5.5
- Child model: inherits parent
- Fixtures: auth-queue-rationale, correction-chain, false-provenance, related-reuse, multi-agent-synthesis, blame-line-rationale
- Conditions: rlm-transcript-search, subagent-rlm-transcript-search, decant-guided-rlm, subagent-decant-guided-rlm

| Fixture | Condition | Pass | Stats | Error |
|---|---|---:|---|---|
| auth-queue-rationale | rlm-transcript-search | true | [stats](fixtures/auth-queue-rationale/conditions/rlm-transcript-search/stats.json) |  |
| auth-queue-rationale | subagent-rlm-transcript-search | true | [stats](fixtures/auth-queue-rationale/conditions/subagent-rlm-transcript-search/stats.json) |  |
| auth-queue-rationale | decant-guided-rlm | true | [stats](fixtures/auth-queue-rationale/conditions/decant-guided-rlm/stats.json) |  |
| auth-queue-rationale | subagent-decant-guided-rlm | true | [stats](fixtures/auth-queue-rationale/conditions/subagent-decant-guided-rlm/stats.json) |  |
| correction-chain | rlm-transcript-search | true | [stats](fixtures/correction-chain/conditions/rlm-transcript-search/stats.json) |  |
| correction-chain | subagent-rlm-transcript-search | true | [stats](fixtures/correction-chain/conditions/subagent-rlm-transcript-search/stats.json) |  |
| correction-chain | decant-guided-rlm | true | [stats](fixtures/correction-chain/conditions/decant-guided-rlm/stats.json) |  |
| correction-chain | subagent-decant-guided-rlm | true | [stats](fixtures/correction-chain/conditions/subagent-decant-guided-rlm/stats.json) |  |
| false-provenance | rlm-transcript-search | true | [stats](fixtures/false-provenance/conditions/rlm-transcript-search/stats.json) |  |
| false-provenance | subagent-rlm-transcript-search | true | [stats](fixtures/false-provenance/conditions/subagent-rlm-transcript-search/stats.json) |  |
| false-provenance | decant-guided-rlm | true | [stats](fixtures/false-provenance/conditions/decant-guided-rlm/stats.json) |  |
| false-provenance | subagent-decant-guided-rlm | true | [stats](fixtures/false-provenance/conditions/subagent-decant-guided-rlm/stats.json) |  |
| related-reuse | rlm-transcript-search | true | [stats](fixtures/related-reuse/conditions/rlm-transcript-search/stats.json) |  |
| related-reuse | subagent-rlm-transcript-search | true | [stats](fixtures/related-reuse/conditions/subagent-rlm-transcript-search/stats.json) |  |
| related-reuse | decant-guided-rlm | true | [stats](fixtures/related-reuse/conditions/decant-guided-rlm/stats.json) |  |
| related-reuse | subagent-decant-guided-rlm | true | [stats](fixtures/related-reuse/conditions/subagent-decant-guided-rlm/stats.json) |  |
| multi-agent-synthesis | rlm-transcript-search | true | [stats](fixtures/multi-agent-synthesis/conditions/rlm-transcript-search/stats.json) |  |
| multi-agent-synthesis | subagent-rlm-transcript-search | true | [stats](fixtures/multi-agent-synthesis/conditions/subagent-rlm-transcript-search/stats.json) |  |
| multi-agent-synthesis | decant-guided-rlm | true | [stats](fixtures/multi-agent-synthesis/conditions/decant-guided-rlm/stats.json) |  |
| multi-agent-synthesis | subagent-decant-guided-rlm | true | [stats](fixtures/multi-agent-synthesis/conditions/subagent-decant-guided-rlm/stats.json) |  |
| blame-line-rationale | rlm-transcript-search | true | [stats](fixtures/blame-line-rationale/conditions/rlm-transcript-search/stats.json) |  |
| blame-line-rationale | subagent-rlm-transcript-search | true | [stats](fixtures/blame-line-rationale/conditions/subagent-rlm-transcript-search/stats.json) |  |
| blame-line-rationale | decant-guided-rlm | true | [stats](fixtures/blame-line-rationale/conditions/decant-guided-rlm/stats.json) |  |
| blame-line-rationale | subagent-decant-guided-rlm | true | [stats](fixtures/blame-line-rationale/conditions/subagent-decant-guided-rlm/stats.json) |  |

