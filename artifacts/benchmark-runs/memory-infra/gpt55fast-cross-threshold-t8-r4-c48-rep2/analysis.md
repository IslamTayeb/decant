# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-cross-threshold-t8-r4-c48-rep2
- Generated: 2026-06-01T23:45:07.932Z
- Topics: 8
- Recall queries: 4
- Current queries: 48
- Decoys/topic: 0
- Irregular facts: true

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| default-compaction | false | 49/52 | 1/4 | 48/48 | 13,037 | 46,125 | 7,309 | 38,816 | 887 | 2,603 | 325,041 | 5,945 | 309,140 | 285,360 | $0.15 | $0.50 | 0 | true |
| rgb-context | true | 52/52 | 4/4 | 48/48 | 12,971 | 71,109 | 9,349 | 61,760 | 1,367 | 5,537 | 304,682 | 4,132 | 214,864 | 198,336 | $0.14 | $0.60 | 0 | true |
| decant-direct | true | 52/52 | 4/4 | 48/48 | 11,528 | 56,416 | 10,704 | 45,712 | 1,085 | 5,713 | 277,337 | 0 | 0 | 0 | $0.09 | $0.51 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| default-compaction | current | c01_current_packet_1 | true |  |  |  | 2,603 |
| default-compaction | recall | q01_checkout_idempotency_0or73qt | false | preserves shard-local ordering while letting unrelated carts retry independently; marker 1MLAOB9 preserved rivet isolation for case 1 | billing retry backoff stale path 0EWWZD6 |  | 2,339 |
| default-compaction | current | c02_current_packet_2 | true |  |  |  | 2,602 |
| default-compaction | recall | q02_email_digest_batching_0ddfi0h | false | keeps quiet-hour promises without delaying every workspace behind one global clock; marker 18ZDJEH preserved dovetail isolation for case 1 | template footer rewrite stale path 0ZM2Y8U |  | 2,339 |
| default-compaction | current | c03_current_packet_3 | true |  |  |  | 555 |
| default-compaction | recall | q03_feature_rollout_sampling_02u6ks6 | true |  | analytics dashboard color stale path 0XY3AG3 |  | 2,339 |
| default-compaction | current | c04_current_packet_4 | true |  |  |  | 550 |
| default-compaction | recall | q04_notification_fanout_1o2nkc7 | false | FLAG_FANOUT_BACKPRESSURE_0ASQQC5; fanout_applies_channel_backpressure_0llus8f; per-channel bounded queue with lantern-onyx guard 19Y8GF2; unbounded global fanout array after saffron-willow rollback 1JE9FI9; prevents a slow SMS provider from exhausting memory for email and push sends; marker 05LWFVR preserved ember isolation for case 1 |  |  | 292 |
| default-compaction | current | c05_current_packet_5 | true |  |  |  | 2,603 |
| default-compaction | current | c06_current_packet_6 | true |  |  |  | 547 |
| default-compaction | current | c07_current_packet_7 | true |  |  |  | 2,603 |
| default-compaction | current | c08_current_packet_8 | true |  |  |  | 554 |
| default-compaction | current | c09_current_packet_9 | true |  |  |  | 555 |
| default-compaction | current | c10_current_packet_10 | true |  |  |  | 2,598 |
| default-compaction | current | c11_current_packet_11 | true |  |  |  | 555 |
| default-compaction | current | c12_current_packet_12 | true |  |  |  | 547 |
| default-compaction | current | c13_current_packet_13 | true |  |  |  | 2,603 |
| default-compaction | current | c14_current_packet_14 | true |  |  |  | 554 |
| default-compaction | current | c15_current_packet_15 | true |  |  |  | 555 |
| default-compaction | current | c16_current_packet_16 | true |  |  |  | 550 |
| default-compaction | current | c17_current_packet_17 | true |  |  |  | 555 |
| default-compaction | current | c18_current_packet_18 | true |  |  |  | 547 |
| default-compaction | current | c19_current_packet_19 | true |  |  |  | 555 |
| default-compaction | current | c20_current_packet_20 | true |  |  |  | 554 |
| default-compaction | current | c21_current_packet_21 | true |  |  |  | 555 |
| default-compaction | current | c22_current_packet_22 | true |  |  |  | 550 |
| default-compaction | current | c23_current_packet_23 | true |  |  |  | 555 |
| default-compaction | current | c24_current_packet_24 | true |  |  |  | 547 |
| default-compaction | current | c25_current_packet_25 | true |  |  |  | 555 |
| default-compaction | current | c26_current_packet_26 | true |  |  |  | 554 |
| default-compaction | current | c27_current_packet_27 | true |  |  |  | 555 |
| default-compaction | current | c28_current_packet_28 | true |  |  |  | 550 |
| default-compaction | current | c29_current_packet_29 | true |  |  |  | 555 |
| default-compaction | current | c30_current_packet_30 | true |  |  |  | 547 |
| default-compaction | current | c31_current_packet_31 | true |  |  |  | 555 |
| default-compaction | current | c32_current_packet_32 | true |  |  |  | 554 |
| default-compaction | current | c33_current_packet_33 | true |  |  |  | 555 |
| default-compaction | current | c34_current_packet_34 | true |  |  |  | 550 |
| default-compaction | current | c35_current_packet_35 | true |  |  |  | 555 |
| default-compaction | current | c36_current_packet_36 | true |  |  |  | 547 |
| default-compaction | current | c37_current_packet_37 | true |  |  |  | 555 |
| default-compaction | current | c38_current_packet_38 | true |  |  |  | 554 |
| default-compaction | current | c39_current_packet_39 | true |  |  |  | 555 |
| default-compaction | current | c40_current_packet_40 | true |  |  |  | 550 |
| default-compaction | current | c41_current_packet_41 | true |  |  |  | 555 |
| default-compaction | current | c42_current_packet_42 | true |  |  |  | 547 |
| default-compaction | current | c43_current_packet_43 | true |  |  |  | 555 |
| default-compaction | current | c44_current_packet_44 | true |  |  |  | 554 |
| default-compaction | current | c45_current_packet_45 | true |  |  |  | 555 |
| default-compaction | current | c46_current_packet_46 | true |  |  |  | 550 |
| default-compaction | current | c47_current_packet_47 | true |  |  |  | 555 |
| default-compaction | current | c48_current_packet_48 | true |  |  |  | 547 |
| rgb-context | current | c01_current_packet_1 | true |  |  |  | 2,217 |
| rgb-context | recall | q01_checkout_idempotency_0or73qt | true |  |  |  | 5,537 |
| rgb-context | current | c02_current_packet_2 | true |  |  |  | 2,216 |
| rgb-context | recall | q02_email_digest_batching_0ddfi0h | true |  |  |  | 1,953 |
| rgb-context | current | c03_current_packet_3 | true |  |  |  | 2,217 |
| rgb-context | recall | q03_feature_rollout_sampling_02u6ks6 | true |  |  |  | 1,441 |
| rgb-context | current | c04_current_packet_4 | true |  |  |  | 676 |
| rgb-context | recall | q04_notification_fanout_1o2nkc7 | true |  |  |  | 418 |
| rgb-context | current | c05_current_packet_5 | true |  |  |  | 681 |
| rgb-context | current | c06_current_packet_6 | true |  |  |  | 673 |
| rgb-context | current | c07_current_packet_7 | true |  |  |  | 2,217 |
| rgb-context | current | c08_current_packet_8 | true |  |  |  | 680 |
| rgb-context | current | c09_current_packet_9 | true |  |  |  | 2,217 |
| rgb-context | current | c10_current_packet_10 | true |  |  |  | 1,188 |
| rgb-context | current | c11_current_packet_11 | true |  |  |  | 1,193 |
| rgb-context | current | c12_current_packet_12 | true |  |  |  | 1,185 |
| rgb-context | current | c13_current_packet_13 | true |  |  |  | 2,217 |
| rgb-context | current | c14_current_packet_14 | true |  |  |  | 680 |
| rgb-context | current | c15_current_packet_15 | true |  |  |  | 681 |
| rgb-context | current | c16_current_packet_16 | true |  |  |  | 676 |
| rgb-context | current | c17_current_packet_17 | true |  |  |  | 1,193 |
| rgb-context | current | c18_current_packet_18 | true |  |  |  | 2,209 |
| rgb-context | current | c19_current_packet_19 | true |  |  |  | 1,193 |
| rgb-context | current | c20_current_packet_20 | true |  |  |  | 1,192 |
| rgb-context | current | c21_current_packet_21 | true |  |  |  | 1,193 |
| rgb-context | current | c22_current_packet_22 | true |  |  |  | 676 |
| rgb-context | current | c23_current_packet_23 | true |  |  |  | 1,193 |
| rgb-context | current | c24_current_packet_24 | true |  |  |  | 1,185 |
| rgb-context | current | c25_current_packet_25 | true |  |  |  | 2,217 |
| rgb-context | current | c26_current_packet_26 | true |  |  |  | 680 |
| rgb-context | current | c27_current_packet_27 | true |  |  |  | 2,217 |
| rgb-context | current | c28_current_packet_28 | true |  |  |  | 2,212 |
| rgb-context | current | c29_current_packet_29 | true |  |  |  | 1,193 |
| rgb-context | current | c30_current_packet_30 | true |  |  |  | 2,209 |
| rgb-context | current | c31_current_packet_31 | true |  |  |  | 681 |
| rgb-context | current | c32_current_packet_32 | true |  |  |  | 680 |
| rgb-context | current | c33_current_packet_33 | true |  |  |  | 1,193 |
| rgb-context | current | c34_current_packet_34 | true |  |  |  | 1,188 |
| rgb-context | current | c35_current_packet_35 | true |  |  |  | 1,193 |
| rgb-context | current | c36_current_packet_36 | true |  |  |  | 1,185 |
| rgb-context | current | c37_current_packet_37 | true |  |  |  | 1,193 |
| rgb-context | current | c38_current_packet_38 | true |  |  |  | 1,192 |
| rgb-context | current | c39_current_packet_39 | true |  |  |  | 1,193 |
| rgb-context | current | c40_current_packet_40 | true |  |  |  | 1,188 |
| rgb-context | current | c41_current_packet_41 | true |  |  |  | 1,193 |
| rgb-context | current | c42_current_packet_42 | true |  |  |  | 2,209 |
| rgb-context | current | c43_current_packet_43 | true |  |  |  | 681 |
| rgb-context | current | c44_current_packet_44 | true |  |  |  | 680 |
| rgb-context | current | c45_current_packet_45 | true |  |  |  | 681 |
| rgb-context | current | c46_current_packet_46 | true |  |  |  | 1,188 |
| rgb-context | current | c47_current_packet_47 | true |  |  |  | 681 |
| rgb-context | current | c48_current_packet_48 | true |  |  |  | 1,185 |
| decant-direct | current | c01_current_packet_1 | true |  |  |  | 784 |
| decant-direct | recall | q01_checkout_idempotency_0or73qt | true |  | billing retry backoff stale path 0EWWZD6 | session_lookup | 1,631 |
| decant-direct | current | c02_current_packet_2 | true |  |  |  | 783 |
| decant-direct | recall | q02_email_digest_batching_0ddfi0h | true |  | template footer rewrite stale path 0ZM2Y8U | session_lookup | 5,713 |
| decant-direct | current | c03_current_packet_3 | true |  |  |  | 4,880 |
| decant-direct | recall | q03_feature_rollout_sampling_02u6ks6 | true |  | analytics dashboard color stale path 0XY3AG3 | session_lookup | 1,630 |
| decant-direct | current | c04_current_packet_4 | true |  |  |  | 779 |
| decant-direct | recall | q04_notification_fanout_1o2nkc7 | true |  | notification icon set stale path 0KSLWE8 | session_lookup | 1,730 |
| decant-direct | current | c05_current_packet_5 | true |  |  |  | 784 |
| decant-direct | current | c06_current_packet_6 | true |  |  |  | 776 |
| decant-direct | current | c07_current_packet_7 | true |  |  |  | 784 |
| decant-direct | current | c08_current_packet_8 | true |  |  |  | 783 |
| decant-direct | current | c09_current_packet_9 | true |  |  |  | 784 |
| decant-direct | current | c10_current_packet_10 | true |  |  |  | 779 |
| decant-direct | current | c11_current_packet_11 | true |  |  |  | 784 |
| decant-direct | current | c12_current_packet_12 | true |  |  |  | 776 |
| decant-direct | current | c13_current_packet_13 | true |  |  |  | 784 |
| decant-direct | current | c14_current_packet_14 | true |  |  |  | 783 |
| decant-direct | current | c15_current_packet_15 | true |  |  |  | 784 |
| decant-direct | current | c16_current_packet_16 | true |  |  |  | 779 |
| decant-direct | current | c17_current_packet_17 | true |  |  |  | 784 |
| decant-direct | current | c18_current_packet_18 | true |  |  |  | 776 |
| decant-direct | current | c19_current_packet_19 | true |  |  |  | 784 |
| decant-direct | current | c20_current_packet_20 | true |  |  |  | 783 |
| decant-direct | current | c21_current_packet_21 | true |  |  |  | 784 |
| decant-direct | current | c22_current_packet_22 | true |  |  |  | 779 |
| decant-direct | current | c23_current_packet_23 | true |  |  |  | 784 |
| decant-direct | current | c24_current_packet_24 | true |  |  |  | 4,872 |
| decant-direct | current | c25_current_packet_25 | true |  |  |  | 784 |
| decant-direct | current | c26_current_packet_26 | true |  |  |  | 783 |
| decant-direct | current | c27_current_packet_27 | true |  |  |  | 784 |
| decant-direct | current | c28_current_packet_28 | true |  |  |  | 779 |
| decant-direct | current | c29_current_packet_29 | true |  |  |  | 784 |
| decant-direct | current | c30_current_packet_30 | true |  |  |  | 776 |
| decant-direct | current | c31_current_packet_31 | true |  |  |  | 784 |
| decant-direct | current | c32_current_packet_32 | true |  |  |  | 783 |
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

