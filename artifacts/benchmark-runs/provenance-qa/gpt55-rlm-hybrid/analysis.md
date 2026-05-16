# Provenance Blog Benchmark Analysis

- Run: ./benchmarks/provenance-qa/runs/gpt55-rlm-hybrid
- Generated: 2026-05-13T00:39:20.463Z
- Passed: 24/24

| Fixture | Condition | Pass | Answer | Provenance | Tool Policy | Tool Failures | Tool Path | Input Tok | Cache Read Tok | Cache Hit | Parent Input | Child Input | Bash Calls | Irrelevant Reads |
|---|---|---:|---:|---:|---:|---|---|---:|---:|---:|---:|---:|---:|---:|
| auth-queue-rationale | decant-guided-rlm | true | true | true | true |  | session_lookup -> session_detail -> glob -> grep -> read -> message_detail | 6,133 | 77,312 | 92.7% | 6,133 | 0 | 0 | 0 |
| auth-queue-rationale | rlm-transcript-search | true | true | true | true |  | grep -> read -> grep -> glob -> read -> read -> read -> read -> read -> read -> read -> read -> read -> glob -> read | 29,298 | 76,288 | 72.3% | 29,298 | 0 | 0 | 10 |
| auth-queue-rationale | subagent-decant-guided-rlm | true | true | true | true |  | task -> session_lookup -> session_detail -> glob -> grep -> read -> message_detail | 17,646 | 62,464 | 78.0% | 1,477 | 16,169 | 0 | 0 |
| auth-queue-rationale | subagent-rlm-transcript-search | true | true | true | true |  | task -> grep -> glob -> read -> read -> read -> grep | 19,711 | 33,280 | 62.8% | 8,677 | 11,034 | 0 | 2 |
| blame-line-rationale | decant-guided-rlm | true | true | true | true |  | session_lookup -> session_detail -> grep -> glob -> message_detail | 6,380 | 54,272 | 89.5% | 6,380 | 0 | 0 | 0 |
| blame-line-rationale | rlm-transcript-search | true | true | true | true |  | glob -> grep -> read -> grep -> read -> read -> glob -> read | 17,223 | 53,760 | 75.7% | 17,223 | 0 | 0 | 2 |
| blame-line-rationale | subagent-decant-guided-rlm | true | true | true | true |  | task -> session_lookup -> session_detail -> glob -> grep -> read -> read -> read -> message_detail | 8,892 | 67,584 | 88.4% | 1,469 | 7,423 | 0 | 2 |
| blame-line-rationale | subagent-rlm-transcript-search | true | true | true | true |  | task -> grep -> grep -> read -> grep -> read -> glob | 10,462 | 60,416 | 85.2% | 1,428 | 9,034 | 0 | 0 |
| correction-chain | decant-guided-rlm | true | true | true | true |  | session_lookup -> session_detail -> glob -> grep -> read -> message_detail | 6,747 | 68,096 | 91.0% | 6,747 | 0 | 0 | 0 |
| correction-chain | rlm-transcript-search | true | true | true | true |  | glob -> grep -> read -> grep -> glob -> read | 6,501 | 63,488 | 90.7% | 6,501 | 0 | 0 | 0 |
| correction-chain | subagent-decant-guided-rlm | true | true | true | true |  | task -> session_lookup -> session_detail -> message_detail -> glob -> grep -> read | 12,082 | 60,928 | 83.5% | 1,464 | 10,618 | 0 | 0 |
| correction-chain | subagent-rlm-transcript-search | true | true | true | true |  | task -> grep -> glob -> read -> grep | 8,971 | 41,984 | 82.4% | 1,510 | 7,461 | 0 | 0 |
| false-provenance | decant-guided-rlm | true | true | true | true |  | session_lookup -> session_detail -> glob -> grep -> read -> message_detail | 6,727 | 68,096 | 91.0% | 6,727 | 0 | 0 | 0 |
| false-provenance | rlm-transcript-search | true | true | true | true |  | grep -> read -> grep -> glob | 11,320 | 31,744 | 73.7% | 11,320 | 0 | 0 | 0 |
| false-provenance | subagent-decant-guided-rlm | true | true | true | true |  | task -> session_lookup -> session_detail -> grep -> glob -> read -> message_detail | 12,083 | 62,976 | 83.9% | 1,470 | 10,613 | 0 | 0 |
| false-provenance | subagent-rlm-transcript-search | true | true | true | true |  | task -> grep -> glob -> read -> read -> read -> grep -> read | 6,389 | 54,272 | 89.5% | 1,385 | 5,004 | 0 | 3 |
| multi-agent-synthesis | decant-guided-rlm | true | true | true | true |  | session_lookup -> session_detail -> grep -> glob -> read -> message_detail | 6,777 | 68,096 | 90.9% | 6,777 | 0 | 0 | 0 |
| multi-agent-synthesis | rlm-transcript-search | true | true | true | true |  | glob -> grep -> grep -> read -> read | 10,978 | 44,544 | 80.2% | 10,978 | 0 | 0 | 1 |
| multi-agent-synthesis | subagent-decant-guided-rlm | true | true | true | true |  | task -> session_lookup -> session_detail -> glob -> grep -> read -> message_detail | 9,493 | 64,512 | 87.2% | 1,495 | 7,998 | 0 | 0 |
| multi-agent-synthesis | subagent-rlm-transcript-search | true | true | true | true |  | task -> grep -> glob -> read -> read -> read -> grep -> read -> bash | 16,178 | 53,760 | 76.9% | 7,590 | 8,588 | 1 | 3 |
| related-reuse | decant-guided-rlm | true | true | true | true |  | session_lookup -> session_detail -> grep -> glob -> message_detail | 7,296 | 51,712 | 87.6% | 7,296 | 0 | 0 | 0 |
| related-reuse | rlm-transcript-search | true | true | true | true |  | glob -> grep -> read -> read -> read -> grep -> read -> glob -> read | 14,114 | 72,192 | 83.6% | 14,114 | 0 | 0 | 3 |
| related-reuse | subagent-decant-guided-rlm | true | true | true | true |  | task -> session_lookup -> glob -> grep -> session_detail -> message_detail | 13,231 | 52,224 | 79.8% | 1,401 | 11,830 | 0 | 0 |
| related-reuse | subagent-rlm-transcript-search | true | true | true | true |  | task -> grep -> glob -> read -> read -> read -> grep -> grep -> read -> read | 7,510 | 62,976 | 89.3% | 1,460 | 6,050 | 0 | 4 |
