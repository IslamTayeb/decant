# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-mixed-t48-r4-c24-decoy1-decant-penalty
- Generated: 2026-06-01T04:20:36.337Z
- Topics: 48
- Recall queries: 4
- Current queries: 24
- Decoys/topic: 1

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| decant-direct | true | 28/28 | 4/4 | 24/24 | 70,221 | 29,247 | 6,199 | 23,048 | 1,045 | 4,887 | 158,184 | 0 | 0 | 0 | $1.04 | $0.27 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| decant-direct | current | c01_current_packet_1 | true |  |  |  | 792 |
| decant-direct | recall | q01_checkout_idempotency_1 | true |  | billing retry backoff | session_lookup | 1,531 |
| decant-direct | current | c02_current_packet_2 | true |  |  |  | 791 |
| decant-direct | recall | q02_cache_namespace_TTL_2 | true |  | image preview freshness round 2 | session_lookup | 1,560 |
| decant-direct | current | c03_current_packet_3 | true |  |  |  | 792 |
| decant-direct | recall | q03_notification_fanout_3 | true |  | notification icon set round 3 | session_lookup | 1,563 |
| decant-direct | current | c04_current_packet_4 | true |  |  |  | 787 |
| decant-direct | recall | q04_tenant_config_snapshots_4 | true |  | settings sidebar grouping round 4 | session_lookup | 1,545 |
| decant-direct | current | c05_current_packet_5 | true |  |  |  | 792 |
| decant-direct | current | c06_current_packet_6 | true |  |  |  | 784 |
| decant-direct | current | c07_current_packet_7 | true |  |  |  | 792 |
| decant-direct | current | c08_current_packet_8 | true |  |  |  | 791 |
| decant-direct | current | c09_current_packet_9 | true |  |  |  | 792 |
| decant-direct | current | c10_current_packet_10 | true |  |  |  | 787 |
| decant-direct | current | c11_current_packet_11 | true |  |  |  | 792 |
| decant-direct | current | c12_current_packet_12 | true |  |  |  | 784 |
| decant-direct | current | c13_current_packet_13 | true |  |  |  | 792 |
| decant-direct | current | c14_current_packet_14 | true |  |  |  | 4,887 |
| decant-direct | current | c15_current_packet_15 | true |  |  |  | 792 |
| decant-direct | current | c16_current_packet_16 | true |  |  |  | 787 |
| decant-direct | current | c17_current_packet_17 | true |  |  |  | 792 |
| decant-direct | current | c18_current_packet_18 | true |  |  |  | 784 |
| decant-direct | current | c19_current_packet_19 | true |  |  |  | 792 |
| decant-direct | current | c20_current_packet_20 | true |  |  |  | 791 |
| decant-direct | current | c21_current_packet_21 | true |  |  |  | 792 |
| decant-direct | current | c22_current_packet_22 | true |  |  |  | 787 |
| decant-direct | current | c23_current_packet_23 | true |  |  |  | 792 |
| decant-direct | current | c24_current_packet_24 | true |  |  |  | 784 |

