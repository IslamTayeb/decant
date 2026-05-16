# Provenance Blog Benchmark Analysis

- Run: ./benchmarks/provenance-qa/runs/gpt55-blog-full-matrix-final
- Generated: 2026-05-12T23:29:27.123Z
- Passed: 23/25

| Fixture | Condition | Pass | Answer | Provenance | Tool Policy | Tool Failures | Tool Path | Input Tok | Cache Read Tok | Cache Hit | Parent Input | Child Input | Irrelevant Reads |
|---|---|---:|---:|---:|---:|---|---|---:|---:|---:|---:|---:|---:|
| auth-queue-rationale | decant-map-zoom | true | true | true | true |  | session_lookup -> session_detail -> message_detail | 3,705 | 39,424 | 91.4% | 3,705 | 0 | 0 |
| auth-queue-rationale | rlm-transcript-search | true | true | true | true |  | glob -> grep -> read | 3,932 | 38,400 | 90.7% | 3,932 | 0 | 0 |
| auth-queue-rationale | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_detail -> message_detail | 7,464 | 29,696 | 79.9% | 1,564 | 5,900 | 0 |
| auth-queue-rationale | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> grep -> read -> grep -> read -> read -> read | 12,601 | 47,616 | 79.1% | 1,356 | 11,245 | 3 |
| blame-line-rationale | decant-blame-lookup | true | true | true | true |  | blame_lookup -> session_lookup -> session_detail -> message_detail | 4,470 | 50,176 | 91.8% | 4,470 | 0 | 0 |
| blame-line-rationale | decant-map-zoom | true | true | true | true |  | session_lookup -> session_detail -> message_detail | 3,680 | 40,448 | 91.7% | 3,680 | 0 | 0 |
| blame-line-rationale | rlm-transcript-search | true | true | true | true |  | grep -> read -> glob -> grep | 5,316 | 50,176 | 90.4% | 5,316 | 0 | 0 |
| blame-line-rationale | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_detail -> message_detail | 12,088 | 26,112 | 68.4% | 1,087 | 11,001 | 0 |
| blame-line-rationale | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> grep -> read -> grep -> read -> grep | 7,041 | 54,272 | 88.5% | 1,332 | 5,709 | 1 |
| correction-chain | decant-map-zoom | true | true | true | true |  | session_lookup -> session_detail -> message_detail | 3,487 | 40,448 | 92.1% | 3,487 | 0 | 0 |
| correction-chain | rlm-transcript-search | false | true | true | false | missing:glob | grep -> read | 2,537 | 28,160 | 91.7% | 2,537 | 0 | 0 |
| correction-chain | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_detail -> message_detail | 5,107 | 32,768 | 86.5% | 1,598 | 3,509 | 0 |
| correction-chain | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> read | 4,851 | 29,184 | 85.7% | 1,749 | 3,102 | 0 |
| false-provenance | decant-map-zoom | true | true | true | true |  | session_lookup -> session_detail -> message_detail | 3,436 | 40,448 | 92.2% | 3,436 | 0 | 0 |
| false-provenance | rlm-transcript-search | true | true | true | true |  | glob -> grep -> read -> grep -> read -> read | 22,260 | 44,544 | 66.7% | 22,260 | 0 | 2 |
| false-provenance | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_detail -> message_detail | 11,798 | 26,112 | 68.9% | 1,072 | 10,726 | 0 |
| false-provenance | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> grep -> read -> grep -> read | 16,147 | 38,912 | 70.7% | 1,234 | 14,913 | 1 |
| multi-agent-synthesis | decant-map-zoom | true | true | true | true |  | session_lookup -> session_detail -> message_detail | 5,629 | 38,400 | 87.2% | 5,629 | 0 | 0 |
| multi-agent-synthesis | rlm-transcript-search | true | true | true | true |  | glob -> grep -> grep -> read -> read -> read -> grep | 5,513 | 52,224 | 90.5% | 5,513 | 0 | 2 |
| multi-agent-synthesis | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_detail -> message_detail | 7,342 | 29,696 | 80.2% | 1,045 | 6,297 | 0 |
| multi-agent-synthesis | subagent-rlm-transcript-search | false | true | false | true |  | task -> glob -> grep -> grep -> grep -> read -> grep -> read -> grep | 8,755 | 58,880 | 87.1% | 1,271 | 7,484 | 1 |
| related-reuse | decant-map-zoom | true | true | true | true |  | session_lookup -> session_detail -> message_detail | 3,627 | 40,448 | 91.8% | 3,627 | 0 | 0 |
| related-reuse | rlm-transcript-search | true | true | true | true |  | grep -> read -> grep -> glob -> read -> read -> read | 16,364 | 50,176 | 75.4% | 16,364 | 0 | 3 |
| related-reuse | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_detail -> message_detail | 7,308 | 30,720 | 80.8% | 1,055 | 6,253 | 0 |
| related-reuse | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> grep -> read -> grep -> read | 7,824 | 51,200 | 86.7% | 1,277 | 6,547 | 1 |
