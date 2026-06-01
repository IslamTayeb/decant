# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-threshold-irregular-t8-r4-c48-all
- Generated: 2026-06-01T21:08:50.901Z
- Topics: 8
- Recall queries: 4
- Current queries: 48
- Decoys/topic: 0
- Irregular facts: true

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| default-opencode-continuation | true | 52/52 | 4/4 | 48/48 | 12,160 | 46,380 | 9,262 | 37,118 | 892 | 7,894 | 855,203 | 5,732 | 298,064 | 275,136 | $0.14 | $0.74 | 0 | true |
| default-compaction | false | 50/52 | 2/4 | 48/48 | 19,819 | 94,479 | 8,127 | 86,352 | 1,817 | 5,999 | 321,592 | 5,227 | 271,804 | 250,896 | $0.18 | $0.72 | 0 | true |
| rgb-context | true | 52/52 | 4/4 | 48/48 | 19,351 | 88,221 | 15,037 | 73,184 | 1,697 | 5,815 | 305,439 | 4,202 | 218,504 | 201,696 | $0.17 | $0.67 | 0 | true |
| decant-direct | true | 52/52 | 4/4 | 48/48 | 11,268 | 68,639 | 10,735 | 57,904 | 1,320 | 5,732 | 277,404 | 0 | 0 | 0 | $0.09 | $0.56 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| default-opencode-continuation | current | c01_current_packet_1 | true |  |  |  | 2,829 |
| default-opencode-continuation | recall | q01_checkout_idempotency_0or73qt | true |  | billing retry backoff stale path 0EWWZD6 |  | 423 |
| default-opencode-continuation | current | c02_current_packet_2 | true |  |  |  | 939 |
| default-opencode-continuation | recall | q02_email_digest_batching_0ddfi0h | true |  | template footer rewrite stale path 0ZM2Y8U |  | 579 |
| default-opencode-continuation | current | c03_current_packet_3 | true |  |  |  | 574 |
| default-opencode-continuation | recall | q03_feature_rollout_sampling_02u6ks6 | true |  | analytics dashboard color stale path 0XY3AG3 |  | 7,894 |
| default-opencode-continuation | current | c04_current_packet_4 | true |  |  |  | 726 |
| default-opencode-continuation | recall | q04_notification_fanout_1o2nkc7 | true |  | notification icon set stale path 0KSLWE8 |  | 366 |
| default-opencode-continuation | current | c05_current_packet_5 | true |  |  |  | 881 |
| default-opencode-continuation | current | c06_current_packet_6 | true |  |  |  | 784 |
| default-opencode-continuation | current | c07_current_packet_7 | true |  |  |  | 688 |
| default-opencode-continuation | current | c08_current_packet_8 | true |  |  |  | 593 |
| default-opencode-continuation | current | c09_current_packet_9 | true |  |  |  | 497 |
| default-opencode-continuation | current | c10_current_packet_10 | true |  |  |  | 908 |
| default-opencode-continuation | current | c11_current_packet_11 | true |  |  |  | 811 |
| default-opencode-continuation | current | c12_current_packet_12 | true |  |  |  | 714 |
| default-opencode-continuation | current | c13_current_packet_13 | true |  |  |  | 618 |
| default-opencode-continuation | current | c14_current_packet_14 | true |  |  |  | 523 |
| default-opencode-continuation | current | c15_current_packet_15 | true |  |  |  | 939 |
| default-opencode-continuation | current | c16_current_packet_16 | true |  |  |  | 838 |
| default-opencode-continuation | current | c17_current_packet_17 | true |  |  |  | 741 |
| default-opencode-continuation | current | c18_current_packet_18 | true |  |  |  | 644 |
| default-opencode-continuation | current | c19_current_packet_19 | true |  |  |  | 548 |
| default-opencode-continuation | current | c20_current_packet_20 | true |  |  |  | 965 |
| default-opencode-continuation | current | c21_current_packet_21 | true |  |  |  | 869 |
| default-opencode-continuation | current | c22_current_packet_22 | true |  |  |  | 768 |
| default-opencode-continuation | current | c23_current_packet_23 | true |  |  |  | 671 |
| default-opencode-continuation | current | c24_current_packet_24 | true |  |  |  | 574 |
| default-opencode-continuation | current | c25_current_packet_25 | true |  |  |  | 478 |
| default-opencode-continuation | current | c26_current_packet_26 | true |  |  |  | 895 |
| default-opencode-continuation | current | c27_current_packet_27 | true |  |  |  | 799 |
| default-opencode-continuation | current | c28_current_packet_28 | true |  |  |  | 698 |
| default-opencode-continuation | current | c29_current_packet_29 | true |  |  |  | 601 |
| default-opencode-continuation | current | c30_current_packet_30 | true |  |  |  | 504 |
| default-opencode-continuation | current | c31_current_packet_31 | true |  |  |  | 920 |
| default-opencode-continuation | current | c32_current_packet_32 | true |  |  |  | 825 |
| default-opencode-continuation | current | c33_current_packet_33 | true |  |  |  | 729 |
| default-opencode-continuation | current | c34_current_packet_34 | true |  |  |  | 628 |
| default-opencode-continuation | current | c35_current_packet_35 | true |  |  |  | 531 |
| default-opencode-continuation | current | c36_current_packet_36 | true |  |  |  | 946 |
| default-opencode-continuation | current | c37_current_packet_37 | true |  |  |  | 850 |
| default-opencode-continuation | current | c38_current_packet_38 | true |  |  |  | 755 |
| default-opencode-continuation | current | c39_current_packet_39 | true |  |  |  | 659 |
| default-opencode-continuation | current | c40_current_packet_40 | true |  |  |  | 558 |
| default-opencode-continuation | current | c41_current_packet_41 | true |  |  |  | 973 |
| default-opencode-continuation | current | c42_current_packet_42 | true |  |  |  | 876 |
| default-opencode-continuation | current | c43_current_packet_43 | true |  |  |  | 780 |
| default-opencode-continuation | current | c44_current_packet_44 | true |  |  |  | 685 |
| default-opencode-continuation | current | c45_current_packet_45 | true |  |  |  | 589 |
| default-opencode-continuation | current | c46_current_packet_46 | true |  |  |  | 488 |
| default-opencode-continuation | current | c47_current_packet_47 | true |  |  |  | 903 |
| default-opencode-continuation | current | c48_current_packet_48 | true |  |  |  | 806 |
| default-compaction | current | c01_current_packet_1 | true |  |  |  | 2,420 |
| default-compaction | recall | q01_checkout_idempotency_0or73qt | false | preserves shard-local ordering while letting unrelated carts retry independently; marker 1MLAOB9 preserved rivet isolation for case 1 | billing retry backoff stale path 0EWWZD6 |  | 2,156 |
| default-compaction | current | c02_current_packet_2 | true |  |  |  | 1,395 |
| default-compaction | recall | q02_email_digest_batching_0ddfi0h | false | keeps quiet-hour promises without delaying every workspace behind one global clock; marker 18ZDJEH preserved dovetail isolation for case 1 | template footer rewrite stale path 0ZM2Y8U |  | 2,156 |
| default-compaction | current | c03_current_packet_3 | true |  |  |  | 1,396 |
| default-compaction | recall | q03_feature_rollout_sampling_02u6ks6 | true |  | analytics dashboard color stale path 0XY3AG3 |  | 2,156 |
| default-compaction | current | c04_current_packet_4 | true |  |  |  | 1,391 |
| default-compaction | recall | q04_notification_fanout_1o2nkc7 | true |  |  | task | 1,659 |
| default-compaction | current | c05_current_packet_5 | true |  |  |  | 1,396 |
| default-compaction | current | c06_current_packet_6 | true |  |  |  | 2,412 |
| default-compaction | current | c07_current_packet_7 | true |  |  |  | 1,396 |
| default-compaction | current | c08_current_packet_8 | true |  |  |  | 1,395 |
| default-compaction | current | c09_current_packet_9 | true |  |  |  | 2,420 |
| default-compaction | current | c10_current_packet_10 | true |  |  |  | 2,415 |
| default-compaction | current | c11_current_packet_11 | true |  |  |  | 2,420 |
| default-compaction | current | c12_current_packet_12 | true |  |  |  | 1,388 |
| default-compaction | current | c13_current_packet_13 | true |  |  |  | 1,396 |
| default-compaction | current | c14_current_packet_14 | true |  |  |  | 1,395 |
| default-compaction | current | c15_current_packet_15 | true |  |  |  | 1,908 |
| default-compaction | current | c16_current_packet_16 | true |  |  |  | 5,999 |
| default-compaction | current | c17_current_packet_17 | true |  |  |  | 1,396 |
| default-compaction | current | c18_current_packet_18 | true |  |  |  | 2,412 |
| default-compaction | current | c19_current_packet_19 | true |  |  |  | 1,908 |
| default-compaction | current | c20_current_packet_20 | true |  |  |  | 1,395 |
| default-compaction | current | c21_current_packet_21 | true |  |  |  | 1,908 |
| default-compaction | current | c22_current_packet_22 | true |  |  |  | 1,391 |
| default-compaction | current | c23_current_packet_23 | true |  |  |  | 1,396 |
| default-compaction | current | c24_current_packet_24 | true |  |  |  | 1,388 |
| default-compaction | current | c25_current_packet_25 | true |  |  |  | 1,396 |
| default-compaction | current | c26_current_packet_26 | true |  |  |  | 1,395 |
| default-compaction | current | c27_current_packet_27 | true |  |  |  | 1,396 |
| default-compaction | current | c28_current_packet_28 | true |  |  |  | 1,391 |
| default-compaction | current | c29_current_packet_29 | true |  |  |  | 1,396 |
| default-compaction | current | c30_current_packet_30 | true |  |  |  | 5,996 |
| default-compaction | current | c31_current_packet_31 | true |  |  |  | 1,396 |
| default-compaction | current | c32_current_packet_32 | true |  |  |  | 1,907 |
| default-compaction | current | c33_current_packet_33 | true |  |  |  | 1,396 |
| default-compaction | current | c34_current_packet_34 | true |  |  |  | 1,391 |
| default-compaction | current | c35_current_packet_35 | true |  |  |  | 1,396 |
| default-compaction | current | c36_current_packet_36 | true |  |  |  | 1,388 |
| default-compaction | current | c37_current_packet_37 | true |  |  |  | 1,396 |
| default-compaction | current | c38_current_packet_38 | true |  |  |  | 1,907 |
| default-compaction | current | c39_current_packet_39 | true |  |  |  | 2,420 |
| default-compaction | current | c40_current_packet_40 | true |  |  |  | 1,391 |
| default-compaction | current | c41_current_packet_41 | true |  |  |  | 1,396 |
| default-compaction | current | c42_current_packet_42 | true |  |  |  | 1,388 |
| default-compaction | current | c43_current_packet_43 | true |  |  |  | 1,396 |
| default-compaction | current | c44_current_packet_44 | true |  |  |  | 1,395 |
| default-compaction | current | c45_current_packet_45 | true |  |  |  | 1,396 |
| default-compaction | current | c46_current_packet_46 | true |  |  |  | 1,391 |
| default-compaction | current | c47_current_packet_47 | true |  |  |  | 1,908 |
| default-compaction | current | c48_current_packet_48 | true |  |  |  | 1,388 |
| rgb-context | current | c01_current_packet_1 | true |  |  |  | 2,231 |
| rgb-context | recall | q01_checkout_idempotency_0or73qt | true |  |  |  | 1,967 |
| rgb-context | current | c02_current_packet_2 | true |  |  |  | 2,230 |
| rgb-context | recall | q02_email_digest_batching_0ddfi0h | true |  |  |  | 5,551 |
| rgb-context | current | c03_current_packet_3 | true |  |  |  | 2,231 |
| rgb-context | recall | q03_feature_rollout_sampling_02u6ks6 | true |  |  |  | 1,967 |
| rgb-context | current | c04_current_packet_4 | true |  |  |  | 2,226 |
| rgb-context | recall | q04_notification_fanout_1o2nkc7 | true |  |  |  | 5,552 |
| rgb-context | current | c05_current_packet_5 | true |  |  |  | 2,231 |
| rgb-context | current | c06_current_packet_6 | true |  |  |  | 2,223 |
| rgb-context | current | c07_current_packet_7 | true |  |  |  | 1,207 |
| rgb-context | current | c08_current_packet_8 | true |  |  |  | 2,230 |
| rgb-context | current | c09_current_packet_9 | true |  |  |  | 2,231 |
| rgb-context | current | c10_current_packet_10 | true |  |  |  | 1,202 |
| rgb-context | current | c11_current_packet_11 | true |  |  |  | 1,207 |
| rgb-context | current | c12_current_packet_12 | true |  |  |  | 1,199 |
| rgb-context | current | c13_current_packet_13 | true |  |  |  | 695 |
| rgb-context | current | c14_current_packet_14 | true |  |  |  | 1,718 |
| rgb-context | current | c15_current_packet_15 | true |  |  |  | 1,207 |
| rgb-context | current | c16_current_packet_16 | true |  |  |  | 1,202 |
| rgb-context | current | c17_current_packet_17 | true |  |  |  | 1,207 |
| rgb-context | current | c18_current_packet_18 | true |  |  |  | 1,199 |
| rgb-context | current | c19_current_packet_19 | true |  |  |  | 1,207 |
| rgb-context | current | c20_current_packet_20 | true |  |  |  | 1,206 |
| rgb-context | current | c21_current_packet_21 | true |  |  |  | 1,207 |
| rgb-context | current | c22_current_packet_22 | true |  |  |  | 690 |
| rgb-context | current | c23_current_packet_23 | true |  |  |  | 1,207 |
| rgb-context | current | c24_current_packet_24 | true |  |  |  | 687 |
| rgb-context | current | c25_current_packet_25 | true |  |  |  | 2,231 |
| rgb-context | current | c26_current_packet_26 | true |  |  |  | 1,206 |
| rgb-context | current | c27_current_packet_27 | true |  |  |  | 695 |
| rgb-context | current | c28_current_packet_28 | true |  |  |  | 1,714 |
| rgb-context | current | c29_current_packet_29 | true |  |  |  | 1,719 |
| rgb-context | current | c30_current_packet_30 | true |  |  |  | 1,199 |
| rgb-context | current | c31_current_packet_31 | true |  |  |  | 1,207 |
| rgb-context | current | c32_current_packet_32 | true |  |  |  | 694 |
| rgb-context | current | c33_current_packet_33 | true |  |  |  | 1,207 |
| rgb-context | current | c34_current_packet_34 | true |  |  |  | 1,202 |
| rgb-context | current | c35_current_packet_35 | true |  |  |  | 1,207 |
| rgb-context | current | c36_current_packet_36 | true |  |  |  | 1,199 |
| rgb-context | current | c37_current_packet_37 | true |  |  |  | 695 |
| rgb-context | current | c38_current_packet_38 | true |  |  |  | 694 |
| rgb-context | current | c39_current_packet_39 | true |  |  |  | 695 |
| rgb-context | current | c40_current_packet_40 | true |  |  |  | 1,202 |
| rgb-context | current | c41_current_packet_41 | true |  |  |  | 1,207 |
| rgb-context | current | c42_current_packet_42 | true |  |  |  | 1,199 |
| rgb-context | current | c43_current_packet_43 | true |  |  |  | 695 |
| rgb-context | current | c44_current_packet_44 | true |  |  |  | 1,206 |
| rgb-context | current | c45_current_packet_45 | true |  |  |  | 1,207 |
| rgb-context | current | c46_current_packet_46 | true |  |  |  | 1,202 |
| rgb-context | current | c47_current_packet_47 | true |  |  |  | 5,815 |
| rgb-context | current | c48_current_packet_48 | true |  |  |  | 5,807 |
| decant-direct | current | c01_current_packet_1 | true |  |  |  | 782 |
| decant-direct | recall | q01_checkout_idempotency_0or73qt | true |  | billing retry backoff stale path 0EWWZD6 | session_lookup | 1,637 |
| decant-direct | current | c02_current_packet_2 | true |  |  |  | 781 |
| decant-direct | recall | q02_email_digest_batching_0ddfi0h | true |  | template footer rewrite stale path 0ZM2Y8U | session_lookup | 1,623 |
| decant-direct | current | c03_current_packet_3 | true |  |  |  | 782 |
| decant-direct | recall | q03_feature_rollout_sampling_02u6ks6 | true |  | analytics dashboard color stale path 0XY3AG3 | session_lookup | 5,732 |
| decant-direct | current | c04_current_packet_4 | true |  |  |  | 777 |
| decant-direct | recall | q04_notification_fanout_1o2nkc7 | true |  | notification icon set stale path 0KSLWE8 | session_lookup | 1,743 |
| decant-direct | current | c05_current_packet_5 | true |  |  |  | 782 |
| decant-direct | current | c06_current_packet_6 | true |  |  |  | 4,870 |
| decant-direct | current | c07_current_packet_7 | true |  |  |  | 4,878 |
| decant-direct | current | c08_current_packet_8 | true |  |  |  | 781 |
| decant-direct | current | c09_current_packet_9 | true |  |  |  | 782 |
| decant-direct | current | c10_current_packet_10 | true |  |  |  | 4,873 |
| decant-direct | current | c11_current_packet_11 | true |  |  |  | 782 |
| decant-direct | current | c12_current_packet_12 | true |  |  |  | 774 |
| decant-direct | current | c13_current_packet_13 | true |  |  |  | 782 |
| decant-direct | current | c14_current_packet_14 | true |  |  |  | 4,877 |
| decant-direct | current | c15_current_packet_15 | true |  |  |  | 782 |
| decant-direct | current | c16_current_packet_16 | true |  |  |  | 777 |
| decant-direct | current | c17_current_packet_17 | true |  |  |  | 782 |
| decant-direct | current | c18_current_packet_18 | true |  |  |  | 774 |
| decant-direct | current | c19_current_packet_19 | true |  |  |  | 782 |
| decant-direct | current | c20_current_packet_20 | true |  |  |  | 781 |
| decant-direct | current | c21_current_packet_21 | true |  |  |  | 782 |
| decant-direct | current | c22_current_packet_22 | true |  |  |  | 777 |
| decant-direct | current | c23_current_packet_23 | true |  |  |  | 782 |
| decant-direct | current | c24_current_packet_24 | true |  |  |  | 774 |
| decant-direct | current | c25_current_packet_25 | true |  |  |  | 782 |
| decant-direct | current | c26_current_packet_26 | true |  |  |  | 781 |
| decant-direct | current | c27_current_packet_27 | true |  |  |  | 782 |
| decant-direct | current | c28_current_packet_28 | true |  |  |  | 777 |
| decant-direct | current | c29_current_packet_29 | true |  |  |  | 782 |
| decant-direct | current | c30_current_packet_30 | true |  |  |  | 774 |
| decant-direct | current | c31_current_packet_31 | true |  |  |  | 782 |
| decant-direct | current | c32_current_packet_32 | true |  |  |  | 781 |
| decant-direct | current | c33_current_packet_33 | true |  |  |  | 782 |
| decant-direct | current | c34_current_packet_34 | true |  |  |  | 777 |
| decant-direct | current | c35_current_packet_35 | true |  |  |  | 782 |
| decant-direct | current | c36_current_packet_36 | true |  |  |  | 774 |
| decant-direct | current | c37_current_packet_37 | true |  |  |  | 782 |
| decant-direct | current | c38_current_packet_38 | true |  |  |  | 781 |
| decant-direct | current | c39_current_packet_39 | true |  |  |  | 782 |
| decant-direct | current | c40_current_packet_40 | true |  |  |  | 777 |
| decant-direct | current | c41_current_packet_41 | true |  |  |  | 782 |
| decant-direct | current | c42_current_packet_42 | true |  |  |  | 774 |
| decant-direct | current | c43_current_packet_43 | true |  |  |  | 782 |
| decant-direct | current | c44_current_packet_44 | true |  |  |  | 781 |
| decant-direct | current | c45_current_packet_45 | true |  |  |  | 4,878 |
| decant-direct | current | c46_current_packet_46 | true |  |  |  | 777 |
| decant-direct | current | c47_current_packet_47 | true |  |  |  | 782 |
| decant-direct | current | c48_current_packet_48 | true |  |  |  | 774 |

