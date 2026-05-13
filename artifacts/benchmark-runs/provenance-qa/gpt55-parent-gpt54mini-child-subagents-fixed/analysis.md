# Provenance Blog Benchmark Analysis

- Run: /Users/islamtayeb/Documents/GitHub/mem-mould/benchmarks/provenance-qa/runs/gpt55-parent-gpt54mini-child-subagents-fixed
- Generated: 2026-05-12T23:46:44.175Z
- Passed: 10/12

| Fixture | Condition | Pass | Answer | Provenance | Tool Policy | Tool Failures | Tool Path | Input Tok | Cache Read Tok | Cache Hit | Parent Input | Child Input | Irrelevant Reads |
|---|---|---:|---:|---:|---:|---|---|---:|---:|---:|---:|---:|---:|
| auth-queue-rationale | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_lookup -> session_lookup -> session_lookup -> session_detail -> session_detail -> message_detail -> message_detail | 14,692 | 30,720 | 67.6% | 5,711 | 8,981 | 0 |
| auth-queue-rationale | subagent-rlm-transcript-search | false | true | false | true |  | task -> glob -> grep -> read -> read -> grep -> grep | 14,586 | 28,672 | 66.3% | 6,456 | 8,130 | 1 |
| blame-line-rationale | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_lookup -> session_lookup -> session_detail -> message_detail | 15,122 | 30,720 | 67.0% | 8,746 | 6,376 | 0 |
| blame-line-rationale | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> read -> read -> read -> grep -> grep -> grep -> read -> read -> grep -> grep -> grep -> grep -> read -> grep | 17,271 | 59,392 | 77.5% | 6,488 | 10,783 | 4 |
| correction-chain | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_detail -> message_detail -> message_detail | 5,574 | 38,400 | 87.3% | 1,102 | 4,472 | 0 |
| correction-chain | subagent-rlm-transcript-search | false | false | true | true |  | task -> glob -> grep -> read -> read -> read -> grep -> grep -> read | 14,680 | 33,792 | 69.7% | 6,490 | 8,190 | 2 |
| false-provenance | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_detail -> message_detail | 16,960 | 21,504 | 55.9% | 5,681 | 11,279 | 0 |
| false-provenance | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> read -> read -> read -> grep -> grep -> grep -> glob | 10,661 | 42,496 | 79.9% | 1,402 | 9,259 | 2 |
| multi-agent-synthesis | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_lookup -> session_lookup -> session_detail -> session_detail -> session_detail -> message_detail -> session_lookup -> session_lookup | 12,135 | 43,520 | 78.2% | 1,129 | 11,006 | 0 |
| multi-agent-synthesis | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> glob -> glob -> grep -> grep -> grep -> read -> read -> read -> read -> read -> grep | 15,351 | 36,864 | 70.6% | 6,523 | 8,828 | 4 |
| related-reuse | subagent-map-zoom | true | true | true | true |  | task -> session_lookup -> session_lookup -> session_lookup -> session_lookup -> session_detail -> session_detail -> message_detail | 13,358 | 37,376 | 73.7% | 5,735 | 7,623 | 0 |
| related-reuse | subagent-rlm-transcript-search | true | true | true | true |  | task -> glob -> grep -> grep -> read -> read -> read -> grep -> grep -> grep -> grep -> grep -> read -> read -> glob | 18,640 | 58,880 | 76.0% | 6,474 | 12,166 | 3 |
