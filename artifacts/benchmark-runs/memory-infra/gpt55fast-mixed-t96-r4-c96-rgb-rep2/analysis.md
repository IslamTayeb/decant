# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-mixed-t96-r4-c96-rgb-rep2
- Generated: 2026-06-01T05:10:40.326Z
- Topics: 96
- Recall queries: 4
- Current queries: 96
- Decoys/topic: 0

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| rgb-context | true | 100/100 | 4/4 | 96/96 | 112,165 | 230,309 | 29,509 | 200,800 | 2,303 | 13,534 | 1,359,724 | 36,287 | 3,628,700 | 3,483,552 | $1.50 | $1.94 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| rgb-context | current | c01_current_packet_1 | true |  |  |  | 9,950 |
| rgb-context | recall | q01_checkout_idempotency_1 | true |  |  |  | 9,680 |
| rgb-context | current | c02_current_packet_2 | true |  |  |  | 733 |
| rgb-context | recall | q02_session_rotation_3 | true |  |  |  | 9,681 |
| rgb-context | current | c03_current_packet_3 | true |  |  |  | 734 |
| rgb-context | recall | q03_webhook_replay_protection_6 | true |  |  |  | 9,682 |
| rgb-context | current | c04_current_packet_4 | true |  |  |  | 9,945 |
| rgb-context | recall | q04_tenant_config_snapshots_8 | true |  |  |  | 466 |
| rgb-context | current | c05_current_packet_5 | true |  |  |  | 734 |
| rgb-context | current | c06_current_packet_6 | true |  |  |  | 9,942 |
| rgb-context | current | c07_current_packet_7 | true |  |  |  | 9,950 |
| rgb-context | current | c08_current_packet_8 | true |  |  |  | 733 |
| rgb-context | current | c09_current_packet_9 | true |  |  |  | 9,950 |
| rgb-context | current | c10_current_packet_10 | true |  |  |  | 729 |
| rgb-context | current | c11_current_packet_11 | true |  |  |  | 9,950 |
| rgb-context | current | c12_current_packet_12 | true |  |  |  | 726 |
| rgb-context | current | c13_current_packet_13 | true |  |  |  | 734 |
| rgb-context | current | c14_current_packet_14 | true |  |  |  | 733 |
| rgb-context | current | c15_current_packet_15 | true |  |  |  | 734 |
| rgb-context | current | c16_current_packet_16 | true |  |  |  | 729 |
| rgb-context | current | c17_current_packet_17 | true |  |  |  | 734 |
| rgb-context | current | c18_current_packet_18 | true |  |  |  | 726 |
| rgb-context | current | c19_current_packet_19 | true |  |  |  | 9,950 |
| rgb-context | current | c20_current_packet_20 | true |  |  |  | 733 |
| rgb-context | current | c21_current_packet_21 | true |  |  |  | 734 |
| rgb-context | current | c22_current_packet_22 | true |  |  |  | 729 |
| rgb-context | current | c23_current_packet_23 | true |  |  |  | 734 |
| rgb-context | current | c24_current_packet_24 | true |  |  |  | 726 |
| rgb-context | current | c25_current_packet_25 | true |  |  |  | 734 |
| rgb-context | current | c26_current_packet_26 | true |  |  |  | 733 |
| rgb-context | current | c27_current_packet_27 | true |  |  |  | 734 |
| rgb-context | current | c28_current_packet_28 | true |  |  |  | 729 |
| rgb-context | current | c29_current_packet_29 | true |  |  |  | 734 |
| rgb-context | current | c30_current_packet_30 | true |  |  |  | 726 |
| rgb-context | current | c31_current_packet_31 | true |  |  |  | 734 |
| rgb-context | current | c32_current_packet_32 | true |  |  |  | 733 |
| rgb-context | current | c33_current_packet_33 | true |  |  |  | 734 |
| rgb-context | current | c34_current_packet_34 | true |  |  |  | 729 |
| rgb-context | current | c35_current_packet_35 | true |  |  |  | 734 |
| rgb-context | current | c36_current_packet_36 | true |  |  |  | 726 |
| rgb-context | current | c37_current_packet_37 | true |  |  |  | 734 |
| rgb-context | current | c38_current_packet_38 | true |  |  |  | 733 |
| rgb-context | current | c39_current_packet_39 | true |  |  |  | 734 |
| rgb-context | current | c40_current_packet_40 | true |  |  |  | 729 |
| rgb-context | current | c41_current_packet_41 | true |  |  |  | 734 |
| rgb-context | current | c42_current_packet_42 | true |  |  |  | 726 |
| rgb-context | current | c43_current_packet_43 | true |  |  |  | 734 |
| rgb-context | current | c44_current_packet_44 | true |  |  |  | 733 |
| rgb-context | current | c45_current_packet_45 | true |  |  |  | 734 |
| rgb-context | current | c46_current_packet_46 | true |  |  |  | 729 |
| rgb-context | current | c47_current_packet_47 | true |  |  |  | 734 |
| rgb-context | current | c48_current_packet_48 | true |  |  |  | 726 |
| rgb-context | current | c49_current_packet_49 | true |  |  |  | 734 |
| rgb-context | current | c50_current_packet_50 | true |  |  |  | 733 |
| rgb-context | current | c51_current_packet_51 | true |  |  |  | 734 |
| rgb-context | current | c52_current_packet_52 | true |  |  |  | 729 |
| rgb-context | current | c53_current_packet_53 | true |  |  |  | 734 |
| rgb-context | current | c54_current_packet_54 | true |  |  |  | 726 |
| rgb-context | current | c55_current_packet_55 | true |  |  |  | 734 |
| rgb-context | current | c56_current_packet_56 | true |  |  |  | 733 |
| rgb-context | current | c57_current_packet_57 | true |  |  |  | 734 |
| rgb-context | current | c58_current_packet_58 | true |  |  |  | 729 |
| rgb-context | current | c59_current_packet_59 | true |  |  |  | 734 |
| rgb-context | current | c60_current_packet_60 | true |  |  |  | 9,942 |
| rgb-context | current | c61_current_packet_61 | true |  |  |  | 734 |
| rgb-context | current | c62_current_packet_62 | true |  |  |  | 733 |
| rgb-context | current | c63_current_packet_63 | true |  |  |  | 734 |
| rgb-context | current | c64_current_packet_64 | true |  |  |  | 729 |
| rgb-context | current | c65_current_packet_65 | true |  |  |  | 734 |
| rgb-context | current | c66_current_packet_66 | true |  |  |  | 726 |
| rgb-context | current | c67_current_packet_67 | true |  |  |  | 734 |
| rgb-context | current | c68_current_packet_68 | true |  |  |  | 733 |
| rgb-context | current | c69_current_packet_69 | true |  |  |  | 9,950 |
| rgb-context | current | c70_current_packet_70 | true |  |  |  | 729 |
| rgb-context | current | c71_current_packet_71 | true |  |  |  | 734 |
| rgb-context | current | c72_current_packet_72 | true |  |  |  | 726 |
| rgb-context | current | c73_current_packet_73 | true |  |  |  | 734 |
| rgb-context | current | c74_current_packet_74 | true |  |  |  | 733 |
| rgb-context | current | c75_current_packet_75 | true |  |  |  | 734 |
| rgb-context | current | c76_current_packet_76 | true |  |  |  | 729 |
| rgb-context | current | c77_current_packet_77 | true |  |  |  | 734 |
| rgb-context | current | c78_current_packet_78 | true |  |  |  | 726 |
| rgb-context | current | c79_current_packet_79 | true |  |  |  | 13,534 |
| rgb-context | current | c80_current_packet_80 | true |  |  |  | 733 |
| rgb-context | current | c81_current_packet_81 | true |  |  |  | 734 |
| rgb-context | current | c82_current_packet_82 | true |  |  |  | 729 |
| rgb-context | current | c83_current_packet_83 | true |  |  |  | 734 |
| rgb-context | current | c84_current_packet_84 | true |  |  |  | 726 |
| rgb-context | current | c85_current_packet_85 | true |  |  |  | 9,950 |
| rgb-context | current | c86_current_packet_86 | true |  |  |  | 733 |
| rgb-context | current | c87_current_packet_87 | true |  |  |  | 13,534 |
| rgb-context | current | c88_current_packet_88 | true |  |  |  | 729 |
| rgb-context | current | c89_current_packet_89 | true |  |  |  | 734 |
| rgb-context | current | c90_current_packet_90 | true |  |  |  | 726 |
| rgb-context | current | c91_current_packet_91 | true |  |  |  | 734 |
| rgb-context | current | c92_current_packet_92 | true |  |  |  | 733 |
| rgb-context | current | c93_current_packet_93 | true |  |  |  | 734 |
| rgb-context | current | c94_current_packet_94 | true |  |  |  | 729 |
| rgb-context | current | c95_current_packet_95 | true |  |  |  | 734 |
| rgb-context | current | c96_current_packet_96 | true |  |  |  | 13,526 |

