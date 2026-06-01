# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-irregular-frontier-t24-r8-c24-rgb2500-decant
- Generated: 2026-06-01T21:42:28.848Z
- Topics: 24
- Recall queries: 8
- Current queries: 24
- Decoys/topic: 0
- Irregular facts: true
- Artifact budget chars: 2500

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| rgb-context | false | 24/32 | 0/8 | 24/24 | 22,817 | 63,748 | 18,972 | 44,776 | 1,992 | 3,468 | 227,517 | 7,998 | 255,936 | 191,952 | $0.34 | $0.52 | 0 | true |
| decant-direct | true | 32/32 | 8/8 | 24/24 | 30,426 | 40,305 | 17,257 | 23,048 | 1,260 | 5,732 | 198,987 | 0 | 0 | 0 | $0.26 | $0.37 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| rgb-context | current | c01_current_packet_1 | true |  |  |  | 3,468 |
| rgb-context | recall | q01_checkout_idempotency_0or73qt | false | preserves shard-local ordering while letting unrelated carts retry independently; marker 1MLAOB9 preserved rivet isolation for case 1 | distractor |  | 3,204 |
| rgb-context | current | c02_current_packet_2 | true |  |  |  | 1,419 |
| rgb-context | recall | q02_webhook_replay_protection_12880c9 | false | blocks fast replays even when the attacker stays inside the timestamp tolerance; marker 1ICC7PT preserved indigo isolation for case 1 | distractor |  | 1,155 |
| rgb-context | current | c03_current_packet_3 | true |  |  |  | 3,468 |
| rgb-context | recall | q03_notification_fanout_1o2nkc7 | false | prevents a slow SMS provider from exhausting memory for email and push sends; marker 05LWFVR preserved ember isolation for case 1 |  |  | 1,157 |
| rgb-context | current | c04_current_packet_4 | true |  |  |  | 3,463 |
| rgb-context | recall | q04_report_export_leases_166tvzv | false | lets a new worker recover abandoned exports without duplicating active work; marker 1SD23G3 preserved topaz isolation for case 1 |  |  | 1,155 |
| rgb-context | current | c05_current_packet_5 | true |  |  |  | 3,468 |
| rgb-context | recall | q05_search_index_freshness_13owed6 | false | prevents a slow crawl from replacing a newer index snapshot; marker 0VNX8Q0 preserved keystone isolation for case 2 | distractor |  | 3,202 |
| rgb-context | current | c06_current_packet_6 | true |  |  |  | 388 |
| rgb-context | recall | q06_cache_namespace_TTL_0rbc72v | false | lets each namespace set a bounded freshness budget without penalizing unrelated caches; marker 0MDQF47 preserved brisk isolation for case 2 | distractor |  | 3,204 |
| rgb-context | current | c07_current_packet_7 | true |  |  |  | 396 |
| rgb-context | recall | q07_session_rotation_0o83phc | false | avoids logout races during rotation while still closing replay opportunities; marker 1QO9GRA preserved velvet isolation for case 2 | distractor |  | 3,203 |
| rgb-context | current | c08_current_packet_8 | true |  |  |  | 2,955 |
| rgb-context | recall | q08_tenant_config_snapshots_0s9jjxf | false | keeps one request internally consistent while allowing later requests to see updates; marker 1J9I3GR preserved marble isolation for case 2 | distractor |  | 2,692 |
| rgb-context | current | c09_current_packet_9 | true |  |  |  | 1,420 |
| rgb-context | current | c10_current_packet_10 | true |  |  |  | 3,463 |
| rgb-context | current | c11_current_packet_11 | true |  |  |  | 1,420 |
| rgb-context | current | c12_current_packet_12 | true |  |  |  | 3,460 |
| rgb-context | current | c13_current_packet_13 | true |  |  |  | 3,468 |
| rgb-context | current | c14_current_packet_14 | true |  |  |  | 395 |
| rgb-context | current | c15_current_packet_15 | true |  |  |  | 396 |
| rgb-context | current | c16_current_packet_16 | true |  |  |  | 1,415 |
| rgb-context | current | c17_current_packet_17 | true |  |  |  | 396 |
| rgb-context | current | c18_current_packet_18 | true |  |  |  | 388 |
| rgb-context | current | c19_current_packet_19 | true |  |  |  | 396 |
| rgb-context | current | c20_current_packet_20 | true |  |  |  | 1,419 |
| rgb-context | current | c21_current_packet_21 | true |  |  |  | 3,468 |
| rgb-context | current | c22_current_packet_22 | true |  |  |  | 1,415 |
| rgb-context | current | c23_current_packet_23 | true |  |  |  | 1,420 |
| rgb-context | current | c24_current_packet_24 | true |  |  |  | 1,412 |
| decant-direct | current | c01_current_packet_1 | true |  |  |  | 792 |
| decant-direct | recall | q01_checkout_idempotency_0or73qt | true |  | billing retry backoff stale path 0EWWZD6 | session_lookup | 1,643 |
| decant-direct | current | c02_current_packet_2 | true |  |  |  | 791 |
| decant-direct | recall | q02_webhook_replay_protection_12880c9 | true |  | stripe retry cosmetics stale path 0KVG4VQ | session_lookup | 5,732 |
| decant-direct | current | c03_current_packet_3 | true |  |  |  | 792 |
| decant-direct | recall | q03_notification_fanout_1o2nkc7 | true |  | notification icon set stale path 0KSLWE8 | session_lookup | 1,655 |
| decant-direct | current | c04_current_packet_4 | true |  |  |  | 787 |
| decant-direct | recall | q04_report_export_leases_166tvzv | true |  | CSV heading title case stale path 1FXZ3V0 | session_lookup | 1,649 |
| decant-direct | current | c05_current_packet_5 | true |  |  |  | 792 |
| decant-direct | recall | q05_search_index_freshness_13owed6 | true |  | autocomplete ranking cleanup stale path 0VILAXB | session_lookup | 1,619 |
| decant-direct | current | c06_current_packet_6 | true |  |  |  | 784 |
| decant-direct | recall | q06_cache_namespace_TTL_0rbc72v | true |  | image preview freshness stale path 0LVN468 | session_lookup | 1,636 |
| decant-direct | current | c07_current_packet_7 | true |  |  |  | 792 |
| decant-direct | recall | q07_session_rotation_0o83phc | true |  | login page copy stale path 1J8WP3T | session_lookup | 1,624 |
| decant-direct | current | c08_current_packet_8 | true |  |  |  | 791 |
| decant-direct | recall | q08_tenant_config_snapshots_0s9jjxf | true |  | settings sidebar grouping stale path 0X9D338 | session_lookup | 1,699 |
| decant-direct | current | c09_current_packet_9 | true |  |  |  | 792 |
| decant-direct | current | c10_current_packet_10 | true |  |  |  | 787 |
| decant-direct | current | c11_current_packet_11 | true |  |  |  | 792 |
| decant-direct | current | c12_current_packet_12 | true |  |  |  | 784 |
| decant-direct | current | c13_current_packet_13 | true |  |  |  | 792 |
| decant-direct | current | c14_current_packet_14 | true |  |  |  | 4,887 |
| decant-direct | current | c15_current_packet_15 | true |  |  |  | 792 |
| decant-direct | current | c16_current_packet_16 | true |  |  |  | 787 |
| decant-direct | current | c17_current_packet_17 | true |  |  |  | 792 |
| decant-direct | current | c18_current_packet_18 | true |  |  |  | 784 |
| decant-direct | current | c19_current_packet_19 | true |  |  |  | 792 |
| decant-direct | current | c20_current_packet_20 | true |  |  |  | 791 |
| decant-direct | current | c21_current_packet_21 | true |  |  |  | 792 |
| decant-direct | current | c22_current_packet_22 | true |  |  |  | 787 |
| decant-direct | current | c23_current_packet_23 | true |  |  |  | 792 |
| decant-direct | current | c24_current_packet_24 | true |  |  |  | 784 |

