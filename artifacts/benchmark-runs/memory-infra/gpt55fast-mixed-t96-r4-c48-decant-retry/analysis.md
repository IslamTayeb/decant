# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-mixed-t96-r4-c48-decant-retry
- Generated: 2026-06-02T03:51:40.089Z
- Topics: 96
- Recall queries: 4
- Current queries: 48
- Decoys/topic: 0
- Irregular facts: false

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| decant-direct | true | 52/52 | 4/4 | 48/48 | 70,701 | 105,159 | 18,487 | 86,672 | 2,022 | 5,737 | 276,710 | 0 | 0 | 0 | $1.02 | $0.72 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| decant-direct | current | c01_current_packet_1 | true |  |  |  | 4,880 |
| decant-direct | recall | q01_checkout_idempotency_1 | true |  | billing retry backoff | session_lookup | 5,607 |
| decant-direct | current | c02_current_packet_2 | true |  |  |  | 4,879 |
| decant-direct | recall | q02_session_rotation_3 | true |  | login page copy round 3 | session_lookup | 1,510 |
| decant-direct | current | c03_current_packet_3 | true |  |  |  | 4,880 |
| decant-direct | recall | q03_webhook_replay_protection_6 | true |  | stripe retry cosmetics round 6 | session_lookup | 5,633 |
| decant-direct | current | c04_current_packet_4 | true |  |  |  | 4,875 |
| decant-direct | recall | q04_tenant_config_snapshots_8 | true |  | settings sidebar grouping round 8 | session_lookup | 5,737 |
| decant-direct | current | c05_current_packet_5 | true |  |  |  | 784 |
| decant-direct | current | c06_current_packet_6 | true |  |  |  | 776 |
| decant-direct | current | c07_current_packet_7 | true |  |  |  | 4,880 |
| decant-direct | current | c08_current_packet_8 | true |  |  |  | 783 |
| decant-direct | current | c09_current_packet_9 | true |  |  |  | 4,880 |
| decant-direct | current | c10_current_packet_10 | true |  |  |  | 779 |
| decant-direct | current | c11_current_packet_11 | true |  |  |  | 784 |
| decant-direct | current | c12_current_packet_12 | true |  |  |  | 4,872 |
| decant-direct | current | c13_current_packet_13 | true |  |  |  | 784 |
| decant-direct | current | c14_current_packet_14 | true |  |  |  | 783 |
| decant-direct | current | c15_current_packet_15 | true |  |  |  | 4,880 |
| decant-direct | current | c16_current_packet_16 | true |  |  |  | 4,875 |
| decant-direct | current | c17_current_packet_17 | true |  |  |  | 784 |
| decant-direct | current | c18_current_packet_18 | true |  |  |  | 776 |
| decant-direct | current | c19_current_packet_19 | true |  |  |  | 4,880 |
| decant-direct | current | c20_current_packet_20 | true |  |  |  | 783 |
| decant-direct | current | c21_current_packet_21 | true |  |  |  | 784 |
| decant-direct | current | c22_current_packet_22 | true |  |  |  | 779 |
| decant-direct | current | c23_current_packet_23 | true |  |  |  | 784 |
| decant-direct | current | c24_current_packet_24 | true |  |  |  | 776 |
| decant-direct | current | c25_current_packet_25 | true |  |  |  | 784 |
| decant-direct | current | c26_current_packet_26 | true |  |  |  | 783 |
| decant-direct | current | c27_current_packet_27 | true |  |  |  | 784 |
| decant-direct | current | c28_current_packet_28 | true |  |  |  | 779 |
| decant-direct | current | c29_current_packet_29 | true |  |  |  | 784 |
| decant-direct | current | c30_current_packet_30 | true |  |  |  | 4,872 |
| decant-direct | current | c31_current_packet_31 | true |  |  |  | 784 |
| decant-direct | current | c32_current_packet_32 | true |  |  |  | 4,879 |
| decant-direct | current | c33_current_packet_33 | true |  |  |  | 784 |
| decant-direct | current | c34_current_packet_34 | true |  |  |  | 779 |
| decant-direct | current | c35_current_packet_35 | true |  |  |  | 784 |
| decant-direct | current | c36_current_packet_36 | true |  |  |  | 776 |
| decant-direct | current | c37_current_packet_37 | true |  |  |  | 784 |
| decant-direct | current | c38_current_packet_38 | true |  |  |  | 783 |
| decant-direct | current | c39_current_packet_39 | true |  |  |  | 784 |
| decant-direct | current | c40_current_packet_40 | true |  |  |  | 779 |
| decant-direct | current | c41_current_packet_41 | true |  |  |  | 784 |
| decant-direct | current | c42_current_packet_42 | true |  |  |  | 776 |
| decant-direct | current | c43_current_packet_43 | true |  |  |  | 784 |
| decant-direct | current | c44_current_packet_44 | true |  |  |  | 783 |
| decant-direct | current | c45_current_packet_45 | true |  |  |  | 784 |
| decant-direct | current | c46_current_packet_46 | true |  |  |  | 779 |
| decant-direct | current | c47_current_packet_47 | true |  |  |  | 784 |
| decant-direct | current | c48_current_packet_48 | true |  |  |  | 776 |

