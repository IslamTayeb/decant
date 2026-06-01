# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-irregular-frontier-t24-r8-c24-defaults
- Generated: 2026-06-01T21:57:18.673Z
- Topics: 24
- Recall queries: 8
- Current queries: 24
- Decoys/topic: 0
- Irregular facts: true

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| default-opencode-continuation | false | 25/32 | 1/8 | 24/24 | 34,674 | 27,160 | 4,268 | 22,892 | 849 | 5,173 | 451,621 | 13,844 | 443,008 | 332,256 | $0.43 | $0.42 | 0 | true |
| default-compaction | false | 25/32 | 1/8 | 24/24 | 17,413 | 83,161 | 31,625 | 51,536 | 2,599 | 7,926 | 263,494 | 11,488 | 367,616 | 275,712 | $0.30 | $0.61 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| default-opencode-continuation | current | c01_current_packet_1 | true |  |  |  | 5,173 |
| default-opencode-continuation | recall | q01_checkout_idempotency_0or73qt | false | preserves shard-local ordering while letting unrelated carts retry independently; marker 1MLAOB9 preserved rivet isolation for case 1 | billing retry backoff stale path 0EWWZD6 |  | 719 |
| default-opencode-continuation | current | c02_current_packet_2 | true |  |  |  | 699 |
| default-opencode-continuation | recall | q02_webhook_replay_protection_12880c9 | false | blocks fast replays even when the attacker stays inside the timestamp tolerance; marker 1ICC7PT preserved indigo isolation for case 1 | stripe retry cosmetics stale path 0KVG4VQ |  | 338 |
| default-opencode-continuation | current | c03_current_packet_3 | true |  |  |  | 823 |
| default-opencode-continuation | recall | q03_notification_fanout_1o2nkc7 | false | prevents a slow SMS provider from exhausting memory for email and push sends; marker 05LWFVR preserved ember isolation for case 1 | notification icon set stale path 0KSLWE8 |  | 491 |
| default-opencode-continuation | current | c04_current_packet_4 | true |  |  |  | 949 |
| default-opencode-continuation | recall | q04_report_export_leases_166tvzv | false | lets a new worker recover abandoned exports without duplicating active work; marker 1SD23G3 preserved topaz isolation for case 1 | CSV heading title case stale path 1FXZ3V0 |  | 587 |
| default-opencode-continuation | current | c05_current_packet_5 | true |  |  |  | 569 |
| default-opencode-continuation | recall | q05_search_index_freshness_13owed6 | false | prevents a slow crawl from replacing a newer index snapshot; marker 0VNX8Q0 preserved keystone isolation for case 2 | autocomplete ranking cleanup stale path 0VILAXB |  | 726 |
| default-opencode-continuation | current | c06_current_packet_6 | true |  |  |  | 688 |
| default-opencode-continuation | recall | q06_cache_namespace_TTL_0rbc72v | false | lets each namespace set a bounded freshness budget without penalizing unrelated caches; marker 0MDQF47 preserved brisk isolation for case 2 | image preview freshness stale path 0LVN468 |  | 328 |
| default-opencode-continuation | current | c07_current_packet_7 | true |  |  |  | 810 |
| default-opencode-continuation | recall | q07_session_rotation_0o83phc | false | avoids logout races during rotation while still closing replay opportunities; marker 1QO9GRA preserved velvet isolation for case 2 | login page copy stale path 1J8WP3T |  | 478 |
| default-opencode-continuation | current | c08_current_packet_8 | true |  |  |  | 934 |
| default-opencode-continuation | recall | q08_tenant_config_snapshots_0s9jjxf | true |  | settings sidebar grouping stale path 0X9D338 |  | 601 |
| default-opencode-continuation | current | c09_current_packet_9 | true |  |  |  | 1,078 |
| default-opencode-continuation | current | c10_current_packet_10 | true |  |  |  | 1,004 |
| default-opencode-continuation | current | c11_current_packet_11 | true |  |  |  | 880 |
| default-opencode-continuation | current | c12_current_packet_12 | true |  |  |  | 783 |
| default-opencode-continuation | current | c13_current_packet_13 | true |  |  |  | 687 |
| default-opencode-continuation | current | c14_current_packet_14 | true |  |  |  | 592 |
| default-opencode-continuation | current | c15_current_packet_15 | true |  |  |  | 496 |
| default-opencode-continuation | current | c16_current_packet_16 | true |  |  |  | 907 |
| default-opencode-continuation | current | c17_current_packet_17 | true |  |  |  | 810 |
| default-opencode-continuation | current | c18_current_packet_18 | true |  |  |  | 713 |
| default-opencode-continuation | current | c19_current_packet_19 | true |  |  |  | 617 |
| default-opencode-continuation | current | c20_current_packet_20 | true |  |  |  | 522 |
| default-opencode-continuation | current | c21_current_packet_21 | true |  |  |  | 938 |
| default-opencode-continuation | current | c22_current_packet_22 | true |  |  |  | 837 |
| default-opencode-continuation | current | c23_current_packet_23 | true |  |  |  | 740 |
| default-opencode-continuation | current | c24_current_packet_24 | true |  |  |  | 643 |
| default-compaction | current | c01_current_packet_1 | true |  |  |  | 4,347 |
| default-compaction | recall | q01_checkout_idempotency_0or73qt | false | per-cart idempotency key store with amber-dovetail guard 0CPGJX8; global checkout mutex after harbor-lantern rollback 1NO7YH7; preserves shard-local ordering while letting unrelated carts retry independently; marker 1MLAOB9 preserved rivet isolation for case 1 | billing retry backoff stale path 0EWWZD6 |  | 4,083 |
| default-compaction | current | c02_current_packet_2 | true |  |  |  | 4,346 |
| default-compaction | recall | q02_webhook_replay_protection_12880c9 | false | nonce ledger keyed by provider event id with prairie-saffron guard 1IOBUZS; timestamp-only replay window after willow-cedar rollback 1RMGTNJ; blocks fast replays even when the attacker stays inside the timestamp tolerance; marker 1ICC7PT preserved indigo isolation for case 1 | stripe retry cosmetics stale path 0KVG4VQ |  | 4,082 |
| default-compaction | current | c03_current_packet_3 | true |  |  |  | 4,347 |
| default-compaction | recall | q03_notification_fanout_1o2nkc7 | false | per-channel bounded queue with lantern-onyx guard 19Y8GF2; unbounded global fanout array after saffron-willow rollback 1JE9FI9; prevents a slow SMS provider from exhausting memory for email and push sends; marker 05LWFVR preserved ember isolation for case 1 | notification icon set stale path 0KSLWE8 |  | 4,084 |
| default-compaction | current | c04_current_packet_4 | true |  |  |  | 7,926 |
| default-compaction | recall | q04_report_export_leases_166tvzv | false | expiring worker lease with compare-and-swap with cedar-fennel guard 1C8LGRE; permanent worker ownership after jigsaw-nickel rollback 1AAMBYT; lets a new worker recover abandoned exports without duplicating active work; marker 1SD23G3 preserved topaz isolation for case 1 | CSV heading title case stale path 1FXZ3V0 |  | 4,082 |
| default-compaction | current | c05_current_packet_5 | true |  |  |  | 763 |
| default-compaction | recall | q05_search_index_freshness_13owed6 | false | epoch-stamped publish barrier with rivet-umbra guard 110PIDJ; blind last-write-wins publish after amber-ember rollback 16YXNNW; prevents a slow crawl from replacing a newer index snapshot; marker 0VNX8Q0 preserved keystone isolation for case 2 | autocomplete ranking cleanup stale path 0VILAXB |  | 1,009 |
| default-compaction | current | c06_current_packet_6 | true |  |  |  | 755 |
| default-compaction | recall | q06_cache_namespace_TTL_0rbc72v | false | namespace maximum TTL cap with indigo-lantern guard 1PDKSOU; provider-wide hard-coded TTL after prairie-topaz rollback 0UHVEN5; lets each namespace set a bounded freshness budget without penalizing unrelated caches; marker 0MDQF47 preserved brisk isolation for case 2 | image preview freshness stale path 0LVN468 |  | 7,667 |
| default-compaction | current | c07_current_packet_7 | true |  |  |  | 4,347 |
| default-compaction | recall | q07_session_rotation_0o83phc | false | one-use previous-cookie grace with ember-harbor guard 1UTX5XX; accept every old cookie until expiry after lantern-prairie rollback 1M2PQ2E; avoids logout races during rotation while still closing replay opportunities; marker 1QO9GRA preserved velvet isolation for case 2 | login page copy stale path 1J8WP3T |  | 1,010 |
| default-compaction | current | c08_current_packet_8 | true |  |  |  | 1,274 |
| default-compaction | recall | q08_tenant_config_snapshots_0s9jjxf | true |  | settings sidebar grouping stale path 0X9D338 | task | 5,608 |
| default-compaction | current | c09_current_packet_9 | true |  |  |  | 763 |
| default-compaction | current | c10_current_packet_10 | true |  |  |  | 4,342 |
| default-compaction | current | c11_current_packet_11 | true |  |  |  | 763 |
| default-compaction | current | c12_current_packet_12 | true |  |  |  | 755 |
| default-compaction | current | c13_current_packet_13 | true |  |  |  | 1,275 |
| default-compaction | current | c14_current_packet_14 | true |  |  |  | 3,834 |
| default-compaction | current | c15_current_packet_15 | true |  |  |  | 763 |
| default-compaction | current | c16_current_packet_16 | true |  |  |  | 1,270 |
| default-compaction | current | c17_current_packet_17 | true |  |  |  | 1,275 |
| default-compaction | current | c18_current_packet_18 | true |  |  |  | 755 |
| default-compaction | current | c19_current_packet_19 | true |  |  |  | 3,835 |
| default-compaction | current | c20_current_packet_20 | true |  |  |  | 762 |
| default-compaction | current | c21_current_packet_21 | true |  |  |  | 763 |
| default-compaction | current | c22_current_packet_22 | true |  |  |  | 758 |
| default-compaction | current | c23_current_packet_23 | true |  |  |  | 763 |
| default-compaction | current | c24_current_packet_24 | true |  |  |  | 755 |

