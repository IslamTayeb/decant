# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-irregular-frontier-t24-r8-c24-rgb-unbounded
- Generated: 2026-06-01T21:46:51.909Z
- Topics: 24
- Recall queries: 8
- Current queries: 24
- Decoys/topic: 0
- Irregular facts: true

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| rgb-context | true | 32/32 | 8/8 | 24/24 | 34,298 | 67,364 | 17,572 | 49,792 | 2,105 | 8,088 | 259,947 | 12,248 | 391,936 | 293,952 | $0.40 | $0.53 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| rgb-context | current | c01_current_packet_1 | true |  |  |  | 4,509 |
| rgb-context | recall | q01_checkout_idempotency_0or73qt | true |  |  |  | 4,245 |
| rgb-context | current | c02_current_packet_2 | true |  |  |  | 4,508 |
| rgb-context | recall | q02_webhook_replay_protection_12880c9 | true |  |  |  | 4,244 |
| rgb-context | current | c03_current_packet_3 | true |  |  |  | 4,509 |
| rgb-context | recall | q03_notification_fanout_1o2nkc7 | true |  |  |  | 1,174 |
| rgb-context | current | c04_current_packet_4 | true |  |  |  | 4,504 |
| rgb-context | recall | q04_report_export_leases_166tvzv | true |  |  |  | 1,172 |
| rgb-context | current | c05_current_packet_5 | true |  |  |  | 4,509 |
| rgb-context | recall | q05_search_index_freshness_13owed6 | true |  |  |  | 4,243 |
| rgb-context | current | c06_current_packet_6 | true |  |  |  | 4,501 |
| rgb-context | recall | q06_cache_namespace_TTL_0rbc72v | true |  |  |  | 1,173 |
| rgb-context | current | c07_current_packet_7 | true |  |  |  | 1,437 |
| rgb-context | recall | q07_session_rotation_0o83phc | true |  |  |  | 1,172 |
| rgb-context | current | c08_current_packet_8 | true |  |  |  | 1,436 |
| rgb-context | recall | q08_tenant_config_snapshots_0s9jjxf | true |  |  |  | 149 |
| rgb-context | current | c09_current_packet_9 | true |  |  |  | 3,997 |
| rgb-context | current | c10_current_packet_10 | true |  |  |  | 1,432 |
| rgb-context | current | c11_current_packet_11 | true |  |  |  | 413 |
| rgb-context | current | c12_current_packet_12 | true |  |  |  | 405 |
| rgb-context | current | c13_current_packet_13 | true |  |  |  | 413 |
| rgb-context | current | c14_current_packet_14 | true |  |  |  | 1,436 |
| rgb-context | current | c15_current_packet_15 | true |  |  |  | 413 |
| rgb-context | current | c16_current_packet_16 | true |  |  |  | 408 |
| rgb-context | current | c17_current_packet_17 | true |  |  |  | 413 |
| rgb-context | current | c18_current_packet_18 | true |  |  |  | 405 |
| rgb-context | current | c19_current_packet_19 | true |  |  |  | 413 |
| rgb-context | current | c20_current_packet_20 | true |  |  |  | 412 |
| rgb-context | current | c21_current_packet_21 | true |  |  |  | 413 |
| rgb-context | current | c22_current_packet_22 | true |  |  |  | 8,088 |
| rgb-context | current | c23_current_packet_23 | true |  |  |  | 413 |
| rgb-context | current | c24_current_packet_24 | true |  |  |  | 405 |

