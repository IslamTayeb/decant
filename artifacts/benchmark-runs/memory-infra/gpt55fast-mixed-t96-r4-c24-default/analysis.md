# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-mixed-t96-r4-c24-default
- Generated: 2026-06-01T03:27:57.570Z
- Topics: 96
- Recall queries: 4
- Current queries: 24
- Decoys/topic: 0

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| default-compaction | false | 24/28 | 0/4 | 24/24 | 101,431 | 69,977 | 10,473 | 59,504 | 2,499 | 5,959 | 168,596 | 5,451 | 152,628 | 130,824 | $1.17 | $0.48 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| default-compaction | current | c01_current_packet_1 | true |  |  |  | 5,959 |
| default-compaction | recall | q01_checkout_idempotency_1 | false | FLAG_CHECKOUT_IDEMPOTENCY_V3_R1; checkout_dedupes_retry_after_timeout_r1; preserves shard-local ordering while letting unrelated carts retry independently | billing retry backoff |  | 2,105 |
| default-compaction | current | c02_current_packet_2 | true |  |  |  | 2,374 |
| default-compaction | recall | q02_session_rotation_3 | false | one-use previous-cookie grace round 3; accept every old cookie until expiry round 3; avoids logout races during rotation while still closing replay opportunities in round 3 |  |  | 5,690 |
| default-compaction | current | c03_current_packet_3 | true |  |  |  | 1,351 |
| default-compaction | recall | q03_webhook_replay_protection_6 | false | nonce ledger keyed by provider event id round 6; timestamp-only replay window round 6; blocks fast replays even when the attacker stays inside the timestamp tolerance in round 6 |  |  | 571 |
| default-compaction | current | c04_current_packet_4 | true |  |  |  | 2,370 |
| default-compaction | recall | q04_tenant_config_snapshots_8 | false | FLAG_CONFIG_SNAPSHOT_PIN_R8; config_pins_snapshot_for_request_r8; request-scoped config snapshot round 8; live config reads at every call site round 8; keeps one request internally consistent while allowing later requests to see updates in round 8 |  |  | 2,107 |
| default-compaction | current | c05_current_packet_5 | true |  |  |  | 839 |
| default-compaction | current | c06_current_packet_6 | true |  |  |  | 5,951 |
| default-compaction | current | c07_current_packet_7 | true |  |  |  | 839 |
| default-compaction | current | c08_current_packet_8 | true |  |  |  | 5,958 |
| default-compaction | current | c09_current_packet_9 | true |  |  |  | 1,351 |
| default-compaction | current | c10_current_packet_10 | true |  |  |  | 834 |
| default-compaction | current | c11_current_packet_11 | true |  |  |  | 5,959 |
| default-compaction | current | c12_current_packet_12 | true |  |  |  | 1,343 |
| default-compaction | current | c13_current_packet_13 | true |  |  |  | 839 |
| default-compaction | current | c14_current_packet_14 | true |  |  |  | 5,958 |
| default-compaction | current | c15_current_packet_15 | true |  |  |  | 1,351 |
| default-compaction | current | c16_current_packet_16 | true |  |  |  | 1,346 |
| default-compaction | current | c17_current_packet_17 | true |  |  |  | 839 |
| default-compaction | current | c18_current_packet_18 | true |  |  |  | 1,343 |
| default-compaction | current | c19_current_packet_19 | true |  |  |  | 1,351 |
| default-compaction | current | c20_current_packet_20 | true |  |  |  | 5,958 |
| default-compaction | current | c21_current_packet_21 | true |  |  |  | 1,351 |
| default-compaction | current | c22_current_packet_22 | true |  |  |  | 1,346 |
| default-compaction | current | c23_current_packet_23 | true |  |  |  | 1,351 |
| default-compaction | current | c24_current_packet_24 | true |  |  |  | 1,343 |

