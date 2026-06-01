# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-irregular-t24-r4-c12-rgb-longtimeout
- Generated: 2026-06-01T20:38:43.446Z
- Topics: 24
- Recall queries: 4
- Current queries: 12
- Decoys/topic: 0
- Irregular facts: true

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| rgb-context | true | 16/16 | 4/4 | 12/12 | 34,266 | 53,331 | 16,643 | 36,688 | 3,333 | 8,137 | 130,670 | 12,608 | 201,728 | 151,296 | $0.42 | $0.35 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| rgb-context | current | c01_current_packet_1 | true |  |  |  | 8,137 |
| rgb-context | recall | q01_checkout_idempotency_0or73qt | true |  |  |  | 4,289 |
| rgb-context | current | c02_current_packet_2 | true |  |  |  | 8,136 |
| rgb-context | recall | q02_session_rotation_1hptfzy | true |  |  |  | 7,872 |
| rgb-context | current | c03_current_packet_3 | true |  |  |  | 4,553 |
| rgb-context | recall | q03_webhook_replay_protection_134k1y8 | true |  |  |  | 4,289 |
| rgb-context | current | c04_current_packet_4 | true |  |  |  | 452 |
| rgb-context | recall | q04_tenant_config_snapshots_0s9jjxf | true |  |  |  | 193 |
| rgb-context | current | c05_current_packet_5 | true |  |  |  | 8,137 |
| rgb-context | current | c06_current_packet_6 | true |  |  |  | 449 |
| rgb-context | current | c07_current_packet_7 | true |  |  |  | 457 |
| rgb-context | current | c08_current_packet_8 | true |  |  |  | 456 |
| rgb-context | current | c09_current_packet_9 | true |  |  |  | 4,553 |
| rgb-context | current | c10_current_packet_10 | true |  |  |  | 452 |
| rgb-context | current | c11_current_packet_11 | true |  |  |  | 457 |
| rgb-context | current | c12_current_packet_12 | true |  |  |  | 449 |

