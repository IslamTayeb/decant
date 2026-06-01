# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-mixed-t96-r4-c24-rgb-current
- Generated: 2026-06-01T04:03:43.144Z
- Topics: 96
- Recall queries: 4
- Current queries: 24
- Decoys/topic: 0

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| rgb-context | true | 28/28 | 4/4 | 24/24 | 117,218 | 143,585 | 40,225 | 103,360 | 5,128 | 13,525 | 379,996 | 36,271 | 1,015,588 | 870,504 | $1.92 | $0.91 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| rgb-context | current | c01_current_packet_1 | true |  |  |  | 13,525 |
| rgb-context | recall | q01_checkout_idempotency_1 | true |  |  |  | 13,255 |
| rgb-context | current | c02_current_packet_2 | true |  |  |  | 724 |
| rgb-context | recall | q02_session_rotation_3 | true |  |  |  | 13,256 |
| rgb-context | current | c03_current_packet_3 | true |  |  |  | 725 |
| rgb-context | recall | q03_webhook_replay_protection_6 | true |  |  |  | 13,257 |
| rgb-context | current | c04_current_packet_4 | true |  |  |  | 13,520 |
| rgb-context | recall | q04_tenant_config_snapshots_8 | true |  |  |  | 457 |
| rgb-context | current | c05_current_packet_5 | true |  |  |  | 13,525 |
| rgb-context | current | c06_current_packet_6 | true |  |  |  | 717 |
| rgb-context | current | c07_current_packet_7 | true |  |  |  | 725 |
| rgb-context | current | c08_current_packet_8 | true |  |  |  | 13,524 |
| rgb-context | current | c09_current_packet_9 | true |  |  |  | 725 |
| rgb-context | current | c10_current_packet_10 | true |  |  |  | 13,520 |
| rgb-context | current | c11_current_packet_11 | true |  |  |  | 725 |
| rgb-context | current | c12_current_packet_12 | true |  |  |  | 717 |
| rgb-context | current | c13_current_packet_13 | true |  |  |  | 725 |
| rgb-context | current | c14_current_packet_14 | true |  |  |  | 724 |
| rgb-context | current | c15_current_packet_15 | true |  |  |  | 725 |
| rgb-context | current | c16_current_packet_16 | true |  |  |  | 9,936 |
| rgb-context | current | c17_current_packet_17 | true |  |  |  | 725 |
| rgb-context | current | c18_current_packet_18 | true |  |  |  | 717 |
| rgb-context | current | c19_current_packet_19 | true |  |  |  | 725 |
| rgb-context | current | c20_current_packet_20 | true |  |  |  | 724 |
| rgb-context | current | c21_current_packet_21 | true |  |  |  | 13,525 |
| rgb-context | current | c22_current_packet_22 | true |  |  |  | 720 |
| rgb-context | current | c23_current_packet_23 | true |  |  |  | 725 |
| rgb-context | current | c24_current_packet_24 | true |  |  |  | 717 |

