# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-mixed-t96-r4-c96-default
- Generated: 2026-06-01T04:42:08.838Z
- Topics: 96
- Recall queries: 4
- Current queries: 96
- Decoys/topic: 0

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| default-compaction | false | 96/100 | 0/4 | 96/96 | 88,192 | 185,093 | 12,709 | 172,384 | 1,851 | 7,926 | 799,070 | 11,826 | 1,182,600 | 1,135,296 | $1.71 | $1.46 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| default-compaction | current | c01_current_packet_1 | true |  |  |  | 4,342 |
| default-compaction | recall | q01_checkout_idempotency_1 | false | FLAG_CHECKOUT_IDEMPOTENCY_V3_R1; checkout_dedupes_retry_after_timeout_r1 | billing retry backoff |  | 4,072 |
| default-compaction | current | c02_current_packet_2 | true |  |  |  | 4,341 |
| default-compaction | recall | q02_session_rotation_3 | false | one-use previous-cookie grace round 3; accept every old cookie until expiry round 3; avoids logout races during rotation while still closing replay opportunities in round 3 |  |  | 4,073 |
| default-compaction | current | c03_current_packet_3 | true |  |  |  | 4,342 |
| default-compaction | recall | q03_webhook_replay_protection_6 | false | nonce ledger keyed by provider event id round 6; timestamp-only replay window round 6; blocks fast replays even when the attacker stays inside the timestamp tolerance in round 6 | stripe retry cosmetics round 6 |  | 4,074 |
| default-compaction | current | c04_current_packet_4 | true |  |  |  | 753 |
| default-compaction | recall | q04_tenant_config_snapshots_8 | false | FLAG_CONFIG_SNAPSHOT_PIN_R8; config_pins_snapshot_for_request_r8; request-scoped config snapshot round 8; live config reads at every call site round 8; keeps one request internally consistent while allowing later requests to see updates in round 8 |  |  | 490 |
| default-compaction | current | c05_current_packet_5 | true |  |  |  | 758 |
| default-compaction | current | c06_current_packet_6 | true |  |  |  | 7,918 |
| default-compaction | current | c07_current_packet_7 | true |  |  |  | 7,926 |
| default-compaction | current | c08_current_packet_8 | true |  |  |  | 7,925 |
| default-compaction | current | c09_current_packet_9 | true |  |  |  | 4,342 |
| default-compaction | current | c10_current_packet_10 | true |  |  |  | 1,265 |
| default-compaction | current | c11_current_packet_11 | true |  |  |  | 1,270 |
| default-compaction | current | c12_current_packet_12 | true |  |  |  | 1,262 |
| default-compaction | current | c13_current_packet_13 | true |  |  |  | 1,270 |
| default-compaction | current | c14_current_packet_14 | true |  |  |  | 7,925 |
| default-compaction | current | c15_current_packet_15 | true |  |  |  | 4,342 |
| default-compaction | current | c16_current_packet_16 | true |  |  |  | 1,265 |
| default-compaction | current | c17_current_packet_17 | true |  |  |  | 1,270 |
| default-compaction | current | c18_current_packet_18 | true |  |  |  | 750 |
| default-compaction | current | c19_current_packet_19 | true |  |  |  | 1,270 |
| default-compaction | current | c20_current_packet_20 | true |  |  |  | 757 |
| default-compaction | current | c21_current_packet_21 | true |  |  |  | 758 |
| default-compaction | current | c22_current_packet_22 | true |  |  |  | 753 |
| default-compaction | current | c23_current_packet_23 | true |  |  |  | 1,270 |
| default-compaction | current | c24_current_packet_24 | true |  |  |  | 1,262 |
| default-compaction | current | c25_current_packet_25 | true |  |  |  | 1,270 |
| default-compaction | current | c26_current_packet_26 | true |  |  |  | 757 |
| default-compaction | current | c27_current_packet_27 | true |  |  |  | 1,270 |
| default-compaction | current | c28_current_packet_28 | true |  |  |  | 1,265 |
| default-compaction | current | c29_current_packet_29 | true |  |  |  | 758 |
| default-compaction | current | c30_current_packet_30 | true |  |  |  | 1,262 |
| default-compaction | current | c31_current_packet_31 | true |  |  |  | 4,342 |
| default-compaction | current | c32_current_packet_32 | true |  |  |  | 757 |
| default-compaction | current | c33_current_packet_33 | true |  |  |  | 758 |
| default-compaction | current | c34_current_packet_34 | true |  |  |  | 1,265 |
| default-compaction | current | c35_current_packet_35 | true |  |  |  | 758 |
| default-compaction | current | c36_current_packet_36 | true |  |  |  | 1,262 |
| default-compaction | current | c37_current_packet_37 | true |  |  |  | 1,270 |
| default-compaction | current | c38_current_packet_38 | true |  |  |  | 757 |
| default-compaction | current | c39_current_packet_39 | true |  |  |  | 1,270 |
| default-compaction | current | c40_current_packet_40 | true |  |  |  | 1,265 |
| default-compaction | current | c41_current_packet_41 | true |  |  |  | 758 |
| default-compaction | current | c42_current_packet_42 | true |  |  |  | 750 |
| default-compaction | current | c43_current_packet_43 | true |  |  |  | 1,270 |
| default-compaction | current | c44_current_packet_44 | true |  |  |  | 757 |
| default-compaction | current | c45_current_packet_45 | true |  |  |  | 1,270 |
| default-compaction | current | c46_current_packet_46 | true |  |  |  | 1,265 |
| default-compaction | current | c47_current_packet_47 | true |  |  |  | 1,270 |
| default-compaction | current | c48_current_packet_48 | true |  |  |  | 1,262 |
| default-compaction | current | c49_current_packet_49 | true |  |  |  | 1,270 |
| default-compaction | current | c50_current_packet_50 | true |  |  |  | 1,269 |
| default-compaction | current | c51_current_packet_51 | true |  |  |  | 1,270 |
| default-compaction | current | c52_current_packet_52 | true |  |  |  | 1,265 |
| default-compaction | current | c53_current_packet_53 | true |  |  |  | 1,270 |
| default-compaction | current | c54_current_packet_54 | true |  |  |  | 1,262 |
| default-compaction | current | c55_current_packet_55 | true |  |  |  | 1,270 |
| default-compaction | current | c56_current_packet_56 | true |  |  |  | 1,269 |
| default-compaction | current | c57_current_packet_57 | true |  |  |  | 1,270 |
| default-compaction | current | c58_current_packet_58 | true |  |  |  | 1,265 |
| default-compaction | current | c59_current_packet_59 | true |  |  |  | 1,270 |
| default-compaction | current | c60_current_packet_60 | true |  |  |  | 1,262 |
| default-compaction | current | c61_current_packet_61 | true |  |  |  | 1,270 |
| default-compaction | current | c62_current_packet_62 | true |  |  |  | 1,269 |
| default-compaction | current | c63_current_packet_63 | true |  |  |  | 1,270 |
| default-compaction | current | c64_current_packet_64 | true |  |  |  | 1,265 |
| default-compaction | current | c65_current_packet_65 | true |  |  |  | 1,270 |
| default-compaction | current | c66_current_packet_66 | true |  |  |  | 1,262 |
| default-compaction | current | c67_current_packet_67 | true |  |  |  | 7,926 |
| default-compaction | current | c68_current_packet_68 | true |  |  |  | 757 |
| default-compaction | current | c69_current_packet_69 | true |  |  |  | 758 |
| default-compaction | current | c70_current_packet_70 | true |  |  |  | 1,265 |
| default-compaction | current | c71_current_packet_71 | true |  |  |  | 1,270 |
| default-compaction | current | c72_current_packet_72 | true |  |  |  | 1,262 |
| default-compaction | current | c73_current_packet_73 | true |  |  |  | 1,270 |
| default-compaction | current | c74_current_packet_74 | true |  |  |  | 1,269 |
| default-compaction | current | c75_current_packet_75 | true |  |  |  | 758 |
| default-compaction | current | c76_current_packet_76 | true |  |  |  | 1,265 |
| default-compaction | current | c77_current_packet_77 | true |  |  |  | 1,270 |
| default-compaction | current | c78_current_packet_78 | true |  |  |  | 4,334 |
| default-compaction | current | c79_current_packet_79 | true |  |  |  | 1,270 |
| default-compaction | current | c80_current_packet_80 | true |  |  |  | 1,269 |
| default-compaction | current | c81_current_packet_81 | true |  |  |  | 1,270 |
| default-compaction | current | c82_current_packet_82 | true |  |  |  | 753 |
| default-compaction | current | c83_current_packet_83 | true |  |  |  | 1,270 |
| default-compaction | current | c84_current_packet_84 | true |  |  |  | 1,262 |
| default-compaction | current | c85_current_packet_85 | true |  |  |  | 758 |
| default-compaction | current | c86_current_packet_86 | true |  |  |  | 1,269 |
| default-compaction | current | c87_current_packet_87 | true |  |  |  | 1,270 |
| default-compaction | current | c88_current_packet_88 | true |  |  |  | 1,265 |
| default-compaction | current | c89_current_packet_89 | true |  |  |  | 1,270 |
| default-compaction | current | c90_current_packet_90 | true |  |  |  | 1,262 |
| default-compaction | current | c91_current_packet_91 | true |  |  |  | 1,270 |
| default-compaction | current | c92_current_packet_92 | true |  |  |  | 1,269 |
| default-compaction | current | c93_current_packet_93 | true |  |  |  | 7,926 |
| default-compaction | current | c94_current_packet_94 | true |  |  |  | 1,265 |
| default-compaction | current | c95_current_packet_95 | true |  |  |  | 758 |
| default-compaction | current | c96_current_packet_96 | true |  |  |  | 1,262 |

