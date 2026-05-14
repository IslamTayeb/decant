# Provenance Blog Benchmark Analysis

- Run: ./benchmarks/provenance-qa/runs/gpt55-blog-full-matrix
- Generated: 2026-05-12T22:28:27.972Z
- Passed: 23/25

| Fixture | Condition | Pass | Answer | Provenance | Tool Policy | Tool Failures | Tool Path | Input Tok | Cache Read Tok | Cache Hit | Parent Input | Child Input | Irrelevant Reads |
|---|---|---:|---:|---:|---:|---|---|---:|---:|---:|---:|---:|---:|
| auth-queue-rationale | memmould-map-zoom | true | true | true | false |  | session_lookup -> session_detail -> message_detail | 12,644 | 30,208 | 70.5% | 12,644 | 0 | 0 |
| auth-queue-rationale | rlm-transcript-search | true | true | true | false |  | glob -> grep -> read -> grep -> glob -> read | 12,837 | 69,120 | 84.3% | 12,837 | 0 | 0 |
| auth-queue-rationale | subagent-map-zoom | false | false | false | false |  |  | 0 | 0 |  | 0 | 0 | 0 |
| auth-queue-rationale | subagent-rlm-transcript-search | true | true | true | false |  | task -> glob -> grep -> grep -> read -> grep -> read -> grep -> read | 14,610 | 55,296 | 79.1% | 1,116 | 13,494 | 1 |
| blame-line-rationale | memmould-blame-lookup | true | true | true | false |  | blame_lookup -> session_lookup -> session_detail -> message_detail | 4,518 | 49,664 | 91.7% | 4,518 | 0 | 0 |
| blame-line-rationale | memmould-map-zoom | true | true | true | false |  | session_lookup -> session_detail -> message_detail | 3,410 | 40,448 | 92.2% | 3,410 | 0 | 0 |
| blame-line-rationale | rlm-transcript-search | true | true | true | false |  | glob -> grep -> read -> bash | 10,551 | 43,520 | 80.5% | 10,551 | 0 | 0 |
| blame-line-rationale | subagent-map-zoom | true | true | true | false |  | task -> bash -> glob -> read -> glob -> grep -> bash -> read -> read -> bash | 14,597 | 81,408 | 84.8% | 8,182 | 6,415 | 0 |
| blame-line-rationale | subagent-rlm-transcript-search | true | true | true | false |  | task -> glob -> grep -> grep -> read -> grep -> read -> grep -> read -> bash | 12,715 | 66,560 | 84.0% | 1,147 | 11,568 | 1 |
| correction-chain | memmould-map-zoom | true | true | true | false |  | session_lookup -> session_detail -> message_detail | 3,660 | 39,936 | 91.6% | 3,660 | 0 | 0 |
| correction-chain | rlm-transcript-search | true | true | true | false |  | glob -> grep -> read -> grep -> glob -> read | 24,635 | 56,320 | 69.6% | 24,635 | 0 | 0 |
| correction-chain | subagent-map-zoom | true | true | true | false |  | task -> glob -> grep -> read -> glob -> glob -> read -> read -> read -> bash | 19,648 | 35,328 | 64.3% | 9,731 | 9,917 | 2 |
| correction-chain | subagent-rlm-transcript-search | false | false | true | false |  | task -> glob -> grep -> grep -> read -> grep -> read -> glob -> read | 20,762 | 49,152 | 70.3% | 9,820 | 10,942 | 1 |
| false-provenance | memmould-map-zoom | true | true | true | false |  | session_lookup -> session_detail -> message_detail | 3,639 | 39,936 | 91.6% | 3,639 | 0 | 0 |
| false-provenance | rlm-transcript-search | true | true | true | false |  | glob -> grep -> read -> grep | 10,389 | 43,520 | 80.7% | 10,389 | 0 | 0 |
| false-provenance | subagent-map-zoom | true | true | true | false |  | task -> glob -> grep -> read -> read -> grep -> glob | 9,103 | 41,472 | 82.0% | 1,056 | 8,047 | 0 |
| false-provenance | subagent-rlm-transcript-search | true | true | true | false |  | task -> glob -> grep -> grep -> read -> read -> read -> read -> grep -> glob -> read | 9,012 | 60,416 | 87.0% | 1,207 | 7,805 | 3 |
| multi-agent-synthesis | memmould-map-zoom | true | true | true | false |  | session_lookup -> session_detail -> message_detail | 3,301 | 40,448 | 92.5% | 3,301 | 0 | 0 |
| multi-agent-synthesis | rlm-transcript-search | true | true | true | false |  | glob -> grep -> read -> read -> read -> grep | 4,636 | 61,440 | 93.0% | 4,636 | 0 | 2 |
| multi-agent-synthesis | subagent-map-zoom | true | true | true | false |  | task -> glob -> read -> read -> read -> bash | 7,685 | 59,904 | 88.6% | 7,324 | 361 | 0 |
| multi-agent-synthesis | subagent-rlm-transcript-search | true | true | true | false |  | task -> glob -> grep -> read -> grep -> read -> read -> read -> glob -> read -> grep | 9,926 | 73,728 | 88.1% | 1,134 | 8,792 | 3 |
| related-reuse | memmould-map-zoom | true | true | true | false |  | session_lookup -> session_detail -> message_detail | 3,371 | 40,448 | 92.3% | 3,371 | 0 | 0 |
| related-reuse | rlm-transcript-search | true | true | true | false |  | glob -> grep -> read -> grep -> grep | 13,569 | 53,760 | 79.8% | 13,569 | 0 | 0 |
| related-reuse | subagent-map-zoom | true | true | true | false |  | task -> bash -> glob -> grep -> read -> read -> grep -> glob -> read | 6,898 | 65,536 | 90.5% | 1,087 | 5,811 | 0 |
| related-reuse | subagent-rlm-transcript-search | true | true | true | false |  | task -> glob -> grep -> read -> grep -> read -> grep -> glob | 10,735 | 56,320 | 84.0% | 1,199 | 9,536 | 0 |
