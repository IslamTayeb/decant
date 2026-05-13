# Provenance Blog Benchmark Analysis

- Run: /Users/islamtayeb/Documents/GitHub/mem-mould/benchmarks/provenance-qa/runs/gpt55-blog-full-matrix-policy
- Generated: 2026-05-12T22:56:16.341Z
- Passed: 20/25

| Fixture | Condition | Pass | Answer | Provenance | Tool Policy | Tool Failures | Tool Path | Input Tok | Cache Read Tok | Cache Hit | Parent Input | Child Input | Irrelevant Reads |
|---|---|---:|---:|---:|---:|---|---|---:|---:|---:|---:|---:|---:|
| auth-queue-rationale | memmould-map-zoom | true | true | true | true |  | session_lookup -> session_detail -> message_detail | 3,787 | 39,424 | 91.2% | 3,787 | 0 | 0 |
| auth-queue-rationale | rlm-transcript-search | false | false | true | true |  | glob -> grep -> grep -> read -> grep | 6,581 | 52,736 | 88.9% | 6,581 | 0 | 0 |
| auth-queue-rationale | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_detail -> message_detail | 6,962 | 30,208 | 81.3% | 1,084 | 5,878 | 0 |
| auth-queue-rationale | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> grep -> read -> grep -> read | 10,826 | 43,520 | 80.1% | 1,209 | 9,617 | 1 |
| blame-line-rationale | memmould-blame-lookup | true | true | true | true |  | blame_lookup -> session_lookup -> session_detail -> message_detail | 4,410 | 50,176 | 91.9% | 4,410 | 0 | 0 |
| blame-line-rationale | memmould-map-zoom | true | true | true | true |  | session_lookup -> session_detail -> message_detail | 13,424 | 30,720 | 69.6% | 13,424 | 0 | 0 |
| blame-line-rationale | rlm-transcript-search | false | true | true | false | missing:glob | grep -> read -> grep | 3,265 | 38,912 | 92.3% | 3,265 | 0 | 0 |
| blame-line-rationale | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_detail -> message_detail | 11,964 | 26,112 | 68.6% | 1,023 | 10,941 | 0 |
| blame-line-rationale | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> grep -> read -> grep -> read -> glob | 13,601 | 48,128 | 78.0% | 1,249 | 12,352 | 1 |
| correction-chain | memmould-map-zoom | false | false | true | true |  | session_lookup -> session_detail -> message_detail | 9,619 | 34,304 | 78.1% | 9,619 | 0 | 0 |
| correction-chain | rlm-transcript-search | true | true | true | true |  | glob -> grep -> read | 3,909 | 38,400 | 90.8% | 3,909 | 0 | 0 |
| correction-chain | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_detail -> message_detail | 7,179 | 30,720 | 81.1% | 1,091 | 6,088 | 0 |
| correction-chain | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> grep -> read -> grep | 9,401 | 38,400 | 80.3% | 1,308 | 8,093 | 0 |
| false-provenance | memmould-map-zoom | true | true | true | true |  | session_lookup -> session_detail -> message_detail | 3,504 | 40,448 | 92.0% | 3,504 | 0 | 0 |
| false-provenance | rlm-transcript-search | true | true | true | true |  | glob -> grep -> read -> grep | 3,990 | 50,176 | 92.6% | 3,990 | 0 | 0 |
| false-provenance | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_detail -> message_detail | 15,815 | 22,016 | 58.2% | 1,013 | 14,802 | 0 |
| false-provenance | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> grep -> read -> grep -> read -> read | 7,497 | 57,856 | 88.5% | 1,290 | 6,207 | 1 |
| multi-agent-synthesis | memmould-map-zoom | true | true | true | true |  | session_lookup -> session_detail -> message_detail -> message_detail | 4,038 | 51,712 | 92.8% | 4,038 | 0 | 0 |
| multi-agent-synthesis | rlm-transcript-search | false | false | true | true |  | glob -> grep -> grep -> read -> read -> read -> grep | 5,984 | 52,224 | 89.7% | 5,984 | 0 | 2 |
| multi-agent-synthesis | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_detail -> message_detail | 11,346 | 26,624 | 70.1% | 1,066 | 10,280 | 0 |
| multi-agent-synthesis | subagent-rlm-transcript-search | false | false | true | true |  | task -> glob -> grep -> grep -> read -> grep -> read -> grep | 9,391 | 54,272 | 85.2% | 1,957 | 7,434 | 1 |
| related-reuse | memmould-map-zoom | true | true | true | true |  | session_lookup -> session_detail -> message_detail | 3,610 | 40,448 | 91.8% | 3,610 | 0 | 0 |
| related-reuse | rlm-transcript-search | true | true | true | true |  | grep -> read -> grep -> read -> read -> read -> grep -> glob | 17,612 | 64,000 | 78.4% | 17,612 | 0 | 3 |
| related-reuse | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_detail -> message_detail | 4,579 | 33,280 | 87.9% | 1,026 | 3,553 | 0 |
| related-reuse | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> read -> grep -> read -> read -> read | 6,600 | 48,128 | 87.9% | 1,346 | 5,254 | 3 |
