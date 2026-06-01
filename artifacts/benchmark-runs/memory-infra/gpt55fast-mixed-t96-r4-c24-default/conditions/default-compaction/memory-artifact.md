## Goal
- Preserve checkout/search/mail/webhook/cache/rollout/import/notify/session/audit/report/config rollout-memory facts for future selective-memory questions.

## Constraints & Preferences
- Preserve exact file paths, rollout flags, protective tests, accepted/rejected designs, reasons, and stale neighboring details.
- Avoid stale neighboring details for each topic.

## Progress
### Done
- Recorded topic facts for rounds 1-8, except tenant config snapshots recorded through round 7.

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Accepted per-topic shard/local/scope-safe designs over global/blind/unbounded alternatives to preserve correctness without penalizing unrelated work.

## Next Steps
- (none)

## Critical Context
- checkout idempotency: `src/checkout/idempotency.ts`; flags `FLAG_CHECKOUT_IDEMPOTENCY_V3_R1` through `FLAG_CHECKOUT_IDEMPOTENCY_V3_R8`; tests `checkout_dedupes_retry_after_timeout_r1` through `checkout_dedupes_retry_after_timeout_r8`; accepted `per-cart idempotency key store`; rejected `global checkout mutex`; avoid `billing retry backoff`.
- search index freshness: `src/search/freshness.ts`; flags `FLAG_INDEX_EPOCH_GUARD_R1` through `FLAG_INDEX_EPOCH_GUARD_R8`; tests `search_rejects_stale_epoch_publish_r1` through `search_rejects_stale_epoch_publish_r8`; accepted `epoch-stamped publish barrier`; rejected `blind last-write-wins publish`; avoid `autocomplete ranking cleanup`.
- email digest batching: `src/mail/digest.ts`; flags `FLAG_DIGEST_BATCH_WINDOW_R1` through `FLAG_DIGEST_BATCH_WINDOW_R8`; tests `digest_batches_by_workspace_timezone_r1` through `digest_batches_by_workspace_timezone_r8`; accepted `workspace-local send window`; rejected `single UTC midnight cron`; avoid `template footer rewrite`.
- webhook replay protection: `src/webhooks/replay.ts`; flags `FLAG_WEBHOOK_NONCE_LEDGER_R1` through `FLAG_WEBHOOK_NONCE_LEDGER_R8`; tests `webhook_rejects_reused_nonce_r1` through `webhook_rejects_reused_nonce_r8`; accepted `nonce ledger keyed by provider event id`; rejected `timestamp-only replay window`; avoid `stripe retry cosmetics`.
- cache namespace TTL: `src/cache/namespace_ttl.ts`; flags `FLAG_NAMESPACE_TTL_CAP_R1` through `FLAG_NAMESPACE_TTL_CAP_R8`; tests `cache_caps_noisy_namespace_ttl_r1` through `cache_caps_noisy_namespace_ttl_r8`; accepted `namespace maximum TTL cap`; rejected `provider-wide hard-coded TTL`; avoid `image preview freshness`.
- feature rollout sampling: `src/rollout/sampling.ts`; flags `FLAG_STICKY_ROLLOUT_HASH_R1` through `FLAG_STICKY_ROLLOUT_HASH_R8`; tests `rollout_keeps_user_bucket_stable_r1` through `rollout_keeps_user_bucket_stable_r8`; accepted `stable hash over actor and flag`; rejected `per-request random sampling`; avoid `analytics dashboard color`.
- csv import quarantine: `src/imports/quarantine.ts`; flags `FLAG_IMPORT_ROW_QUARANTINE_R1` through `FLAG_IMPORT_ROW_QUARANTINE_R8`; tests `import_quarantines_bad_rows_only_r1` through `import_quarantines_bad_rows_only_r8`; accepted `row-level quarantine ledger`; rejected `abort entire import on first invalid row`; avoid `spreadsheet column autosize`.
- notification fanout: `src/notify/fanout.ts`; flags `FLAG_FANOUT_BACKPRESSURE_R1` through `FLAG_FANOUT_BACKPRESSURE_R8`; tests `fanout_applies_channel_backpressure_r1` through `fanout_applies_channel_backpressure_r8`; accepted `per-channel bounded queue`; rejected `unbounded global fanout array`; avoid `notification icon set`.
- session rotation: `src/session/rotation.ts`; flags `FLAG_SESSION_ROTATION_GRACE_R1` through `FLAG_SESSION_ROTATION_GRACE_R8`; tests `session_accepts_previous_cookie_once_r1` through `session_accepts_previous_cookie_once_r8`; accepted `one-use previous-cookie grace`; rejected `accept every old cookie until expiry`; avoid `login page copy`.
- audit log redaction: `src/audit/redact.ts`; flags `FLAG_AUDIT_FIELD_ALLOWLIST_R1` through `FLAG_AUDIT_FIELD_ALLOWLIST_R8`; tests `audit_redacts_unknown_fields_r1` through `audit_redacts_unknown_fields_r8`; accepted `field allowlist redactor`; rejected `regex-only secret scrubber`; avoid `audit table pagination`.
- report export leases: `src/reports/export_lease.ts`; flags `FLAG_EXPORT_LEASE_STEAL_R1` through `FLAG_EXPORT_LEASE_STEAL_R8`; tests `export_worker_steals_expired_lease_r1` through `export_worker_steals_expired_lease_r8`; accepted `expiring worker lease with compare-and-swap`; rejected `permanent worker ownership`; avoid `CSV heading title case`.
- tenant config snapshots: `src/config/snapshot.ts`; flags `FLAG_CONFIG_SNAPSHOT_PIN_R1` through `FLAG_CONFIG_SNAPSHOT_PIN_R7`; tests `config_pins_snapshot_for_request_r1` through `config_pins_snapshot_for_request_r7`; accepted `request-scoped config snapshot`; rejected `live config reads at every call site`; avoid `settings sidebar grouping`.

## Relevant Files
- `src/checkout/idempotency.ts`: checkout idempotency.
- `src/search/freshness.ts`: search index freshness.
- `src/mail/digest.ts`: email digest batching.
- `src/webhooks/replay.ts`: webhook replay protection.
- `src/cache/namespace_ttl.ts`: cache namespace TTL.
- `src/rollout/sampling.ts`: feature rollout sampling.
- `src/imports/quarantine.ts`: csv import quarantine.
- `src/notify/fanout.ts`: notification fanout.
- `src/session/rotation.ts`: session rotation.
- `src/audit/redact.ts`: audit log redaction.
- `src/reports/export_lease.ts`: report export leases.
- `src/config/snapshot.ts`: tenant config snapshots.