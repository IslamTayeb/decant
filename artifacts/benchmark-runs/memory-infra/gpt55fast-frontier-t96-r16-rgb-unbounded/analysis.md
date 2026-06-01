# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-frontier-t96-r16-rgb-unbounded
- Generated: 2026-06-01T04:52:20.024Z
- Topics: 96
- Recall queries: 16
- Current queries: 0
- Decoys/topic: 0

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| rgb-context | true | 16/16 | 16/16 | 0/0 | 96,117 | 75,338 | 75,338 | 0 | 4,709 | 8,069 | 189,154 | 29,261 | 468,176 | 0 | $1.68 | $0.51 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| rgb-context | recall | q01_checkout_idempotency_1 | true |  |  |  | 8,067 |
| rgb-context | recall | q02_csv_import_quarantine_1 | true |  |  |  | 8,066 |
| rgb-context | recall | q03_search_index_freshness_2 | true |  |  |  | 389 |
| rgb-context | recall | q04_notification_fanout_2 | true |  |  |  | 8,069 |
| rgb-context | recall | q05_search_index_freshness_3 | true |  |  |  | 8,069 |
| rgb-context | recall | q06_session_rotation_3 | true |  |  |  | 8,068 |
| rgb-context | recall | q07_email_digest_batching_4 | true |  |  |  | 8,069 |
| rgb-context | recall | q08_session_rotation_4 | true |  |  |  | 388 |
| rgb-context | recall | q09_webhook_replay_protection_5 | true |  |  |  | 8,069 |
| rgb-context | recall | q10_audit_log_redaction_5 | true |  |  |  | 390 |
| rgb-context | recall | q11_webhook_replay_protection_6 | true |  |  |  | 389 |
| rgb-context | recall | q12_report_export_leases_6 | true |  |  |  | 389 |
| rgb-context | recall | q13_cache_namespace_TTL_7 | true |  |  |  | 8,069 |
| rgb-context | recall | q14_report_export_leases_7 | true |  |  |  | 8,069 |
| rgb-context | recall | q15_feature_rollout_sampling_8 | true |  |  |  | 389 |
| rgb-context | recall | q16_tenant_config_snapshots_8 | true |  |  |  | 389 |

