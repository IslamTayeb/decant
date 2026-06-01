## Goal
- Maintain selective memory for topic-switch facts across checkout/search/mail/webhook/cache/rollout/import/notify/session/audit/report/config topics.

## Constraints & Preferences
- Preserve exact file paths, rollout flags, protective tests, accepted/rejected designs, rationales, and stale neighboring details.
- Avoid stale neighboring details for each topic.

## Progress
### Done
- Recorded rounds 1–8 for all listed topics.

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Checkout idempotency: accepted per-cart idempotency key store; rejected global checkout mutex; preserves shard-local ordering while letting unrelated carts retry independently.
- Search index freshness: accepted epoch-stamped publish barrier; rejected blind last-write-wins publish; prevents a slow crawl from replacing a newer index snapshot.
- Email digest batching: accepted workspace-local send window; rejected single UTC midnight cron; keeps quiet-hour promises without delaying every workspace behind one global clock.
- Webhook replay protection: accepted nonce ledger keyed by provider event id; rejected timestamp-only replay window; blocks fast replays even when attacker stays inside timestamp tolerance.
- Cache namespace TTL: accepted namespace maximum TTL cap; rejected provider-wide hard-coded TTL; lets each namespace set bounded freshness budget without penalizing unrelated caches.
- Feature rollout sampling: accepted stable hash over actor and flag; rejected per-request random sampling; prevents user bouncing between treatment/control across refreshes.
- CSV import quarantine: accepted row-level quarantine ledger; rejected abort entire import on first invalid row; lets clean rows commit while preserving diagnostics.
- Notification fanout: accepted per-channel bounded queue; rejected unbounded global fanout array; prevents slow SMS provider exhausting memory for email/push.
- Session rotation: accepted one-use previous-cookie grace; rejected accept every old cookie until expiry; avoids logout races while closing replay opportunities.
- Audit log redaction: accepted field allowlist redactor; rejected regex-only secret scrubber; keeps newly added sensitive fields private before regex updates.
- Report export leases: accepted expiring worker lease with compare-and-swap; rejected permanent worker ownership; lets new worker recover abandoned exports without duplicating active work.
- Tenant config snapshots: accepted request-scoped config snapshot; rejected live config reads at every call site; keeps one request internally consistent while later requests see updates.

## Next Steps
- (none)

## Critical Context
- Checkout idempotency:
  - `FLAG_CHECKOUT_IDEMPOTENCY_V3_R1`, `checkout_dedupes_retry_after_timeout_r1`
  - `FLAG_CHECKOUT_IDEMPOTENCY_V3_R2`, `checkout_dedupes_retry_after_timeout_r2`
  - `FLAG_CHECKOUT_IDEMPOTENCY_V3_R3`, `checkout_dedupes_retry_after_timeout_r3`
  - `FLAG_CHECKOUT_IDEMPOTENCY_V3_R4`, `checkout_dedupes_retry_after_timeout_r4`
  - `FLAG_CHECKOUT_IDEMPOTENCY_V3_R5`, `checkout_dedupes_retry_after_timeout_r5`
  - `FLAG_CHECKOUT_IDEMPOTENCY_V3_R6`, `checkout_dedupes_retry_after_timeout_r6`
  - `FLAG_CHECKOUT_IDEMPOTENCY_V3_R7`, `checkout_dedupes_retry_after_timeout_r7`
  - `FLAG_CHECKOUT_IDEMPOTENCY_V3_R8`, `checkout_dedupes_retry_after_timeout_r8`
  - Stale detail to avoid: billing retry backoff; billing retry backoff round 2–8.
- Search index freshness:
  - `FLAG_INDEX_EPOCH_GUARD_R1`, `search_rejects_stale_epoch_publish_r1`
  - `FLAG_INDEX_EPOCH_GUARD_R2`, `search_rejects_stale_epoch_publish_r2`
  - `FLAG_INDEX_EPOCH_GUARD_R3`, `search_rejects_stale_epoch_publish_r3`
  - `FLAG_INDEX_EPOCH_GUARD_R4`, `search_rejects_stale_epoch_publish_r4`
  - `FLAG_INDEX_EPOCH_GUARD_R5`, `search_rejects_stale_epoch_publish_r5`
  - `FLAG_INDEX_EPOCH_GUARD_R6`, `search_rejects_stale_epoch_publish_r6`
  - `FLAG_INDEX_EPOCH_GUARD_R7`, `search_rejects_stale_epoch_publish_r7`
  - `FLAG_INDEX_EPOCH_GUARD_R8`, `search_rejects_stale_epoch_publish_r8`
  - Stale detail to avoid: autocomplete ranking cleanup; autocomplete ranking cleanup round 2–8.
- Email digest batching:
  - `FLAG_DIGEST_BATCH_WINDOW_R1`, `digest_batches_by_workspace_timezone_r1`
  - `FLAG_DIGEST_BATCH_WINDOW_R2`, `digest_batches_by_workspace_timezone_r2`
  - `FLAG_DIGEST_BATCH_WINDOW_R3`, `digest_batches_by_workspace_timezone_r3`
  - `FLAG_DIGEST_BATCH_WINDOW_R4`, `digest_batches_by_workspace_timezone_r4`
  - `FLAG_DIGEST_BATCH_WINDOW_R5`, `digest_batches_by_workspace_timezone_r5`
  - `FLAG_DIGEST_BATCH_WINDOW_R6`, `digest_batches_by_workspace_timezone_r6`
  - `FLAG_DIGEST_BATCH_WINDOW_R7`, `digest_batches_by_workspace_timezone_r7`
  - `FLAG_DIGEST_BATCH_WINDOW_R8`, `digest_batches_by_workspace_timezone_r8`
  - Stale detail to avoid: template footer rewrite; template footer rewrite round 2–8.
- Webhook replay protection:
  - `FLAG_WEBHOOK_NONCE_LEDGER_R1`, `webhook_rejects_reused_nonce_r1`
  - `FLAG_WEBHOOK_NONCE_LEDGER_R2`, `webhook_rejects_reused_nonce_r2`
  - `FLAG_WEBHOOK_NONCE_LEDGER_R3`, `webhook_rejects_reused_nonce_r3`
  - `FLAG_WEBHOOK_NONCE_LEDGER_R4`, `webhook_rejects_reused_nonce_r4`
  - `FLAG_WEBHOOK_NONCE_LEDGER_R5`, `webhook_rejects_reused_nonce_r5`
  - `FLAG_WEBHOOK_NONCE_LEDGER_R6`, `webhook_rejects_reused_nonce_r6`
  - `FLAG_WEBHOOK_NONCE_LEDGER_R7`, `webhook_rejects_reused_nonce_r7`
  - `FLAG_WEBHOOK_NONCE_LEDGER_R8`, `webhook_rejects_reused_nonce_r8`
  - Stale detail to avoid: stripe retry cosmetics; stripe retry cosmetics round 2–8.
- Cache namespace TTL:
  - `FLAG_NAMESPACE_TTL_CAP_R1`, `cache_caps_noisy_namespace_ttl_r1`
  - `FLAG_NAMESPACE_TTL_CAP_R2`, `cache_caps_noisy_namespace_ttl_r2`
  - `FLAG_NAMESPACE_TTL_CAP_R3`, `cache_caps_noisy_namespace_ttl_r3`
  - `FLAG_NAMESPACE_TTL_CAP_R4`, `cache_caps_noisy_namespace_ttl_r4`
  - `FLAG_NAMESPACE_TTL_CAP_R5`, `cache_caps_noisy_namespace_ttl_r5`
  - `FLAG_NAMESPACE_TTL_CAP_R6`, `cache_caps_noisy_namespace_ttl_r6`
  - `FLAG_NAMESPACE_TTL_CAP_R7`, `cache_caps_noisy_namespace_ttl_r7`
  - `FLAG_NAMESPACE_TTL_CAP_R8`, `cache_caps_noisy_namespace_ttl_r8`
  - Stale detail to avoid: image preview freshness; image preview freshness round 2–8.
- Feature rollout sampling:
  - `FLAG_STICKY_ROLLOUT_HASH_R1`, `rollout_keeps_user_bucket_stable_r1`
  - `FLAG_STICKY_ROLLOUT_HASH_R2`, `rollout_keeps_user_bucket_stable_r2`
  - `FLAG_STICKY_ROLLOUT_HASH_R3`, `rollout_keeps_user_bucket_stable_r3`
  - `FLAG_STICKY_ROLLOUT_HASH_R4`, `rollout_keeps_user_bucket_stable_r4`
  - `FLAG_STICKY_ROLLOUT_HASH_R5`, `rollout_keeps_user_bucket_stable_r5`
  - `FLAG_STICKY_ROLLOUT_HASH_R6`, `rollout_keeps_user_bucket_stable_r6`
  - `FLAG_STICKY_ROLLOUT_HASH_R7`, `rollout_keeps_user_bucket_stable_r7`
  - `FLAG_STICKY_ROLLOUT_HASH_R8`, `rollout_keeps_user_bucket_stable_r8`
  - Stale detail to avoid: analytics dashboard color; analytics dashboard color round 2–8.
- CSV import quarantine:
  - `FLAG_IMPORT_ROW_QUARANTINE_R1`, `import_quarantines_bad_rows_only_r1`
  - `FLAG_IMPORT_ROW_QUARANTINE_R2`, `import_quarantines_bad_rows_only_r2`
  - `FLAG_IMPORT_ROW_QUARANTINE_R3`, `import_quarantines_bad_rows_only_r3`
  - `FLAG_IMPORT_ROW_QUARANTINE_R4`, `import_quarantines_bad_rows_only_r4`
  - `FLAG_IMPORT_ROW_QUARANTINE_R5`, `import_quarantines_bad_rows_only_r5`
  - `FLAG_IMPORT_ROW_QUARANTINE_R6`, `import_quarantines_bad_rows_only_r6`
  - `FLAG_IMPORT_ROW_QUARANTINE_R7`, `import_quarantines_bad_rows_only_r7`
  - `FLAG_IMPORT_ROW_QUARANTINE_R8`, `import_quarantines_bad_rows_only_r8`
  - Stale detail to avoid: spreadsheet column autosize; spreadsheet column autosize round 2–8.
- Notification fanout:
  - `FLAG_FANOUT_BACKPRESSURE_R1`, `fanout_applies_channel_backpressure_r1`
  - `FLAG_FANOUT_BACKPRESSURE_R2`, `fanout_applies_channel_backpressure_r2`
  - `FLAG_FANOUT_BACKPRESSURE_R3`, `fanout_applies_channel_backpressure_r3`
  - `FLAG_FANOUT_BACKPRESSURE_R4`, `fanout_applies_channel_backpressure_r4`
  - `FLAG_FANOUT_BACKPRESSURE_R5`, `fanout_applies_channel_backpressure_r5`
  - `FLAG_FANOUT_BACKPRESSURE_R6`, `fanout_applies_channel_backpressure_r6`
  - `FLAG_FANOUT_BACKPRESSURE_R7`, `fanout_applies_channel_backpressure_r7`
  - `FLAG_FANOUT_BACKPRESSURE_R8`, `fanout_applies_channel_backpressure_r8`
  - Stale detail to avoid: notification icon set; notification icon set round 2–8.
- Session rotation:
  - `FLAG_SESSION_ROTATION_GRACE_R1`, `session_accepts_previous_cookie_once_r1`
  - `FLAG_SESSION_ROTATION_GRACE_R2`, `session_accepts_previous_cookie_once_r2`
  - `FLAG_SESSION_ROTATION_GRACE_R3`, `session_accepts_previous_cookie_once_r3`
  - `FLAG_SESSION_ROTATION_GRACE_R4`, `session_accepts_previous_cookie_once_r4`
  - `FLAG_SESSION_ROTATION_GRACE_R5`, `session_accepts_previous_cookie_once_r5`
  - `FLAG_SESSION_ROTATION_GRACE_R6`, `session_accepts_previous_cookie_once_r6`
  - `FLAG_SESSION_ROTATION_GRACE_R7`, `session_accepts_previous_cookie_once_r7`
  - `FLAG_SESSION_ROTATION_GRACE_R8`, `session_accepts_previous_cookie_once_r8`
  - Stale detail to avoid: login page copy; login page copy round 2–8.
- Audit log redaction:
  - `FLAG_AUDIT_FIELD_ALLOWLIST_R1`, `audit_redacts_unknown_fields_r1`
  - `FLAG_AUDIT_FIELD_ALLOWLIST_R2`, `audit_redacts_unknown_fields_r2`
  - `FLAG_AUDIT_FIELD_ALLOWLIST_R3`, `audit_redacts_unknown_fields_r3`
  - `FLAG_AUDIT_FIELD_ALLOWLIST_R4`, `audit_redacts_unknown_fields_r4`
  - `FLAG_AUDIT_FIELD_ALLOWLIST_R5`, `audit_redacts_unknown_fields_r5`
  - `FLAG_AUDIT_FIELD_ALLOWLIST_R6`, `audit_redacts_unknown_fields_r6`
  - `FLAG_AUDIT_FIELD_ALLOWLIST_R7`, `audit_redacts_unknown_fields_r7`
  - `FLAG_AUDIT_FIELD_ALLOWLIST_R8`, `audit_redacts_unknown_fields_r8`
  - Stale detail to avoid: audit table pagination; audit table pagination round 2–8.
- Report export leases:
  - `FLAG_EXPORT_LEASE_STEAL_R1`, `export_worker_steals_expired_lease_r1`
  - `FLAG_EXPORT_LEASE_STEAL_R2`, `export_worker_steals_expired_lease_r2`
  - `FLAG_EXPORT_LEASE_STEAL_R3`, `export_worker_steals_expired_lease_r3`
  - `FLAG_EXPORT_LEASE_STEAL_R4`, `export_worker_steals_expired_lease_r4`
  - `FLAG_EXPORT_LEASE_STEAL_R5`, `export_worker_steals_expired_lease_r5`
  - `FLAG_EXPORT_LEASE_STEAL_R6`, `export_worker_steals_expired_lease_r6`
  - `FLAG_EXPORT_LEASE_STEAL_R7`, `export_worker_steals_expired_lease_r7`
  - `FLAG_EXPORT_LEASE_STEAL_R8`, `export_worker_steals_expired_lease_r8`
  - Stale detail to avoid: CSV heading title case; CSV heading title case round 2–8.
- Tenant config snapshots:
  - `FLAG_CONFIG_SNAPSHOT_PIN_R1`, `config_pins_snapshot_for_request_r1`
  - `FLAG_CONFIG_SNAPSHOT_PIN_R2`, `config_pins_snapshot_for_request_r2`
  - `FLAG_CONFIG_SNAPSHOT_PIN_R3`, `config_pins_snapshot_for_request_r3`
  - `FLAG_CONFIG_SNAPSHOT_PIN_R4`, `config_pins_snapshot_for_request_r4`
  - `FLAG_CONFIG_SNAPSHOT_PIN_R5`, `config_pins_snapshot_for_request_r5`
  - `FLAG_CONFIG_SNAPSHOT_PIN_R6`, `config_pins_snapshot_for_request_r6`
  - `FLAG_CONFIG_SNAPSHOT_PIN_R7`, `config_pins_snapshot_for_request_r7`
  - Stale detail to avoid: settings sidebar grouping; settings sidebar grouping round 2–7.

## Relevant Files
- `src/checkout/idempotency.ts`: checkout idempotency rounds 1–8.
- `src/search/freshness.ts`: search index freshness rounds 1–8.
- `src/mail/digest.ts`: email digest batching rounds 1–8.
- `src/webhooks/replay.ts`: webhook replay protection rounds 1–8.
- `src/cache/namespace_ttl.ts`: cache namespace TTL rounds 1–8.
- `src/rollout/sampling.ts`: feature rollout sampling rounds 1–8.
- `src/imports/quarantine.ts`: csv import quarantine rounds 1–8.
- `src/notify/fanout.ts`: notification fanout rounds 1–8.
- `src/session/rotation.ts`: session rotation rounds 1–8.
- `src/audit/redact.ts`: audit log redaction rounds 1–8.
- `src/reports/export_lease.ts`: report export leases rounds 1–8.
- `src/config/snapshot.ts`: tenant config snapshots rounds 1–7.