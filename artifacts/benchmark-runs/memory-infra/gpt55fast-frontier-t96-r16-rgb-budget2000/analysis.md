# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-frontier-t96-r16-rgb-budget2000
- Generated: 2026-06-01T04:40:13.337Z
- Topics: 96
- Recall queries: 16
- Current queries: 0
- Decoys/topic: 0
- Artifact budget chars: 2000

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| rgb-context | false | 15/16 | 15/16 | 0/0 | 84,880 | 16,154 | 16,154 | 0 | 1,010 | 1,683 | 88,530 | 3,585 | 57,360 | 0 | $1.16 | $0.24 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| rgb-context | recall | q01_checkout_idempotency_1 | true |  |  |  | 1,680 |
| rgb-context | recall | q02_csv_import_quarantine_1 | false | FLAG_IMPORT_ROW_QUARANTINE_R1; import_quarantines_bad_rows_only_r1 |  |  | 1,679 |
| rgb-context | recall | q03_search_index_freshness_2 | true |  |  |  | 1,682 |
| rgb-context | recall | q04_notification_fanout_2 | true |  |  |  | 1,682 |
| rgb-context | recall | q05_search_index_freshness_3 | true |  |  |  | 1,682 |
| rgb-context | recall | q06_session_rotation_3 | true |  |  |  | 1,681 |
| rgb-context | recall | q07_email_digest_batching_4 | true |  |  |  | 146 |
| rgb-context | recall | q08_session_rotation_4 | true |  |  |  | 145 |
| rgb-context | recall | q09_webhook_replay_protection_5 | true |  |  |  | 146 |
| rgb-context | recall | q10_audit_log_redaction_5 | true |  |  |  | 1,683 |
| rgb-context | recall | q11_webhook_replay_protection_6 | true |  |  |  | 1,682 |
| rgb-context | recall | q12_report_export_leases_6 | true |  |  |  | 146 |
| rgb-context | recall | q13_cache_namespace_TTL_7 | true |  |  |  | 146 |
| rgb-context | recall | q14_report_export_leases_7 | true |  |  |  | 1,682 |
| rgb-context | recall | q15_feature_rollout_sampling_8 | true |  |  |  | 146 |
| rgb-context | recall | q16_tenant_config_snapshots_8 | true |  |  |  | 146 |

