# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-mixed-t96-r4-c48-rgb
- Generated: 2026-06-01T04:18:01.300Z
- Topics: 96
- Recall queries: 4
- Current queries: 48
- Decoys/topic: 0

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| rgb-context | true | 52/52 | 4/4 | 48/48 | 88,497 | 156,881 | 25,105 | 131,776 | 3,017 | 11,920 | 623,109 | 29,261 | 1,521,572 | 1,404,528 | $1.42 | $1.15 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| rgb-context | current | c01_current_packet_1 | true |  |  |  | 8,337 |
| rgb-context | recall | q01_checkout_idempotency_1 | true |  |  |  | 8,067 |
| rgb-context | current | c02_current_packet_2 | true |  |  |  | 656 |
| rgb-context | recall | q02_session_rotation_3 | true |  |  |  | 8,068 |
| rgb-context | current | c03_current_packet_3 | true |  |  |  | 8,337 |
| rgb-context | recall | q03_webhook_replay_protection_6 | true |  |  |  | 8,069 |
| rgb-context | current | c04_current_packet_4 | true |  |  |  | 11,916 |
| rgb-context | recall | q04_tenant_config_snapshots_8 | true |  |  |  | 901 |
| rgb-context | current | c05_current_packet_5 | true |  |  |  | 657 |
| rgb-context | current | c06_current_packet_6 | true |  |  |  | 649 |
| rgb-context | current | c07_current_packet_7 | true |  |  |  | 657 |
| rgb-context | current | c08_current_packet_8 | true |  |  |  | 11,920 |
| rgb-context | current | c09_current_packet_9 | true |  |  |  | 1,169 |
| rgb-context | current | c10_current_packet_10 | true |  |  |  | 652 |
| rgb-context | current | c11_current_packet_11 | true |  |  |  | 657 |
| rgb-context | current | c12_current_packet_12 | true |  |  |  | 649 |
| rgb-context | current | c13_current_packet_13 | true |  |  |  | 8,337 |
| rgb-context | current | c14_current_packet_14 | true |  |  |  | 656 |
| rgb-context | current | c15_current_packet_15 | true |  |  |  | 1,169 |
| rgb-context | current | c16_current_packet_16 | true |  |  |  | 652 |
| rgb-context | current | c17_current_packet_17 | true |  |  |  | 1,169 |
| rgb-context | current | c18_current_packet_18 | true |  |  |  | 1,161 |
| rgb-context | current | c19_current_packet_19 | true |  |  |  | 657 |
| rgb-context | current | c20_current_packet_20 | true |  |  |  | 8,336 |
| rgb-context | current | c21_current_packet_21 | true |  |  |  | 1,169 |
| rgb-context | current | c22_current_packet_22 | true |  |  |  | 652 |
| rgb-context | current | c23_current_packet_23 | true |  |  |  | 1,169 |
| rgb-context | current | c24_current_packet_24 | true |  |  |  | 1,161 |
| rgb-context | current | c25_current_packet_25 | true |  |  |  | 8,337 |
| rgb-context | current | c26_current_packet_26 | true |  |  |  | 11,920 |
| rgb-context | current | c27_current_packet_27 | true |  |  |  | 8,337 |
| rgb-context | current | c28_current_packet_28 | true |  |  |  | 652 |
| rgb-context | current | c29_current_packet_29 | true |  |  |  | 1,169 |
| rgb-context | current | c30_current_packet_30 | true |  |  |  | 1,161 |
| rgb-context | current | c31_current_packet_31 | true |  |  |  | 657 |
| rgb-context | current | c32_current_packet_32 | true |  |  |  | 1,168 |
| rgb-context | current | c33_current_packet_33 | true |  |  |  | 1,169 |
| rgb-context | current | c34_current_packet_34 | true |  |  |  | 652 |
| rgb-context | current | c35_current_packet_35 | true |  |  |  | 657 |
| rgb-context | current | c36_current_packet_36 | true |  |  |  | 649 |
| rgb-context | current | c37_current_packet_37 | true |  |  |  | 657 |
| rgb-context | current | c38_current_packet_38 | true |  |  |  | 11,920 |
| rgb-context | current | c39_current_packet_39 | true |  |  |  | 1,169 |
| rgb-context | current | c40_current_packet_40 | true |  |  |  | 652 |
| rgb-context | current | c41_current_packet_41 | true |  |  |  | 1,169 |
| rgb-context | current | c42_current_packet_42 | true |  |  |  | 1,161 |
| rgb-context | current | c43_current_packet_43 | true |  |  |  | 1,169 |
| rgb-context | current | c44_current_packet_44 | true |  |  |  | 1,168 |
| rgb-context | current | c45_current_packet_45 | true |  |  |  | 657 |
| rgb-context | current | c46_current_packet_46 | true |  |  |  | 652 |
| rgb-context | current | c47_current_packet_47 | true |  |  |  | 1,169 |
| rgb-context | current | c48_current_packet_48 | true |  |  |  | 1,161 |

