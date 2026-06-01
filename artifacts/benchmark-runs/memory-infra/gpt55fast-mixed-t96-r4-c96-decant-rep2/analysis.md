# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-mixed-t96-r4-c96-decant-rep2
- Generated: 2026-06-01T05:12:15.173Z
- Topics: 96
- Recall queries: 4
- Current queries: 96
- Decoys/topic: 0

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| decant-direct | true | 100/100 | 4/4 | 96/96 | 86,356 | 89,954 | 6,530 | 83,424 | 900 | 4,882 | 514,375 | 0 | 0 | 0 | $1.52 | $0.86 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| decant-direct | current | c01_current_packet_1 | true |  |  |  | 786 |
| decant-direct | recall | q01_checkout_idempotency_1 | true |  | billing retry backoff | session_lookup | 1,589 |
| decant-direct | current | c02_current_packet_2 | true |  |  |  | 785 |
| decant-direct | recall | q02_session_rotation_3 | true |  | login page copy round 3 | session_lookup | 1,604 |
| decant-direct | current | c03_current_packet_3 | true |  |  |  | 786 |
| decant-direct | recall | q03_webhook_replay_protection_6 | true |  | stripe retry cosmetics round 6 | session_lookup | 1,633 |
| decant-direct | current | c04_current_packet_4 | true |  |  |  | 781 |
| decant-direct | recall | q04_tenant_config_snapshots_8 | true |  | settings sidebar grouping round 8 | session_lookup | 1,704 |
| decant-direct | current | c05_current_packet_5 | true |  |  |  | 786 |
| decant-direct | current | c06_current_packet_6 | true |  |  |  | 778 |
| decant-direct | current | c07_current_packet_7 | true |  |  |  | 4,882 |
| decant-direct | current | c08_current_packet_8 | true |  |  |  | 785 |
| decant-direct | current | c09_current_packet_9 | true |  |  |  | 786 |
| decant-direct | current | c10_current_packet_10 | true |  |  |  | 781 |
| decant-direct | current | c11_current_packet_11 | true |  |  |  | 786 |
| decant-direct | current | c12_current_packet_12 | true |  |  |  | 778 |
| decant-direct | current | c13_current_packet_13 | true |  |  |  | 786 |
| decant-direct | current | c14_current_packet_14 | true |  |  |  | 785 |
| decant-direct | current | c15_current_packet_15 | true |  |  |  | 786 |
| decant-direct | current | c16_current_packet_16 | true |  |  |  | 781 |
| decant-direct | current | c17_current_packet_17 | true |  |  |  | 786 |
| decant-direct | current | c18_current_packet_18 | true |  |  |  | 778 |
| decant-direct | current | c19_current_packet_19 | true |  |  |  | 786 |
| decant-direct | current | c20_current_packet_20 | true |  |  |  | 4,881 |
| decant-direct | current | c21_current_packet_21 | true |  |  |  | 786 |
| decant-direct | current | c22_current_packet_22 | true |  |  |  | 781 |
| decant-direct | current | c23_current_packet_23 | true |  |  |  | 786 |
| decant-direct | current | c24_current_packet_24 | true |  |  |  | 778 |
| decant-direct | current | c25_current_packet_25 | true |  |  |  | 786 |
| decant-direct | current | c26_current_packet_26 | true |  |  |  | 785 |
| decant-direct | current | c27_current_packet_27 | true |  |  |  | 786 |
| decant-direct | current | c28_current_packet_28 | true |  |  |  | 781 |
| decant-direct | current | c29_current_packet_29 | true |  |  |  | 786 |
| decant-direct | current | c30_current_packet_30 | true |  |  |  | 778 |
| decant-direct | current | c31_current_packet_31 | true |  |  |  | 786 |
| decant-direct | current | c32_current_packet_32 | true |  |  |  | 785 |
| decant-direct | current | c33_current_packet_33 | true |  |  |  | 786 |
| decant-direct | current | c34_current_packet_34 | true |  |  |  | 781 |
| decant-direct | current | c35_current_packet_35 | true |  |  |  | 786 |
| decant-direct | current | c36_current_packet_36 | true |  |  |  | 778 |
| decant-direct | current | c37_current_packet_37 | true |  |  |  | 786 |
| decant-direct | current | c38_current_packet_38 | true |  |  |  | 785 |
| decant-direct | current | c39_current_packet_39 | true |  |  |  | 786 |
| decant-direct | current | c40_current_packet_40 | true |  |  |  | 781 |
| decant-direct | current | c41_current_packet_41 | true |  |  |  | 786 |
| decant-direct | current | c42_current_packet_42 | true |  |  |  | 778 |
| decant-direct | current | c43_current_packet_43 | true |  |  |  | 786 |
| decant-direct | current | c44_current_packet_44 | true |  |  |  | 785 |
| decant-direct | current | c45_current_packet_45 | true |  |  |  | 786 |
| decant-direct | current | c46_current_packet_46 | true |  |  |  | 781 |
| decant-direct | current | c47_current_packet_47 | true |  |  |  | 786 |
| decant-direct | current | c48_current_packet_48 | true |  |  |  | 778 |
| decant-direct | current | c49_current_packet_49 | true |  |  |  | 786 |
| decant-direct | current | c50_current_packet_50 | true |  |  |  | 785 |
| decant-direct | current | c51_current_packet_51 | true |  |  |  | 786 |
| decant-direct | current | c52_current_packet_52 | true |  |  |  | 781 |
| decant-direct | current | c53_current_packet_53 | true |  |  |  | 786 |
| decant-direct | current | c54_current_packet_54 | true |  |  |  | 778 |
| decant-direct | current | c55_current_packet_55 | true |  |  |  | 786 |
| decant-direct | current | c56_current_packet_56 | true |  |  |  | 785 |
| decant-direct | current | c57_current_packet_57 | true |  |  |  | 786 |
| decant-direct | current | c58_current_packet_58 | true |  |  |  | 781 |
| decant-direct | current | c59_current_packet_59 | true |  |  |  | 786 |
| decant-direct | current | c60_current_packet_60 | true |  |  |  | 778 |
| decant-direct | current | c61_current_packet_61 | true |  |  |  | 786 |
| decant-direct | current | c62_current_packet_62 | true |  |  |  | 785 |
| decant-direct | current | c63_current_packet_63 | true |  |  |  | 786 |
| decant-direct | current | c64_current_packet_64 | true |  |  |  | 781 |
| decant-direct | current | c65_current_packet_65 | true |  |  |  | 786 |
| decant-direct | current | c66_current_packet_66 | true |  |  |  | 778 |
| decant-direct | current | c67_current_packet_67 | true |  |  |  | 786 |
| decant-direct | current | c68_current_packet_68 | true |  |  |  | 785 |
| decant-direct | current | c69_current_packet_69 | true |  |  |  | 786 |
| decant-direct | current | c70_current_packet_70 | true |  |  |  | 781 |
| decant-direct | current | c71_current_packet_71 | true |  |  |  | 786 |
| decant-direct | current | c72_current_packet_72 | true |  |  |  | 778 |
| decant-direct | current | c73_current_packet_73 | true |  |  |  | 786 |
| decant-direct | current | c74_current_packet_74 | true |  |  |  | 785 |
| decant-direct | current | c75_current_packet_75 | true |  |  |  | 786 |
| decant-direct | current | c76_current_packet_76 | true |  |  |  | 781 |
| decant-direct | current | c77_current_packet_77 | true |  |  |  | 786 |
| decant-direct | current | c78_current_packet_78 | true |  |  |  | 778 |
| decant-direct | current | c79_current_packet_79 | true |  |  |  | 786 |
| decant-direct | current | c80_current_packet_80 | true |  |  |  | 785 |
| decant-direct | current | c81_current_packet_81 | true |  |  |  | 786 |
| decant-direct | current | c82_current_packet_82 | true |  |  |  | 781 |
| decant-direct | current | c83_current_packet_83 | true |  |  |  | 786 |
| decant-direct | current | c84_current_packet_84 | true |  |  |  | 778 |
| decant-direct | current | c85_current_packet_85 | true |  |  |  | 786 |
| decant-direct | current | c86_current_packet_86 | true |  |  |  | 785 |
| decant-direct | current | c87_current_packet_87 | true |  |  |  | 786 |
| decant-direct | current | c88_current_packet_88 | true |  |  |  | 781 |
| decant-direct | current | c89_current_packet_89 | true |  |  |  | 786 |
| decant-direct | current | c90_current_packet_90 | true |  |  |  | 778 |
| decant-direct | current | c91_current_packet_91 | true |  |  |  | 786 |
| decant-direct | current | c92_current_packet_92 | true |  |  |  | 785 |
| decant-direct | current | c93_current_packet_93 | true |  |  |  | 786 |
| decant-direct | current | c94_current_packet_94 | true |  |  |  | 781 |
| decant-direct | current | c95_current_packet_95 | true |  |  |  | 786 |
| decant-direct | current | c96_current_packet_96 | true |  |  |  | 778 |

