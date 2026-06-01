# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-mixed-t96-r4-c24-decant-numeric-fix
- Generated: 2026-06-01T03:49:23.648Z
- Topics: 96
- Recall queries: 4
- Current queries: 24
- Decoys/topic: 0

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| decant-direct | true | 28/28 | 4/4 | 24/24 | 92,546 | 49,663 | 14,423 | 35,240 | 1,774 | 5,723 | 158,176 | 0 | 0 | 0 | $1.16 | $0.36 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| decant-direct | current | c01_current_packet_1 | true |  |  |  | 788 |
| decant-direct | recall | q01_checkout_idempotency_1 | true |  | billing retry backoff | session_lookup | 1,521 |
| decant-direct | current | c02_current_packet_2 | true |  |  |  | 4,883 |
| decant-direct | recall | q02_session_rotation_3 | true |  | login page copy round 3 | session_lookup | 1,528 |
| decant-direct | current | c03_current_packet_3 | true |  |  |  | 788 |
| decant-direct | recall | q03_webhook_replay_protection_6 | true |  | stripe retry cosmetics round 6 | session_lookup | 5,651 |
| decant-direct | current | c04_current_packet_4 | true |  |  |  | 783 |
| decant-direct | recall | q04_tenant_config_snapshots_8 | true |  | settings sidebar grouping round 8 | session_lookup | 5,723 |
| decant-direct | current | c05_current_packet_5 | true |  |  |  | 4,884 |
| decant-direct | current | c06_current_packet_6 | true |  |  |  | 780 |
| decant-direct | current | c07_current_packet_7 | true |  |  |  | 788 |
| decant-direct | current | c08_current_packet_8 | true |  |  |  | 787 |
| decant-direct | current | c09_current_packet_9 | true |  |  |  | 788 |
| decant-direct | current | c10_current_packet_10 | true |  |  |  | 783 |
| decant-direct | current | c11_current_packet_11 | true |  |  |  | 4,884 |
| decant-direct | current | c12_current_packet_12 | true |  |  |  | 780 |
| decant-direct | current | c13_current_packet_13 | true |  |  |  | 788 |
| decant-direct | current | c14_current_packet_14 | true |  |  |  | 787 |
| decant-direct | current | c15_current_packet_15 | true |  |  |  | 788 |
| decant-direct | current | c16_current_packet_16 | true |  |  |  | 783 |
| decant-direct | current | c17_current_packet_17 | true |  |  |  | 788 |
| decant-direct | current | c18_current_packet_18 | true |  |  |  | 780 |
| decant-direct | current | c19_current_packet_19 | true |  |  |  | 788 |
| decant-direct | current | c20_current_packet_20 | true |  |  |  | 787 |
| decant-direct | current | c21_current_packet_21 | true |  |  |  | 788 |
| decant-direct | current | c22_current_packet_22 | true |  |  |  | 783 |
| decant-direct | current | c23_current_packet_23 | true |  |  |  | 788 |
| decant-direct | current | c24_current_packet_24 | true |  |  |  | 4,876 |

