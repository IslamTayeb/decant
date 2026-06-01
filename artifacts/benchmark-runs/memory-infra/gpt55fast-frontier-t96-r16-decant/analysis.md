# Memory Infra Benchmark Analysis

- Run: ./benchmarks/memory-infra/runs/gpt55fast-frontier-t96-r16-decant
- Generated: 2026-06-01T04:41:16.016Z
- Topics: 96
- Recall queries: 16
- Current queries: 0
- Decoys/topic: 0

| Condition | Pass | Query Pass | Recall Pass | Current Pass | Prep Input | Query Input | Recall Input | Current Input | Avg Query Input | Max Query Input | Query Total Tok | Carried Chars/Query | Carried Chars Total | Current Carried Chars | Prep Cost | Query Cost | Unneeded Tools | Route |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| decant-direct | true | 16/16 | 16/16 | 0/0 | 70,125 | 28,925 | 28,925 | 0 | 1,808 | 5,653 | 158,033 | 0 | 0 | 0 | $1.17 | $0.27 | 0 | true |

## Query Details

| Condition | Kind | Query | Pass | Missing | Forbidden | Tools | Input Tok |
|---|---|---|---:|---|---|---|---:|
| decant-direct | recall | q01_checkout_idempotency_1 | true |  | billing retry backoff | session_lookup | 1,523 |
| decant-direct | recall | q02_csv_import_quarantine_1 | true |  | spreadsheet column autosize | session_lookup | 1,508 |
| decant-direct | recall | q03_search_index_freshness_2 | true |  | autocomplete ranking cleanup round 2 | session_lookup | 1,555 |
| decant-direct | recall | q04_notification_fanout_2 | true |  | notification icon set round 2 | session_lookup | 5,653 |
| decant-direct | recall | q05_search_index_freshness_3 | true |  | autocomplete ranking cleanup round 3 | session_lookup | 1,555 |
| decant-direct | recall | q06_session_rotation_3 | true |  | login page copy round 3 | session_lookup | 1,531 |
| decant-direct | recall | q07_email_digest_batching_4 | true |  | template footer rewrite round 4 | session_lookup | 1,534 |
| decant-direct | recall | q08_session_rotation_4 | true |  | login page copy round 4 | session_lookup | 1,531 |
| decant-direct | recall | q09_webhook_replay_protection_5 | true |  | stripe retry cosmetics round 5 | session_lookup | 1,560 |
| decant-direct | recall | q10_audit_log_redaction_5 | true |  | audit table pagination round 5 | session_lookup | 1,552 |
| decant-direct | recall | q11_webhook_replay_protection_6 | true |  | stripe retry cosmetics round 6 | session_lookup | 1,560 |
| decant-direct | recall | q12_report_export_leases_6 | true |  | CSV heading title case round 6 | session_lookup | 1,561 |
| decant-direct | recall | q13_cache_namespace_TTL_7 | true |  | image preview freshness round 7 | session_lookup | 1,554 |
| decant-direct | recall | q14_report_export_leases_7 | true |  | CSV heading title case round 7 | session_lookup | 1,569 |
| decant-direct | recall | q15_feature_rollout_sampling_8 | true |  | analytics dashboard color round 8 | session_lookup | 1,548 |
| decant-direct | recall | q16_tenant_config_snapshots_8 | true |  | settings sidebar grouping round 8 | session_lookup | 1,631 |

