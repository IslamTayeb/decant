# Maintained Memory Context: 96 Real Topics

## 1. checkout idempotency
- File: `src/checkout/idempotency.ts`
- Rollout flag: `FLAG_CHECKOUT_IDEMPOTENCY_V3_R1`
- Protective test: `checkout_dedupes_retry_after_timeout_r1`
- Accepted design: per-cart idempotency key store
- Rejected design: global checkout mutex
- Why: preserves shard-local ordering while letting unrelated carts retry independently.

## 2. search index freshness
- File: `src/search/freshness.ts`
- Rollout flag: `FLAG_INDEX_EPOCH_GUARD_R1`
- Protective test: `search_rejects_stale_epoch_publish_r1`
- Accepted design: epoch-stamped publish barrier
- Rejected design: blind last-write-wins publish
- Why: prevents a slow crawl from replacing a newer index snapshot.

## 3. email digest batching
- File: `src/mail/digest.ts`
- Rollout flag: `FLAG_DIGEST_BATCH_WINDOW_R1`
- Protective test: `digest_batches_by_workspace_timezone_r1`
- Accepted design: workspace-local send window
- Rejected design: single UTC midnight cron
- Why: keeps quiet-hour promises without delaying every workspace behind one global clock.

## 4. webhook replay protection
- File: `src/webhooks/replay.ts`
- Rollout flag: `FLAG_WEBHOOK_NONCE_LEDGER_R1`
- Protective test: `webhook_rejects_reused_nonce_r1`
- Accepted design: nonce ledger keyed by provider event id
- Rejected design: timestamp-only replay window
- Why: blocks fast replays even when the attacker stays inside the timestamp tolerance.

## 5. cache namespace TTL
- File: `src/cache/namespace_ttl.ts`
- Rollout flag: `FLAG_NAMESPACE_TTL_CAP_R1`
- Protective test: `cache_caps_noisy_namespace_ttl_r1`
- Accepted design: namespace maximum TTL cap
- Rejected design: provider-wide hard-coded TTL
- Why: lets each namespace set a bounded freshness budget without penalizing unrelated caches.

## 6. feature rollout sampling
- File: `src/rollout/sampling.ts`
- Rollout flag: `FLAG_STICKY_ROLLOUT_HASH_R1`
- Protective test: `rollout_keeps_user_bucket_stable_r1`
- Accepted design: stable hash over actor and flag
- Rejected design: per-request random sampling
- Why: prevents a user from bouncing between treatment and control across refreshes.

## 7. csv import quarantine
- File: `src/imports/quarantine.ts`
- Rollout flag: `FLAG_IMPORT_ROW_QUARANTINE_R1`
- Protective test: `import_quarantines_bad_rows_only_r1`
- Accepted design: row-level quarantine ledger
- Rejected design: abort entire import on first invalid row
- Why: lets clean rows commit while preserving exact diagnostics for rejected rows.

## 8. notification fanout
- File: `src/notify/fanout.ts`
- Rollout flag: `FLAG_FANOUT_BACKPRESSURE_R1`
- Protective test: `fanout_applies_channel_backpressure_r1`
- Accepted design: per-channel bounded queue
- Rejected design: unbounded global fanout array
- Why: prevents a slow SMS provider from exhausting memory for email and push sends.

## 9. session rotation
- File: `src/session/rotation.ts`
- Rollout flag: `FLAG_SESSION_ROTATION_GRACE_R1`
- Protective test: `session_accepts_previous_cookie_once_r1`
- Accepted design: one-use previous-cookie grace
- Rejected design: accept every old cookie until expiry
- Why: avoids logout races during rotation while still closing replay opportunities.

## 10. audit log redaction
- File: `src/audit/redact.ts`
- Rollout flag: `FLAG_AUDIT_FIELD_ALLOWLIST_R1`
- Protective test: `audit_redacts_unknown_fields_r1`
- Accepted design: field allowlist redactor
- Rejected design: regex-only secret scrubber
- Why: keeps newly added sensitive fields private even before regexes are updated.

## 11. report export leases
- File: `src/reports/export_lease.ts`
- Rollout flag: `FLAG_EXPORT_LEASE_STEAL_R1`
- Protective test: `export_worker_steals_expired_lease_r1`
- Accepted design: expiring worker lease with compare-and-swap
- Rejected design: permanent worker ownership
- Why: lets a new worker recover abandoned exports without duplicating active work.

## 12. tenant config snapshots
- File: `src/config/snapshot.ts`
- Rollout flag: `FLAG_CONFIG_SNAPSHOT_PIN_R1`
- Protective test: `config_pins_snapshot_for_request_r1`
- Accepted design: request-scoped config snapshot
- Rejected design: live config reads at every call site
- Why: keeps one request internally consistent while allowing later requests to see updates.

## 13. checkout idempotency round 2
- File: `src/checkout/idempotency.ts`
- Rollout flag: `FLAG_CHECKOUT_IDEMPOTENCY_V3_R2`
- Protective test: `checkout_dedupes_retry_after_timeout_r2`
- Accepted design: per-cart idempotency key store round 2
- Rejected design: global checkout mutex round 2
- Why: preserves shard-local ordering while letting unrelated carts retry independently in round 2.

## 14. search index freshness round 2
- File: `src/search/freshness.ts`
- Rollout flag: `FLAG_INDEX_EPOCH_GUARD_R2`
- Protective test: `search_rejects_stale_epoch_publish_r2`
- Accepted design: epoch-stamped publish barrier round 2
- Rejected design: blind last-write-wins publish round 2
- Why: prevents a slow crawl from replacing a newer index snapshot in round 2.

## 15. email digest batching round 2
- File: `src/mail/digest.ts`
- Rollout flag: `FLAG_DIGEST_BATCH_WINDOW_R2`
- Protective test: `digest_batches_by_workspace_timezone_r2`
- Accepted design: workspace-local send window round 2
- Rejected design: single UTC midnight cron round 2
- Why: keeps quiet-hour promises without delaying every workspace behind one global clock in round 2.

## 16. webhook replay protection round 2
- File: `src/webhooks/replay.ts`
- Rollout flag: `FLAG_WEBHOOK_NONCE_LEDGER_R2`
- Protective test: `webhook_rejects_reused_nonce_r2`
- Accepted design: nonce ledger keyed by provider event id round 2
- Rejected design: timestamp-only replay window round 2
- Why: blocks fast replays even when the attacker stays inside the timestamp tolerance in round 2.

## 17. cache namespace TTL round 2
- File: `src/cache/namespace_ttl.ts`
- Rollout flag: `FLAG_NAMESPACE_TTL_CAP_R2`
- Protective test: `cache_caps_noisy_namespace_ttl_r2`
- Accepted design: namespace maximum TTL cap round 2
- Rejected design: provider-wide hard-coded TTL round 2
- Why: lets each namespace set a bounded freshness budget without penalizing unrelated caches in round 2.

## 18. feature rollout sampling round 2
- File: `src/rollout/sampling.ts`
- Rollout flag: `FLAG_STICKY_ROLLOUT_HASH_R2`
- Protective test: `rollout_keeps_user_bucket_stable_r2`
- Accepted design: stable hash over actor and flag round 2
- Rejected design: per-request random sampling round 2
- Why: prevents a user from bouncing between treatment and control across refreshes in round 2.

## 19. csv import quarantine round 2
- File: `src/imports/quarantine.ts`
- Rollout flag: `FLAG_IMPORT_ROW_QUARANTINE_R2`
- Protective test: `import_quarantines_bad_rows_only_r2`
- Accepted design: row-level quarantine ledger round 2
- Rejected design: abort entire import on first invalid row round 2
- Why: lets clean rows commit while preserving exact diagnostics for rejected rows in round 2.

## 20. notification fanout round 2
- File: `src/notify/fanout.ts`
- Rollout flag: `FLAG_FANOUT_BACKPRESSURE_R2`
- Protective test: `fanout_applies_channel_backpressure_r2`
- Accepted design: per-channel bounded queue round 2
- Rejected design: unbounded global fanout array round 2
- Why: prevents a slow SMS provider from exhausting memory for email and push sends in round 2.

## 21. session rotation round 2
- File: `src/session/rotation.ts`
- Rollout flag: `FLAG_SESSION_ROTATION_GRACE_R2`
- Protective test: `session_accepts_previous_cookie_once_r2`
- Accepted design: one-use previous-cookie grace round 2
- Rejected design: accept every old cookie until expiry round 2
- Why: avoids logout races during rotation while still closing replay opportunities in round 2.

## 22. audit log redaction round 2
- File: `src/audit/redact.ts`
- Rollout flag: `FLAG_AUDIT_FIELD_ALLOWLIST_R2`
- Protective test: `audit_redacts_unknown_fields_r2`
- Accepted design: field allowlist redactor round 2
- Rejected design: regex-only secret scrubber round 2
- Why: keeps newly added sensitive fields private even before regexes are updated in round 2.

## 23. report export leases round 2
- File: `src/reports/export_lease.ts`
- Rollout flag: `FLAG_EXPORT_LEASE_STEAL_R2`
- Protective test: `export_worker_steals_expired_lease_r2`
- Accepted design: expiring worker lease with compare-and-swap round 2
- Rejected design: permanent worker ownership round 2
- Why: lets a new worker recover abandoned exports without duplicating active work in round 2.

## 24. tenant config snapshots round 2
- File: `src/config/snapshot.ts`
- Rollout flag: `FLAG_CONFIG_SNAPSHOT_PIN_R2`
- Protective test: `config_pins_snapshot_for_request_r2`
- Accepted design: request-scoped config snapshot round 2
- Rejected design: live config reads at every call site round 2
- Why: keeps one request internally consistent while allowing later requests to see updates in round 2.

## 25. checkout idempotency round 3
- File: `src/checkout/idempotency.ts`
- Rollout flag: `FLAG_CHECKOUT_IDEMPOTENCY_V3_R3`
- Protective test: `checkout_dedupes_retry_after_timeout_r3`
- Accepted design: per-cart idempotency key store round 3
- Rejected design: global checkout mutex round 3
- Why: preserves shard-local ordering while letting unrelated carts retry independently in round 3.

## 26. search index freshness round 3
- File: `src/search/freshness.ts`
- Rollout flag: `FLAG_INDEX_EPOCH_GUARD_R3`
- Protective test: `search_rejects_stale_epoch_publish_r3`
- Accepted design: epoch-stamped publish barrier round 3
- Rejected design: blind last-write-wins publish round 3
- Why: prevents a slow crawl from replacing a newer index snapshot in round 3.

## 27. email digest batching round 3
- File: `src/mail/digest.ts`
- Rollout flag: `FLAG_DIGEST_BATCH_WINDOW_R3`
- Protective test: `digest_batches_by_workspace_timezone_r3`
- Accepted design: workspace-local send window round 3
- Rejected design: single UTC midnight cron round 3
- Why: keeps quiet-hour promises without delaying every workspace behind one global clock in round 3.

## 28. webhook replay protection round 3
- File: `src/webhooks/replay.ts`
- Rollout flag: `FLAG_WEBHOOK_NONCE_LEDGER_R3`
- Protective test: `webhook_rejects_reused_nonce_r3`
- Accepted design: nonce ledger keyed by provider event id round 3
- Rejected design: timestamp-only replay window round 3
- Why: blocks fast replays even when the attacker stays inside the timestamp tolerance in round 3.

## 29. cache namespace TTL round 3
- File: `src/cache/namespace_ttl.ts`
- Rollout flag: `FLAG_NAMESPACE_TTL_CAP_R3`
- Protective test: `cache_caps_noisy_namespace_ttl_r3`
- Accepted design: namespace maximum TTL cap round 3
- Rejected design: provider-wide hard-coded TTL round 3
- Why: lets each namespace set a bounded freshness budget without penalizing unrelated caches in round 3.

## 30. feature rollout sampling round 3
- File: `src/rollout/sampling.ts`
- Rollout flag: `FLAG_STICKY_ROLLOUT_HASH_R3`
- Protective test: `rollout_keeps_user_bucket_stable_r3`
- Accepted design: stable hash over actor and flag round 3
- Rejected design: per-request random sampling round 3
- Why: prevents a user from bouncing between treatment and control across refreshes in round 3.

## 31. csv import quarantine round 3
- File: `src/imports/quarantine.ts`
- Rollout flag: `FLAG_IMPORT_ROW_QUARANTINE_R3`
- Protective test: `import_quarantines_bad_rows_only_r3`
- Accepted design: row-level quarantine ledger round 3
- Rejected design: abort entire import on first invalid row round 3
- Why: lets clean rows commit while preserving exact diagnostics for rejected rows in round 3.

## 32. notification fanout round 3
- File: `src/notify/fanout.ts`
- Rollout flag: `FLAG_FANOUT_BACKPRESSURE_R3`
- Protective test: `fanout_applies_channel_backpressure_r3`
- Accepted design: per-channel bounded queue round 3
- Rejected design: unbounded global fanout array round 3
- Why: prevents a slow SMS provider from exhausting memory for email and push sends in round 3.

## 33. session rotation round 3
- File: `src/session/rotation.ts`
- Rollout flag: `FLAG_SESSION_ROTATION_GRACE_R3`
- Protective test: `session_accepts_previous_cookie_once_r3`
- Accepted design: one-use previous-cookie grace round 3
- Rejected design: accept every old cookie until expiry round 3
- Why: avoids logout races during rotation while still closing replay opportunities in round 3.

## 34. audit log redaction round 3
- File: `src/audit/redact.ts`
- Rollout flag: `FLAG_AUDIT_FIELD_ALLOWLIST_R3`
- Protective test: `audit_redacts_unknown_fields_r3`
- Accepted design: field allowlist redactor round 3
- Rejected design: regex-only secret scrubber round 3
- Why: keeps newly added sensitive fields private even before regexes are updated in round 3.

## 35. report export leases round 3
- File: `src/reports/export_lease.ts`
- Rollout flag: `FLAG_EXPORT_LEASE_STEAL_R3`
- Protective test: `export_worker_steals_expired_lease_r3`
- Accepted design: expiring worker lease with compare-and-swap round 3
- Rejected design: permanent worker ownership round 3
- Why: lets a new worker recover abandoned exports without duplicating active work in round 3.

## 36. tenant config snapshots round 3
- File: `src/config/snapshot.ts`
- Rollout flag: `FLAG_CONFIG_SNAPSHOT_PIN_R3`
- Protective test: `config_pins_snapshot_for_request_r3`
- Accepted design: request-scoped config snapshot round 3
- Rejected design: live config reads at every call site round 3
- Why: keeps one request internally consistent while allowing later requests to see updates in round 3.

## 37. checkout idempotency round 4
- File: `src/checkout/idempotency.ts`
- Rollout flag: `FLAG_CHECKOUT_IDEMPOTENCY_V3_R4`
- Protective test: `checkout_dedupes_retry_after_timeout_r4`
- Accepted design: per-cart idempotency key store round 4
- Rejected design: global checkout mutex round 4
- Why: preserves shard-local ordering while letting unrelated carts retry independently in round 4.

## 38. search index freshness round 4
- File: `src/search/freshness.ts`
- Rollout flag: `FLAG_INDEX_EPOCH_GUARD_R4`
- Protective test: `search_rejects_stale_epoch_publish_r4`
- Accepted design: epoch-stamped publish barrier round 4
- Rejected design: blind last-write-wins publish round 4
- Why: prevents a slow crawl from replacing a newer index snapshot in round 4.

## 39. email digest batching round 4
- File: `src/mail/digest.ts`
- Rollout flag: `FLAG_DIGEST_BATCH_WINDOW_R4`
- Protective test: `digest_batches_by_workspace_timezone_r4`
- Accepted design: workspace-local send window round 4
- Rejected design: single UTC midnight cron round 4
- Why: keeps quiet-hour promises without delaying every workspace behind one global clock in round 4.

## 40. webhook replay protection round 4
- File: `src/webhooks/replay.ts`
- Rollout flag: `FLAG_WEBHOOK_NONCE_LEDGER_R4`
- Protective test: `webhook_rejects_reused_nonce_r4`
- Accepted design: nonce ledger keyed by provider event id round 4
- Rejected design: timestamp-only replay window round 4
- Why: blocks fast replays even when the attacker stays inside the timestamp tolerance in round 4.

## 41. cache namespace TTL round 4
- File: `src/cache/namespace_ttl.ts`
- Rollout flag: `FLAG_NAMESPACE_TTL_CAP_R4`
- Protective test: `cache_caps_noisy_namespace_ttl_r4`
- Accepted design: namespace maximum TTL cap round 4
- Rejected design: provider-wide hard-coded TTL round 4
- Why: lets each namespace set a bounded freshness budget without penalizing unrelated caches in round 4.

## 42. feature rollout sampling round 4
- File: `src/rollout/sampling.ts`
- Rollout flag: `FLAG_STICKY_ROLLOUT_HASH_R4`
- Protective test: `rollout_keeps_user_bucket_stable_r4`
- Accepted design: stable hash over actor and flag round 4
- Rejected design: per-request random sampling round 4
- Why: prevents a user from bouncing between treatment and control across refreshes in round 4.

## 43. csv import quarantine round 4
- File: `src/imports/quarantine.ts`
- Rollout flag: `FLAG_IMPORT_ROW_QUARANTINE_R4`
- Protective test: `import_quarantines_bad_rows_only_r4`
- Accepted design: row-level quarantine ledger round 4
- Rejected design: abort entire import on first invalid row round 4
- Why: lets clean rows commit while preserving exact diagnostics for rejected rows in round 4.

## 44. notification fanout round 4
- File: `src/notify/fanout.ts`
- Rollout flag: `FLAG_FANOUT_BACKPRESSURE_R4`
- Protective test: `fanout_applies_channel_backpressure_r4`
- Accepted design: per-channel bounded queue round 4
- Rejected design: unbounded global fanout array round 4
- Why: prevents a slow SMS provider from exhausting memory for email and push sends in round 4.

## 45. session rotation round 4
- File: `src/session/rotation.ts`
- Rollout flag: `FLAG_SESSION_ROTATION_GRACE_R4`
- Protective test: `session_accepts_previous_cookie_once_r4`
- Accepted design: one-use previous-cookie grace round 4
- Rejected design: accept every old cookie until expiry round 4
- Why: avoids logout races during rotation while still closing replay opportunities in round 4.

## 46. audit log redaction round 4
- File: `src/audit/redact.ts`
- Rollout flag: `FLAG_AUDIT_FIELD_ALLOWLIST_R4`
- Protective test: `audit_redacts_unknown_fields_r4`
- Accepted design: field allowlist redactor round 4
- Rejected design: regex-only secret scrubber round 4
- Why: keeps newly added sensitive fields private even before regexes are updated in round 4.

## 47. report export leases round 4
- File: `src/reports/export_lease.ts`
- Rollout flag: `FLAG_EXPORT_LEASE_STEAL_R4`
- Protective test: `export_worker_steals_expired_lease_r4`
- Accepted design: expiring worker lease with compare-and-swap round 4
- Rejected design: permanent worker ownership round 4
- Why: lets a new worker recover abandoned exports without duplicating active work in round 4.

## 48. tenant config snapshots round 4
- File: `src/config/snapshot.ts`
- Rollout flag: `FLAG_CONFIG_SNAPSHOT_PIN_R4`
- Protective test: `config_pins_snapshot_for_request_r4`
- Accepted design: request-scoped config snapshot round 4
- Rejected design: live config reads at every call site round 4
- Why: keeps one request internally consistent while allowing later requests to see updates in round 4.

## 49. checkout idempotency round 5
- File: `src/checkout/idempotency.ts`
- Rollout flag: `FLAG_CHECKOUT_IDEMPOTENCY_V3_R5`
- Protective test: `checkout_dedupes_retry_after_timeout_r5`
- Accepted design: per-cart idempotency key store round 5
- Rejected design: global checkout mutex round 5
- Why: preserves shard-local ordering while letting unrelated carts retry independently in round 5.

## 50. search index freshness round 5
- File: `src/search/freshness.ts`
- Rollout flag: `FLAG_INDEX_EPOCH_GUARD_R5`
- Protective test: `search_rejects_stale_epoch_publish_r5`
- Accepted design: epoch-stamped publish barrier round 5
- Rejected design: blind last-write-wins publish round 5
- Why: prevents a slow crawl from replacing a newer index snapshot in round 5.

## 51. email digest batching round 5
- File: `src/mail/digest.ts`
- Rollout flag: `FLAG_DIGEST_BATCH_WINDOW_R5`
- Protective test: `digest_batches_by_workspace_timezone_r5`
- Accepted design: workspace-local send window round 5
- Rejected design: single UTC midnight cron round 5
- Why: keeps quiet-hour promises without delaying every workspace behind one global clock in round 5.

## 52. webhook replay protection round 5
- File: `src/webhooks/replay.ts`
- Rollout flag: `FLAG_WEBHOOK_NONCE_LEDGER_R5`
- Protective test: `webhook_rejects_reused_nonce_r5`
- Accepted design: nonce ledger keyed by provider event id round 5
- Rejected design: timestamp-only replay window round 5
- Why: blocks fast replays even when the attacker stays inside the timestamp tolerance in round 5.

## 53. cache namespace TTL round 5
- File: `src/cache/namespace_ttl.ts`
- Rollout flag: `FLAG_NAMESPACE_TTL_CAP_R5`
- Protective test: `cache_caps_noisy_namespace_ttl_r5`
- Accepted design: namespace maximum TTL cap round 5
- Rejected design: provider-wide hard-coded TTL round 5
- Why: lets each namespace set a bounded freshness budget without penalizing unrelated caches in round 5.

## 54. feature rollout sampling round 5
- File: `src/rollout/sampling.ts`
- Rollout flag: `FLAG_STICKY_ROLLOUT_HASH_R5`
- Protective test: `rollout_keeps_user_bucket_stable_r5`
- Accepted design: stable hash over actor and flag round 5
- Rejected design: per-request random sampling round 5
- Why: prevents a user from bouncing between treatment and control across refreshes in round 5.

## 55. csv import quarantine round 5
- File: `src/imports/quarantine.ts`
- Rollout flag: `FLAG_IMPORT_ROW_QUARANTINE_R5`
- Protective test: `import_quarantines_bad_rows_only_r5`
- Accepted design: row-level quarantine ledger round 5
- Rejected design: abort entire import on first invalid row round 5
- Why: lets clean rows commit while preserving exact diagnostics for rejected rows in round 5.

## 56. notification fanout round 5
- File: `src/notify/fanout.ts`
- Rollout flag: `FLAG_FANOUT_BACKPRESSURE_R5`
- Protective test: `fanout_applies_channel_backpressure_r5`
- Accepted design: per-channel bounded queue round 5
- Rejected design: unbounded global fanout array round 5
- Why: prevents a slow SMS provider from exhausting memory for email and push sends in round 5.

## 57. session rotation round 5
- File: `src/session/rotation.ts`
- Rollout flag: `FLAG_SESSION_ROTATION_GRACE_R5`
- Protective test: `session_accepts_previous_cookie_once_r5`
- Accepted design: one-use previous-cookie grace round 5
- Rejected design: accept every old cookie until expiry round 5
- Why: avoids logout races during rotation while still closing replay opportunities in round 5.

## 58. audit log redaction round 5
- File: `src/audit/redact.ts`
- Rollout flag: `FLAG_AUDIT_FIELD_ALLOWLIST_R5`
- Protective test: `audit_redacts_unknown_fields_r5`
- Accepted design: field allowlist redactor round 5
- Rejected design: regex-only secret scrubber round 5
- Why: keeps newly added sensitive fields private even before regexes are updated in round 5.

## 59. report export leases round 5
- File: `src/reports/export_lease.ts`
- Rollout flag: `FLAG_EXPORT_LEASE_STEAL_R5`
- Protective test: `export_worker_steals_expired_lease_r5`
- Accepted design: expiring worker lease with compare-and-swap round 5
- Rejected design: permanent worker ownership round 5
- Why: lets a new worker recover abandoned exports without duplicating active work in round 5.

## 60. tenant config snapshots round 5
- File: `src/config/snapshot.ts`
- Rollout flag: `FLAG_CONFIG_SNAPSHOT_PIN_R5`
- Protective test: `config_pins_snapshot_for_request_r5`
- Accepted design: request-scoped config snapshot round 5
- Rejected design: live config reads at every call site round 5
- Why: keeps one request internally consistent while allowing later requests to see updates in round 5.

## 61. checkout idempotency round 6
- File: `src/checkout/idempotency.ts`
- Rollout flag: `FLAG_CHECKOUT_IDEMPOTENCY_V3_R6`
- Protective test: `checkout_dedupes_retry_after_timeout_r6`
- Accepted design: per-cart idempotency key store round 6
- Rejected design: global checkout mutex round 6
- Why: preserves shard-local ordering while letting unrelated carts retry independently in round 6.

## 62. search index freshness round 6
- File: `src/search/freshness.ts`
- Rollout flag: `FLAG_INDEX_EPOCH_GUARD_R6`
- Protective test: `search_rejects_stale_epoch_publish_r6`
- Accepted design: epoch-stamped publish barrier round 6
- Rejected design: blind last-write-wins publish round 6
- Why: prevents a slow crawl from replacing a newer index snapshot in round 6.

## 63. email digest batching round 6
- File: `src/mail/digest.ts`
- Rollout flag: `FLAG_DIGEST_BATCH_WINDOW_R6`
- Protective test: `digest_batches_by_workspace_timezone_r6`
- Accepted design: workspace-local send window round 6
- Rejected design: single UTC midnight cron round 6
- Why: keeps quiet-hour promises without delaying every workspace behind one global clock in round 6.

## 64. webhook replay protection round 6
- File: `src/webhooks/replay.ts`
- Rollout flag: `FLAG_WEBHOOK_NONCE_LEDGER_R6`
- Protective test: `webhook_rejects_reused_nonce_r6`
- Accepted design: nonce ledger keyed by provider event id round 6
- Rejected design: timestamp-only replay window round 6
- Why: blocks fast replays even when the attacker stays inside the timestamp tolerance in round 6.

## 65. cache namespace TTL round 6
- File: `src/cache/namespace_ttl.ts`
- Rollout flag: `FLAG_NAMESPACE_TTL_CAP_R6`
- Protective test: `cache_caps_noisy_namespace_ttl_r6`
- Accepted design: namespace maximum TTL cap round 6
- Rejected design: provider-wide hard-coded TTL round 6
- Why: lets each namespace set a bounded freshness budget without penalizing unrelated caches in round 6.

## 66. feature rollout sampling round 6
- File: `src/rollout/sampling.ts`
- Rollout flag: `FLAG_STICKY_ROLLOUT_HASH_R6`
- Protective test: `rollout_keeps_user_bucket_stable_r6`
- Accepted design: stable hash over actor and flag round 6
- Rejected design: per-request random sampling round 6
- Why: prevents a user from bouncing between treatment and control across refreshes in round 6.

## 67. csv import quarantine round 6
- File: `src/imports/quarantine.ts`
- Rollout flag: `FLAG_IMPORT_ROW_QUARANTINE_R6`
- Protective test: `import_quarantines_bad_rows_only_r6`
- Accepted design: row-level quarantine ledger round 6
- Rejected design: abort entire import on first invalid row round 6
- Why: lets clean rows commit while preserving exact diagnostics for rejected rows in round 6.

## 68. notification fanout round 6
- File: `src/notify/fanout.ts`
- Rollout flag: `FLAG_FANOUT_BACKPRESSURE_R6`
- Protective test: `fanout_applies_channel_backpressure_r6`
- Accepted design: per-channel bounded queue round 6
- Rejected design: unbounded global fanout array round 6
- Why: prevents a slow SMS provider from exhausting memory for email and push sends in round 6.

## 69. session rotation round 6
- File: `src/session/rotation.ts`
- Rollout flag: `FLAG_SESSION_ROTATION_GRACE_R6`
- Protective test: `session_accepts_previous_cookie_once_r6`
- Accepted design: one-use previous-cookie grace round 6
- Rejected design: accept every old cookie until expiry round 6
- Why: avoids logout races during rotation while still closing replay opportunities in round 6.

## 70. audit log redaction round 6
- File: `src/audit/redact.ts`
- Rollout flag: `FLAG_AUDIT_FIELD_ALLOWLIST_R6`
- Protective test: `audit_redacts_unknown_fields_r6`
- Accepted design: field allowlist redactor round 6
- Rejected design: regex-only secret scrubber round 6
- Why: keeps newly added sensitive fields private even before regexes are updated in round 6.

## 71. report export leases round 6
- File: `src/reports/export_lease.ts`
- Rollout flag: `FLAG_EXPORT_LEASE_STEAL_R6`
- Protective test: `export_worker_steals_expired_lease_r6`
- Accepted design: expiring worker lease with compare-and-swap round 6
- Rejected design: permanent worker ownership round 6
- Why: lets a new worker recover abandoned exports without duplicating active work in round 6.

## 72. tenant config snapshots round 6
- File: `src/config/snapshot.ts`
- Rollout flag: `FLAG_CONFIG_SNAPSHOT_PIN_R6`
- Protective test: `config_pins_snapshot_for_request_r6`
- Accepted design: request-scoped config snapshot round 6
- Rejected design: live config reads at every call site round 6
- Why: keeps one request internally consistent while allowing later requests to see updates in round 6.

## 73. checkout idempotency round 7
- File: `src/checkout/idempotency.ts`
- Rollout flag: `FLAG_CHECKOUT_IDEMPOTENCY_V3_R7`
- Protective test: `checkout_dedupes_retry_after_timeout_r7`
- Accepted design: per-cart idempotency key store round 7
- Rejected design: global checkout mutex round 7
- Why: preserves shard-local ordering while letting unrelated carts retry independently in round 7.

## 74. search index freshness round 7
- File: `src/search/freshness.ts`
- Rollout flag: `FLAG_INDEX_EPOCH_GUARD_R7`
- Protective test: `search_rejects_stale_epoch_publish_r7`
- Accepted design: epoch-stamped publish barrier round 7
- Rejected design: blind last-write-wins publish round 7
- Why: prevents a slow crawl from replacing a newer index snapshot in round 7.

## 75. email digest batching round 7
- File: `src/mail/digest.ts`
- Rollout flag: `FLAG_DIGEST_BATCH_WINDOW_R7`
- Protective test: `digest_batches_by_workspace_timezone_r7`
- Accepted design: workspace-local send window round 7
- Rejected design: single UTC midnight cron round 7
- Why: keeps quiet-hour promises without delaying every workspace behind one global clock in round 7.

## 76. webhook replay protection round 7
- File: `src/webhooks/replay.ts`
- Rollout flag: `FLAG_WEBHOOK_NONCE_LEDGER_R7`
- Protective test: `webhook_rejects_reused_nonce_r7`
- Accepted design: nonce ledger keyed by provider event id round 7
- Rejected design: timestamp-only replay window round 7
- Why: blocks fast replays even when the attacker stays inside the timestamp tolerance in round 7.

## 77. cache namespace TTL round 7
- File: `src/cache/namespace_ttl.ts`
- Rollout flag: `FLAG_NAMESPACE_TTL_CAP_R7`
- Protective test: `cache_caps_noisy_namespace_ttl_r7`
- Accepted design: namespace maximum TTL cap round 7
- Rejected design: provider-wide hard-coded TTL round 7
- Why: lets each namespace set a bounded freshness budget without penalizing unrelated caches in round 7.

## 78. feature rollout sampling round 7
- File: `src/rollout/sampling.ts`
- Rollout flag: `FLAG_STICKY_ROLLOUT_HASH_R7`
- Protective test: `rollout_keeps_user_bucket_stable_r7`
- Accepted design: stable hash over actor and flag round 7
- Rejected design: per-request random sampling round 7
- Why: prevents a user from bouncing between treatment and control across refreshes in round 7.

## 79. csv import quarantine round 7
- File: `src/imports/quarantine.ts`
- Rollout flag: `FLAG_IMPORT_ROW_QUARANTINE_R7`
- Protective test: `import_quarantines_bad_rows_only_r7`
- Accepted design: row-level quarantine ledger round 7
- Rejected design: abort entire import on first invalid row round 7
- Why: lets clean rows commit while preserving exact diagnostics for rejected rows in round 7.

## 80. notification fanout round 7
- File: `src/notify/fanout.ts`
- Rollout flag: `FLAG_FANOUT_BACKPRESSURE_R7`
- Protective test: `fanout_applies_channel_backpressure_r7`
- Accepted design: per-channel bounded queue round 7
- Rejected design: unbounded global fanout array round 7
- Why: prevents a slow SMS provider from exhausting memory for email and push sends in round 7.

## 81. session rotation round 7
- File: `src/session/rotation.ts`
- Rollout flag: `FLAG_SESSION_ROTATION_GRACE_R7`
- Protective test: `session_accepts_previous_cookie_once_r7`
- Accepted design: one-use previous-cookie grace round 7
- Rejected design: accept every old cookie until expiry round 7
- Why: avoids logout races during rotation while still closing replay opportunities in round 7.

## 82. audit log redaction round 7
- File: `src/audit/redact.ts`
- Rollout flag: `FLAG_AUDIT_FIELD_ALLOWLIST_R7`
- Protective test: `audit_redacts_unknown_fields_r7`
- Accepted design: field allowlist redactor round 7
- Rejected design: regex-only secret scrubber round 7
- Why: keeps newly added sensitive fields private even before regexes are updated in round 7.

## 83. report export leases round 7
- File: `src/reports/export_lease.ts`
- Rollout flag: `FLAG_EXPORT_LEASE_STEAL_R7`
- Protective test: `export_worker_steals_expired_lease_r7`
- Accepted design: expiring worker lease with compare-and-swap round 7
- Rejected design: permanent worker ownership round 7
- Why: lets a new worker recover abandoned exports without duplicating active work in round 7.

## 84. tenant config snapshots round 7
- File: `src/config/snapshot.ts`
- Rollout flag: `FLAG_CONFIG_SNAPSHOT_PIN_R7`
- Protective test: `config_pins_snapshot_for_request_r7`
- Accepted design: request-scoped config snapshot round 7
- Rejected design: live config reads at every call site round 7
- Why: keeps one request internally consistent while allowing later requests to see updates in round 7.

## 85. checkout idempotency round 8
- File: `src/checkout/idempotency.ts`
- Rollout flag: `FLAG_CHECKOUT_IDEMPOTENCY_V3_R8`
- Protective test: `checkout_dedupes_retry_after_timeout_r8`
- Accepted design: per-cart idempotency key store round 8
- Rejected design: global checkout mutex round 8
- Why: preserves shard-local ordering while letting unrelated carts retry independently in round 8.

## 86. search index freshness round 8
- File: `src/search/freshness.ts`
- Rollout flag: `FLAG_INDEX_EPOCH_GUARD_R8`
- Protective test: `search_rejects_stale_epoch_publish_r8`
- Accepted design: epoch-stamped publish barrier round 8
- Rejected design: blind last-write-wins publish round 8
- Why: prevents a slow crawl from replacing a newer index snapshot in round 8.

## 87. email digest batching round 8
- File: `src/mail/digest.ts`
- Rollout flag: `FLAG_DIGEST_BATCH_WINDOW_R8`
- Protective test: `digest_batches_by_workspace_timezone_r8`
- Accepted design: workspace-local send window round 8
- Rejected design: single UTC midnight cron round 8
- Why: keeps quiet-hour promises without delaying every workspace behind one global clock in round 8.

## 88. webhook replay protection round 8
- File: `src/webhooks/replay.ts`
- Rollout flag: `FLAG_WEBHOOK_NONCE_LEDGER_R8`
- Protective test: `webhook_rejects_reused_nonce_r8`
- Accepted design: nonce ledger keyed by provider event id round 8
- Rejected design: timestamp-only replay window round 8
- Why: blocks fast replays even when the attacker stays inside the timestamp tolerance in round 8.

## 89. cache namespace TTL round 8
- File: `src/cache/namespace_ttl.ts`
- Rollout flag: `FLAG_NAMESPACE_TTL_CAP_R8`
- Protective test: `cache_caps_noisy_namespace_ttl_r8`
- Accepted design: namespace maximum TTL cap round 8
- Rejected design: provider-wide hard-coded TTL round 8
- Why: lets each namespace set a bounded freshness budget without penalizing unrelated caches in round 8.

## 90. feature rollout sampling round 8
- File: `src/rollout/sampling.ts`
- Rollout flag: `FLAG_STICKY_ROLLOUT_HASH_R8`
- Protective test: `rollout_keeps_user_bucket_stable_r8`
- Accepted design: stable hash over actor and flag round 8
- Rejected design: per-request random sampling round 8
- Why: prevents a user from bouncing between treatment and control across refreshes in round 8.

## 91. csv import quarantine round 8
- File: `src/imports/quarantine.ts`
- Rollout flag: `FLAG_IMPORT_ROW_QUARANTINE_R8`
- Protective test: `import_quarantines_bad_rows_only_r8`
- Accepted design: row-level quarantine ledger round 8
- Rejected design: abort entire import on first invalid row round 8
- Why: lets clean rows commit while preserving exact diagnostics for rejected rows in round 8.

## 92. notification fanout round 8
- File: `src/notify/fanout.ts`
- Rollout flag: `FLAG_FANOUT_BACKPRESSURE_R8`
- Protective test: `fanout_applies_channel_backpressure_r8`
- Accepted design: per-channel bounded queue round 8
- Rejected design: unbounded global fanout array round 8
- Why: prevents a slow SMS provider from exhausting memory for email and push sends in round 8.

## 93. session rotation round 8
- File: `src/session/rotation.ts`
- Rollout flag: `FLAG_SESSION_ROTATION_GRACE_R8`
- Protective test: `session_accepts_previous_cookie_once_r8`
- Accepted design: one-use previous-cookie grace round 8
- Rejected design: accept every old cookie until expiry round 8
- Why: avoids logout races during rotation while still closing replay opportunities in round 8.

## 94. audit log redaction round 8
- File: `src/audit/redact.ts`
- Rollout flag: `FLAG_AUDIT_FIELD_ALLOWLIST_R8`
- Protective test: `audit_redacts_unknown_fields_r8`
- Accepted design: field allowlist redactor round 8
- Rejected design: regex-only secret scrubber round 8
- Why: keeps newly added sensitive fields private even before regexes are updated in round 8.

## 95. report export leases round 8
- File: `src/reports/export_lease.ts`
- Rollout flag: `FLAG_EXPORT_LEASE_STEAL_R8`
- Protective test: `export_worker_steals_expired_lease_r8`
- Accepted design: expiring worker lease with compare-and-swap round 8
- Rejected design: permanent worker ownership round 8
- Why: lets a new worker recover abandoned exports without duplicating active work in round 8.

## 96. tenant config snapshots round 8
- File: `src/config/snapshot.ts`
- Rollout flag: `FLAG_CONFIG_SNAPSHOT_PIN_R8`
- Protective test: `config_pins_snapshot_for_request_r8`
- Accepted design: request-scoped config snapshot round 8
- Rejected design: live config reads at every call site round 8
- Why: keeps one request internally consistent while allowing later requests to see updates in round 8.