# Provenance Blog Benchmark Analysis

- Run: /Users/islamtayeb/Documents/GitHub/mem-mould/benchmarks/provenance-qa/runs/gpt55-parent-gpt54mini-child-subagents
- Generated: 2026-05-12T23:13:37.325Z
- Passed: 12/12

| Fixture | Condition | Pass | Answer | Provenance | Tool Policy | Tool Failures | Tool Path | Input Tok | Cache Read Tok | Cache Hit | Parent Input | Child Input | Irrelevant Reads |
|---|---|---:|---:|---:|---:|---|---|---:|---:|---:|---:|---:|---:|
| auth-queue-rationale | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_lookup -> session_lookup -> session_detail -> message_detail | 12,400 | 30,720 | 71.2% | 1,084 | 11,316 | 0 |
| auth-queue-rationale | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> grep -> read -> grep -> read | 8,401 | 46,592 | 84.7% | 1,385 | 7,016 | 1 |
| blame-line-rationale | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_lookup -> session_lookup -> session_detail -> message_detail | 17,163 | 28,672 | 62.6% | 10,769 | 6,394 | 0 |
| blame-line-rationale | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> grep -> read -> grep -> grep -> read | 7,556 | 53,760 | 87.7% | 1,328 | 6,228 | 1 |
| correction-chain | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_lookup -> session_lookup -> session_detail -> message_detail | 9,519 | 35,840 | 79.0% | 1,059 | 8,460 | 0 |
| correction-chain | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> grep -> read -> grep -> glob -> read | 11,862 | 51,200 | 81.2% | 1,302 | 10,560 | 1 |
| false-provenance | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_lookup -> session_lookup -> session_detail -> message_detail | 9,560 | 35,840 | 78.9% | 1,063 | 8,497 | 0 |
| false-provenance | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> grep -> read -> grep -> read | 6,966 | 48,128 | 87.4% | 1,730 | 5,236 | 1 |
| multi-agent-synthesis | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_lookup -> session_lookup -> session_detail -> message_detail | 10,361 | 32,768 | 76.0% | 1,138 | 9,223 | 0 |
| multi-agent-synthesis | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> grep -> read -> grep -> read -> grep | 8,944 | 58,880 | 86.8% | 1,285 | 7,659 | 1 |
| related-reuse | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_lookup -> session_lookup -> session_detail -> session_detail -> message_detail | 14,497 | 32,256 | 69.0% | 1,037 | 13,460 | 0 |
| related-reuse | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> read -> grep -> grep -> read -> read -> read -> grep -> grep | 20,875 | 41,472 | 66.5% | 1,385 | 19,490 | 3 |
