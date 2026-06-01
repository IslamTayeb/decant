## Goal
- Preserve selective-memory details for multiple incident topics and exact identifiers for future coding-session continuity.

## Constraints & Preferences
- Preserve exact strings for future selective-memory questions.
- Avoid stale neighboring details explicitly marked for each topic.
- Use exact file paths and identifiers when known.

## Progress
### Done
- Recorded checkout idempotency incident `0or73qt`.
- Recorded search index freshness incident `1lowtq7`.
- Recorded email digest batching incident `0ddfi0h`.
- Recorded webhook replay protection incident `12880c9`.
- Recorded cache namespace TTL incident `1uzmybe`.
- Recorded feature rollout sampling incident `02u6ks6`.
- Recorded csv import quarantine incident `18db99g`.
- Recorded notification fanout incident `1o2nkc7`.
- Recorded session rotation incident `1hptfzy`.
- Recorded audit log redaction incident `0137vnk`.
- Recorded report export leases incident `166tvzv`.
- Recorded tenant config snapshots incident `05lcfbs`.
- Recorded checkout idempotency incident `06dkxeu`.
- Recorded search index freshness incident `13owed6`.
- Recorded email digest batching incident `0i92crm`.
- Recorded webhook replay protection incident `134k1y8`.
- Recorded cache namespace TTL incident `0rbc72v`.
- Recorded feature rollout sampling incident `14plb4x`.
- Recorded csv import quarantine incident `1apt87p`.
- Recorded notification fanout incident `1aspc7a`.
- Recorded session rotation incident `0o83phc`.
- Recorded audit log redaction incident `10y6prc`.
- Recorded report export leases incident `0elv0r8`.

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Checkout idempotency: accepted per-cart idempotency key store over global checkout mutex because it preserves shard-local ordering while letting unrelated carts retry independently.
- Search index freshness: accepted epoch-stamped publish barrier over blind last-write-wins publish because it prevents a slow crawl from replacing a newer index snapshot.
- Email digest batching: accepted workspace-local send window over single UTC midnight cron because it keeps quiet-hour promises without delaying every workspace behind one global clock.
- Webhook replay protection: accepted nonce ledger keyed by provider event id over timestamp-only replay window because it blocks fast replays inside timestamp tolerance.
- Cache namespace TTL: accepted namespace maximum TTL cap over provider-wide hard-coded TTL because it lets each namespace set a bounded freshness budget without penalizing unrelated caches.
- Feature rollout sampling: accepted stable hash over actor and flag over per-request random sampling because it prevents users bouncing between treatment and control.
- Csv import quarantine: accepted row-level quarantine ledger over aborting entire import because it lets clean rows commit while preserving exact diagnostics.
- Notification fanout: accepted per-channel bounded queue over unbounded global fanout array because it prevents slow SMS provider memory exhaustion affecting email and push.
- Session rotation: accepted one-use previous-cookie grace over accepting every old cookie until expiry because it avoids logout races while closing replay opportunities.
- Audit log redaction: accepted field allowlist redactor over regex-only secret scrubber because it keeps newly added sensitive fields private before regexes update.
- Report export leases: accepted expiring worker lease with compare-and-swap over permanent worker ownership because it lets new workers recover abandoned exports without duplicating active work.
- Tenant config snapshots: accepted request-scoped config snapshot over live config reads because it keeps one request internally consistent while allowing later requests to see updates.

## Next Steps
- (none)

## Critical Context
- `0or73qt`: `FLAG_CHECKOUT_IDEMPOTENCY_V3_0TKS5NV`; `checkout_dedupes_retry_after_timeout_0kk4icp`; accepted `per-cart idempotency key store with amber-dovetail guard 0CPGJX8`; rejected `global checkout mutex after harbor-lantern rollback 1NO7YH7`; marker `1MLAOB9 preserved rivet isolation for case 1`; avoid `billing retry backoff stale path 0EWWZD6`.
- `1lowtq7`: `FLAG_INDEX_EPOCH_GUARD_14MWRGT`; `search_rejects_stale_epoch_publish_1rkix6f`; accepted `epoch-stamped publish barrier with fennel-indigo guard 0CBWWP2`; rejected `blind last-write-wins publish after marble-quartz rollback 1RR2O0P`; marker `0OEPOV3 preserved willow isolation for case 1`; avoid `autocomplete ranking cleanup stale path 0Y1PEL4`.
- `0ddfi0h`: `FLAG_DIGEST_BATCH_WINDOW_0TCPHQV`; `digest_batches_by_workspace_timezone_0pfucrp`; accepted `workspace-local send window with keystone-nickel guard 0RW1I0W`; rejected `single UTC midnight cron after rivet-velvet rollback 1GDMXDZ`; marker `18ZDJEH preserved dovetail isolation for case 1`; avoid `template footer rewrite stale path 0ZM2Y8U`.
- `12880c9`: `FLAG_WEBHOOK_NONCE_LEDGER_16QNT9R`; `webhook_rejects_reused_nonce_1wl6s4t`; accepted `nonce ledger keyed by provider event id with prairie-saffron guard 1IOBUZS`; rejected `timestamp-only replay window after willow-cedar rollback 1RMGTNJ`; marker `1ICC7PT preserved indigo isolation for case 1`; avoid `stripe retry cosmetics stale path 0KVG4VQ`.
- `1uzmybe`: `FLAG_NAMESPACE_TTL_CAP_0QSHWJC`; `cache_caps_noisy_namespace_ttl_1qdykta`; accepted `namespace maximum TTL cap with umbra-xenon guard 1P9Z26F`; rejected `provider-wide hard-coded TTL after dovetail-harbor rollback 1V877GS`; marker `0AUGFS8 preserved nickel isolation for case 1`; avoid `image preview freshness stale path 1MFY5U7`.
- `02u6ks6`: `FLAG_STICKY_ROLLOUT_HASH_1VJUC1G`; `rollout_keeps_user_bucket_stable_1p1ajii`; accepted `stable hash over actor and flag with brisk-ember guard 1J4XBSB`; rejected `per-request random sampling after indigo-marble rollback 0Y70HQG`; marker `15XOYKS preserved saffron isolation for case 1`; avoid `analytics dashboard color stale path 0XY3AG3`.
- `18db99g`: `FLAG_IMPORT_ROW_QUARANTINE_0UP4UII`; `import_quarantines_bad_rows_only_0d8waik`; accepted `row-level quarantine ledger with glacier-jigsaw guard 1D0YOK1`; rejected `abort entire import on first invalid row after nickel-rivet rollback 06NAID6`; marker `184HMG2 preserved xenon isolation for case 1`; avoid `spreadsheet column autosize stale path 1TOHV6D`.
- `1o2nkc7`: `FLAG_FANOUT_BACKPRESSURE_0ASQQC5`; `fanout_applies_channel_backpressure_0llus8f`; accepted `per-channel bounded queue with lantern-onyx guard 19Y8GF2`; rejected `unbounded global fanout array after saffron-willow rollback 1JE9FI9`; marker `05LWFVR preserved ember isolation for case 1`; avoid `notification icon set stale path 0KSLWE8`.
- `1hptfzy`: `FLAG_SESSION_ROTATION_GRACE_1W700X8`; `session_accepts_previous_cookie_once_05ezjsi`; accepted `one-use previous-cookie grace with quartz-topaz guard 0DVX7ZN`; rejected `accept every old cookie until expiry after xenon-dovetail rollback 0W5UOYO`; marker `0IE2WUC preserved jigsaw isolation for case 1`; avoid `login page copy stale path 1XAPDJV`.
- `0137vnk`: `FLAG_AUDIT_FIELD_ALLOWLIST_17CJ3DI`; `audit_redacts_unknown_fields_1jgdjfs`; accepted `field allowlist redactor with velvet-amber guard 1CHN91X`; rejected `regex-only secret scrubber after ember-indigo rollback 03RV7G6`; marker `1LDFD5I preserved onyx isolation for case 1`; avoid `audit table pagination stale path 0BUEHCP`.
- `166tvzv`: `FLAG_EXPORT_LEASE_STEAL_0PY8DYH`; `export_worker_steals_expired_lease_0zzjko3`; accepted `expiring worker lease with compare-and-swap with cedar-fennel guard 1C8LGRE`; rejected `permanent worker ownership after jigsaw-nickel rollback 1AAMBYT`; marker `1SD23G3 preserved topaz isolation for case 1`; avoid `CSV heading title case stale path 1FXZ3V0`.
- `05lcfbs`: `FLAG_CONFIG_SNAPSHOT_PIN_0OYHCJI`; `config_pins_snapshot_for_request_1uqlyg0`; accepted `request-scoped config snapshot with harbor-keystone guard 09I3VXP`; rejected `live config reads at every call site after onyx-saffron rollback 1CI2CXQ`; marker `0ROQEF2 preserved amber isolation for case 1`; avoid `settings sidebar grouping stale path 1M02V41`.
- `06dkxeu`: `FLAG_CHECKOUT_IDEMPOTENCY_V3_1Z06Y9W`; `checkout_dedupes_retry_after_timeout_0mbtfga`; accepted `per-cart idempotency key store with marble-prairie guard 089K3QZ`; rejected `global checkout mutex after topaz-xenon rollback 0Z2HCD4`; marker `1O5JUT8 preserved fennel isolation for case 2`; avoid `billing retry backoff stale path 07R3ER7`.
- `13owed6`: `FLAG_INDEX_EPOCH_GUARD_1YIVEK8`; `search_rejects_stale_epoch_publish_0z380v2`; accepted `epoch-stamped publish barrier with rivet-umbra guard 110PIDJ`; rejected `blind last-write-wins publish after amber-ember rollback 16YXNNW`; marker `0VNX8Q0 preserved keystone isolation for case 2`; avoid `autocomplete ranking cleanup stale path 0VILAXB`.
- `0i92crm`: `FLAG_DIGEST_BATCH_WINDOW_07YT6Z4`; `digest_batches_by_workspace_timezone_110jngm`; accepted `workspace-local send window with willow-brisk guard 10I4OOF`; rejected `single UTC midnight cron after fennel-jigsaw rollback 1QZ4OMC`; marker `1NA2K9S preserved prairie isolation for case 2`; avoid `template footer rewrite stale path 1Q5GM1Z`.
- `134k1y8`: `FLAG_WEBHOOK_NONCE_LEDGER_0ACR7P2`; `webhook_rejects_reused_nonce_0mglnrc`; accepted `nonce ledger keyed by provider event id with dovetail-glacier guard 0EE5BW5`; rejected `timestamp-only replay window after keystone-onyx rollback 0THNP06`; marker `04AYEUU preserved umbra isolation for case 2`; avoid `stripe retry cosmetics stale path 1TS3SMX`.
- `0rbc72v`: `FLAG_NAMESPACE_TTL_CAP_161TTKL`; `cache_caps_noisy_namespace_ttl_1nvngy7`; accepted `namespace maximum TTL cap with indigo-lantern guard 1PDKSOU`; rejected `provider-wide hard-coded TTL after prairie-topaz rollback 0UHVEN5`; marker `0MDQF47 preserved brisk isolation for case 2`; avoid `image preview freshness stale path 0LVN468`.
- `14plb4x`: `FLAG_STICKY_ROLLOUT_HASH_1LGO61Z`; `rollout_keeps_user_bucket_stable_0pgshud`; accepted `stable hash over actor and flag with nickel-quartz guard 0GKUDN4`; rejected `per-request random sampling after umbra-amber rollback 0LAWBVB`; marker `1GCZ8O9 preserved glacier isolation for case 2`; avoid `analytics dashboard color stale path 0393OOE`.
- `1apt87p`: `FLAG_IMPORT_ROW_QUARANTINE_1FJEA4R`; `import_quarantines_bad_rows_only_15tzi15`; accepted `row-level quarantine ledger with saffron-velvet guard 0S5ATJ0`; rejected `abort entire import on first invalid row after brisk-fennel rollback 0V76UEJ`; marker `07GPM45 preserved lantern isolation for case 2`; avoid `spreadsheet column autosize stale path 1J0ZBMY`.
- `1aspc7a`: `FLAG_FANOUT_BACKPRESSURE_14E53HG`; `fanout_applies_channel_backpressure_1q26pga`; accepted `per-channel bounded queue with xenon-cedar guard 1OIWCEZ`; rejected `unbounded global fanout array after glacier-keystone rollback 1QPOQEW`; marker `0UPJRX8 preserved quartz isolation for case 2`; avoid `notification icon set stale path 13UBYZ7`.
- `0o83phc`: `FLAG_SESSION_ROTATION_GRACE_1MRY6XI`; `session_accepts_previous_cookie_once_00jfpt4`; accepted `one-use previous-cookie grace with ember-harbor guard 1UTX5XX`; rejected `accept every old cookie until expiry after lantern-prairie rollback 1M2PQ2E`; marker `1QO9GRA preserved velvet isolation for case 2`; avoid `login page copy stale path 1J8WP3T`.
- `10y6prc`: `FLAG_AUDIT_FIELD_ALLOWLIST_1DW98A6`; `audit_redacts_unknown_fields_0vr9jhs`; accepted `field allowlist redactor with jigsaw-marble guard 1VS8BVH`; rejected `regex-only secret scrubber after quartz-umbra rollback 0X0TQSU`; marker `1PJW6VI preserved cedar isolation for case 2`; avoid `audit table pagination stale path 0WYV9KH`.
- `0elv0r8`: `FLAG_EXPORT_LEASE_STEAL_0VM7I6I`; `export_worker_steals_expired_lease_031wzak`; accepted `expiring worker lease with compare-and-swap with onyx-rivet guard 1PRARVL`; rejected `permanent worker ownership after velvet-brisk rollback 12WB6A2`; marker `13X8JF6 preserved harbor isolation for case 2`; avoid `CSV heading title case stale path 1WZHYN9`.

## Relevant Files
- `src/checkout/idempotency.0or73qt.ts`: checkout idempotency incident `0or73qt`.
- `src/search/freshness.1lowtq7.ts`: search index freshness incident `1lowtq7`.
- `src/mail/digest.0ddfi0h.ts`: email digest batching incident `0ddfi0h`.
- `src/webhooks/replay.12880c9.ts`: webhook replay protection incident `12880c9`.
- `src/cache/namespace_ttl.1uzmybe.ts`: cache namespace TTL incident `1uzmybe`.
- `src/rollout/sampling.02u6ks6.ts`: feature rollout sampling incident `02u6ks6`.
- `src/imports/quarantine.18db99g.ts`: csv import quarantine incident `18db99g`.
- `src/notify/fanout.1o2nkc7.ts`: notification fanout incident `1o2nkc7`.
- `src/session/rotation.1hptfzy.ts`: session rotation incident `1hptfzy`.
- `src/audit/redact.0137vnk.ts`: audit log redaction incident `0137vnk`.
- `src/reports/export_lease.166tvzv.ts`: report export leases incident `166tvzv`.
- `src/config/snapshot.05lcfbs.ts`: tenant config snapshots incident `05lcfbs`.
- `src/checkout/idempotency.06dkxeu.ts`: checkout idempotency incident `06dkxeu`.
- `src/search/freshness.13owed6.ts`: search index freshness incident `13owed6`.
- `src/mail/digest.0i92crm.ts`: email digest batching incident `0i92crm`.
- `src/webhooks/replay.134k1y8.ts`: webhook replay protection incident `134k1y8`.
- `src/cache/namespace_ttl.0rbc72v.ts`: cache namespace TTL incident `0rbc72v`.
- `src/rollout/sampling.14plb4x.ts`: feature rollout sampling incident `14plb4x`.
- `src/imports/quarantine.1apt87p.ts`: csv import quarantine incident `1apt87p`.
- `src/notify/fanout.1aspc7a.ts`: notification fanout incident `1aspc7a`.
- `src/session/rotation.0o83phc.ts`: session rotation incident `0o83phc`.
- `src/audit/redact.10y6prc.ts`: audit log redaction incident `10y6prc`.
- `src/reports/export_lease.0elv0r8.ts`: report export leases incident `0elv0r8`.