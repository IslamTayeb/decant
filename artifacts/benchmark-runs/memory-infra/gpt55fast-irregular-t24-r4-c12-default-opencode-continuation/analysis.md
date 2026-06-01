# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-irregular-t24-r4-c12-default-opencode-continuation
- Generated: 2026-06-01T20:42:12.030Z
- Topics: 24
- Recall queries: 4
- Current queries: 12
- Decoys/topic: 0
- Irregular facts: true

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| default-opencode-continuation | false | 12/16 | 0/4 | 12/12 | 35,065 | 26,594 | 2,631 | 23,963 | 1,662 | 10,692 | 182,003 | 14,385 | 230,160 | 172,620 | $0.42 | $0.25 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| default-opencode-continuation | current | c01_current_packet_1 | true |  |  |  | 5,164 |
| default-opencode-continuation | recall | q01_checkout_idempotency_0or73qt | false | preserves shard-local ordering while letting unrelated carts retry independently; marker 1MLAOB9 preserved rivet isolation for case 1 | billing retry backoff stale path 0EWWZD6 |  | 710 |
| default-opencode-continuation | current | c02_current_packet_2 | true |  |  |  | 698 |
| default-opencode-continuation | recall | q02_session_rotation_1hptfzy | false | avoids logout races during rotation while still closing replay opportunities; marker 0IE2WUC preserved jigsaw isolation for case 1 | login page copy stale path 1XAPDJV |  | 337 |
| default-opencode-continuation | current | c03_current_packet_3 | true |  |  |  | 829 |
| default-opencode-continuation | recall | q03_webhook_replay_protection_134k1y8 | false | blocks fast replays even when the attacker stays inside the timestamp tolerance; marker 04AYEUU preserved umbra isolation for case 2 | stripe retry cosmetics stale path 1TS3SMX |  | 469 |
| default-opencode-continuation | current | c04_current_packet_4 | true |  |  |  | 10,692 |
| default-opencode-continuation | recall | q04_tenant_config_snapshots_0s9jjxf | false | keeps one request internally consistent while allowing later requests to see updates; marker 1J9I3GR preserved marble isolation for case 2 | settings sidebar grouping stale path 0X9D338 |  | 1,115 |
| default-opencode-continuation | current | c05_current_packet_5 | true |  |  |  | 585 |
| default-opencode-continuation | current | c06_current_packet_6 | true |  |  |  | 488 |
| default-opencode-continuation | current | c07_current_packet_7 | true |  |  |  | 1,928 |
| default-opencode-continuation | current | c08_current_packet_8 | true |  |  |  | 809 |
| default-opencode-continuation | current | c09_current_packet_9 | true |  |  |  | 713 |
| default-opencode-continuation | current | c10_current_packet_10 | true |  |  |  | 612 |
| default-opencode-continuation | current | c11_current_packet_11 | true |  |  |  | 515 |
| default-opencode-continuation | current | c12_current_packet_12 | true |  |  |  | 930 |

