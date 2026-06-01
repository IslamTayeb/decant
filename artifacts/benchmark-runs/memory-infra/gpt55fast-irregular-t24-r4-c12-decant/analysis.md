# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-irregular-t24-r4-c12-decant
- Generated: 2026-06-01T20:21:09.539Z
- Topics: 24
- Recall queries: 4
- Current queries: 12
- Decoys/topic: 0
- Irregular facts: true

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| decant-direct | true | 16/16 | 4/4 | 12/12 | 28,543 | 48,755 | 23,039 | 25,716 | 3,047 | 5,822 | 99,421 | 0 | 0 | 0 | $0.29 | $0.31 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| decant-direct | current | c01_current_packet_1 | true |  |  |  | 4,876 |
| decant-direct | recall | q01_checkout_idempotency_0or73qt | true |  | billing retry backoff stale path 0EWWZD6 | session_lookup | 5,745 |
| decant-direct | current | c02_current_packet_2 | true |  |  |  | 4,875 |
| decant-direct | recall | q02_session_rotation_1hptfzy | true |  | login page copy stale path 1XAPDJV | session_lookup | 5,724 |
| decant-direct | current | c03_current_packet_3 | true |  |  |  | 780 |
| decant-direct | recall | q03_webhook_replay_protection_134k1y8 | true |  | stripe retry cosmetics stale path 1TS3SMX | session_lookup | 5,748 |
| decant-direct | current | c04_current_packet_4 | true |  |  |  | 775 |
| decant-direct | recall | q04_tenant_config_snapshots_0s9jjxf | true |  | settings sidebar grouping stale path 0X9D338 | session_lookup | 5,822 |
| decant-direct | current | c05_current_packet_5 | true |  |  |  | 780 |
| decant-direct | current | c06_current_packet_6 | true |  |  |  | 772 |
| decant-direct | current | c07_current_packet_7 | true |  |  |  | 780 |
| decant-direct | current | c08_current_packet_8 | true |  |  |  | 779 |
| decant-direct | current | c09_current_packet_9 | true |  |  |  | 4,876 |
| decant-direct | current | c10_current_packet_10 | true |  |  |  | 4,871 |
| decant-direct | current | c11_current_packet_11 | true |  |  |  | 780 |
| decant-direct | current | c12_current_packet_12 | true |  |  |  | 772 |

