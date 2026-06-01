## Maintained Memory Context: 24 Real Topics

### checkout idempotency incident 0or73qt
- File: `src/checkout/idempotency.0or73qt.ts`
- Rollout flag: `FLAG_CHECKOUT_IDEMPOTENCY_V3_0TKS5NV`
- Protective test: `checkout_dedupes_retry_after_timeout_0kk4icp`
- Accepted design: per-cart idempotency key store with amber-dovetail guard 0CPGJX8
- Rejected design: global checkout mutex after harbor-lantern rollback 1NO7YH7
- Why: preserves shard-local ordering while letting unrelated carts retry independently; marker 1MLAOB9 preserved rivet isolation for case 1.

### search index freshness incident 1lowtq7
- File: `src/search/freshness.1lowtq7.ts`
- Rollout flag: `FLAG_INDEX_EPOCH_GUARD_14MWRGT`
- Protective test: `search_rejects_stale_epoch_publish_1rkix6f`
- Accepted design: epoch-stamped publish barrier with fennel-indigo guard 0CBWWP2
- Rejected design: blind last-write-wins publish after marble-quartz rollback 1RR2O0P
- Why: prevents a slow crawl from replacing a newer index snapshot; marker 0OEPOV3 preserved willow isolation for case 1.

### email digest batching incident 0ddfi0h
- File: `src/mail/digest.0ddfi0h.ts`
- Rollout flag: `FLAG_DIGEST_BATCH_WINDOW_0TCPHQV`
- Protective test: `digest_batches_by_workspace_timezone_0pfucrp`
- Accepted design: workspace-local send window with keystone-nickel guard 0RW1I0W
- Rejected design: single UTC midnight cron after rivet-velvet rollback 1GDMXDZ
- Why: keeps quiet-hour promises without delaying every workspace behind one global clock; marker 18ZDJEH preserved dovetail isolation for case 1.

### webhook replay protection incident 12880c9
- File: `src/webhooks/replay.12880c9.ts`
- Rollout flag: `FLAG_WEBHOOK_NONCE_LEDGER_16QNT9R`
- Protective test: `webhook_rejects_reused_nonce_1wl6s4t`
- Accepted design: nonce ledger keyed by provider event id with prairie-saffron guard 1IOBUZS
- Rejected design: timestamp-only replay window after willow-cedar rollback 1RMGTNJ
- Why: blocks fast replays even when the attacker stays inside the timestamp tolerance; marker 1ICC7PT preserved indigo isolation for case 1.

### cache namespace TTL incident 1uzmybe
- File: `src/cache/namespace_ttl.1uzmybe.ts`
- Rollout flag: `FLAG_NAMESPACE_TTL_CAP_0QSHWJC`
- Protective test: `cache_caps_noisy_namespace_ttl_1qdykta`
- Accepted design: namespace maximum TTL cap with umbra-xenon guard 1P9Z26F
- Rejected design: provider-wide hard-coded TTL after dovetail-harbor rollback 1V877GS
- Why: lets each namespace set a bounded freshness budget without penalizing unrelated caches; marker 0AUGFS8 preserved nickel isolation for case 1.

### feature rollout sampling incident 02u6ks6
- File: `src/rollout/sampling.02u6ks6.ts`
- Rollout flag: `FLAG_STICKY_ROLLOUT_HASH_1VJUC1G`
- Protective test: `rollout_keeps_user_bucket_stable_1p1ajii`
- Accepted design: stable hash over actor and flag with brisk-ember guard 1J4XBSB
- Rejected design: per-request random sampling after indigo-marble rollback 0Y70HQG
- Why: prevents a user from bouncing between treatment and control across refreshes; marker 15XOYKS preserved saffron isolation for case 1.

### csv import quarantine incident 18db99g
- File: `src/imports/quarantine.18db99g.ts`
- Rollout flag: `FLAG_IMPORT_ROW_QUARANTINE_0UP4UII`
- Protective test: `import_quarantines_bad_rows_only_0d8waik`
- Accepted design: row-level quarantine ledger with glacier-jigsaw guard 1D0YOK1
- Rejected design: abort entire import on first invalid row after nickel-rivet rollback 06NAID6
- Why: lets clean rows commit while preserving exact diagnostics for rejected rows; marker 184HMG2 preserved xenon isolation for case 1.

### notification fanout incident 1o2nkc7
- File: `src/notify/fanout.1o2nkc7.ts`
- Rollout flag: `FLAG_FANOUT_BACKPRESSURE_0ASQQC5`
- Protective test: `fanout_applies_channel_backpressure_0llus8f`
- Accepted design: per-channel bounded queue with lantern-onyx guard 19Y8GF2
- Rejected design: unbounded global fanout array after saffron-willow rollback 1JE9FI9
- Why: prevents a slow SMS provider from exhausting memory for email and push sends; marker 05LWFVR preserved ember isolation for case 1.

### session rotation incident 1hptfzy
- File: `src/session/rotation.1hptfzy.ts`
- Rollout flag: `FLAG_SESSION_ROTATION_GRACE_1W700X8`
- Protective test: `session_accepts_previous_cookie_once_05ezjsi`
- Accepted design: one-use previous-cookie grace with quartz-topaz guard 0DVX7ZN
- Rejected design: accept every old cookie until expiry after xenon-dovetail rollback 0W5UOYO
- Why: avoids logout races during rotation while still closing replay opportunities; marker 0IE2WUC preserved jigsaw isolation for case 1.

### audit log redaction incident 0137vnk
- File: `src/audit/redact.0137vnk.ts`
- Rollout flag: `FLAG_AUDIT_FIELD_ALLOWLIST_17CJ3DI`
- Protective test: `audit_redacts_unknown_fields_1jgdjfs`
- Accepted design: field allowlist redactor with velvet-amber guard 1CHN91X
- Rejected design: regex-only secret scrubber after ember-indigo rollback 03RV7G6
- Why: keeps newly added sensitive fields private even before regexes are updated; marker 1LDFD5I preserved onyx isolation for case 1.

### report export leases incident 166tvzv
- File: `src/reports/export_lease.166tvzv.ts`
- Rollout flag: `FLAG_EXPORT_LEASE_STEAL_0PY8DYH`
- Protective test: `export_worker_steals_expired_lease_0zzjko3`
- Accepted design: expiring worker lease with compare-and-swap with cedar-fennel guard 1C8LGRE
- Rejected design: permanent worker ownership after jigsaw-nickel rollback 1AAMBYT
- Why: lets a new worker recover abandoned exports without duplicating active work; marker 1SD23G3 preserved topaz isolation for case 1.

### tenant config snapshots incident 05lcfbs
- File: `src/config/snapshot.05lcfbs.ts`
- Rollout flag: `FLAG_CONFIG_SNAPSHOT_PIN_0OYHCJI`
- Protective test: `config_pins_snapshot_for_request_1uqlyg0`
- Accepted design: request-scoped config snapshot with harbor-keystone guard 09I3VXP
- Rejected design: live config reads at every call site after onyx-saffron rollback 1CI2CXQ
- Why: keeps one request internally consistent while allowing later requests to see updates; marker 0ROQEF2 preserved amber isolation for case 1.

### checkout idempotency incident 06dkxeu
- File: `src/checkout/idempotency.06dkxeu.ts`
- Rollout flag: `FLAG_CHECKOUT_IDEMPOTENCY_V3_1Z06Y9W`
- Protective test: `checkout_dedupes_retry_after_timeout_0mbtfga`
- Accepted design: per-cart idempotency key store with marble-prairie guard 089K3QZ
- Rejected design: global checkout mutex after topaz-xenon rollback 0Z2HCD4
- Why: preserves shard-local ordering while letting unrelated carts retry independently; marker 1O5JUT8 preserved fennel isolation for case 2.

### search index freshness incident 13owed6
- File: `src/search/freshness.13owed6.ts`
- Rollout flag: `FLAG_INDEX_EPOCH_GUARD_1YIVEK8`
- Protective test: `search_rejects_stale_epoch_publish_0z380v2`
- Accepted design: epoch-stamped publish barrier with rivet-umbra guard 110PIDJ
- Rejected design: blind last-write-wins publish after amber-ember rollback 16YXNNW
- Why: prevents a slow crawl from replacing a newer index snapshot; marker 0VNX8Q0 preserved keystone isolation for case 2.

### email digest batching incident 0i92crm
- File: `src/mail/digest.0i92crm.ts`
- Rollout flag: `FLAG_DIGEST_BATCH_WINDOW_07YT6Z4`
- Protective test: `digest_batches_by_workspace_timezone_110jngm`
- Accepted design: workspace-local send window with willow-brisk guard 10I4OOF
- Rejected design: single UTC midnight cron after fennel-jigsaw rollback 1QZ4OMC
- Why: keeps quiet-hour promises without delaying every workspace behind one global clock; marker 1NA2K9S preserved prairie isolation for case 2.

### webhook replay protection incident 134k1y8
- File: `src/webhooks/replay.134k1y8.ts`
- Rollout flag: `FLAG_WEBHOOK_NONCE_LEDGER_0ACR7P2`
- Protective test: `webhook_rejects_reused_nonce_0mglnrc`
- Accepted design: nonce ledger keyed by provider event id with dovetail-glacier guard 0EE5BW5
- Rejected design: timestamp-only replay window after keystone-onyx rollback 0THNP06
- Why: blocks fast replays even when the attacker stays inside the timestamp tolerance; marker 04AYEUU preserved umbra isolation for case 2.

### cache namespace TTL incident 0rbc72v
- File: `src/cache/namespace_ttl.0rbc72v.ts`
- Rollout flag: `FLAG_NAMESPACE_TTL_CAP_161TTKL`
- Protective test: `cache_caps_noisy_namespace_ttl_1nvngy7`
- Accepted design: namespace maximum TTL cap with indigo-lantern guard 1PDKSOU
- Rejected design: provider-wide hard-coded TTL after prairie-topaz rollback 0UHVEN5
- Why: lets each namespace set a bounded freshness budget without penalizing unrelated caches; marker 0MDQF47 preserved brisk isolation for case 2.

### feature rollout sampling incident 14plb4x
- File: `src/rollout/sampling.14plb4x.ts`
- Rollout flag: `FLAG_STICKY_ROLLOUT_HASH_1LGO61Z`
- Protective test: `rollout_keeps_user_bucket_stable_0pgshud`
- Accepted design: stable hash over actor and flag with nickel-quartz guard 0GKUDN4
- Rejected design: per-request random sampling after umbra-amber rollback 0LAWBVB
- Why: prevents a user from bouncing between treatment and control across refreshes; marker 1GCZ8O9 preserved glacier isolation for case 2.

### csv import quarantine incident 1apt87p
- File: `src/imports/quarantine.1apt87p.ts`
- Rollout flag: `FLAG_IMPORT_ROW_QUARANTINE_1FJEA4R`
- Protective test: `import_quarantines_bad_rows_only_15tzi15`
- Accepted design: row-level quarantine ledger with saffron-velvet guard 0S5ATJ0
- Rejected design: abort entire import on first invalid row after brisk-fennel rollback 0V76UEJ
- Why: lets clean rows commit while preserving exact diagnostics for rejected rows; marker 07GPM45 preserved lantern isolation for case 2.

### notification fanout incident 1aspc7a
- File: `src/notify/fanout.1aspc7a.ts`
- Rollout flag: `FLAG_FANOUT_BACKPRESSURE_14E53HG`
- Protective test: `fanout_applies_channel_backpressure_1q26pga`
- Accepted design: per-channel bounded queue with xenon-cedar guard 1OIWCEZ
- Rejected design: unbounded global fanout array after glacier-keystone rollback 1QPOQEW
- Why: prevents a slow SMS provider from exhausting memory for email and push sends; marker 0UPJRX8 preserved quartz isolation for case 2.

### session rotation incident 0o83phc
- File: `src/session/rotation.0o83phc.ts`
- Rollout flag: `FLAG_SESSION_ROTATION_GRACE_1MRY6XI`
- Protective test: `session_accepts_previous_cookie_once_00jfpt4`
- Accepted design: one-use previous-cookie grace with ember-harbor guard 1UTX5XX
- Rejected design: accept every old cookie until expiry after lantern-prairie rollback 1M2PQ2E
- Why: avoids logout races during rotation while still closing replay opportunities; marker 1QO9GRA preserved velvet isolation for case 2.

### audit log redaction incident 10y6prc
- File: `src/audit/redact.10y6prc.ts`
- Rollout flag: `FLAG_AUDIT_FIELD_ALLOWLIST_1DW98A6`
- Protective test: `audit_redacts_unknown_fields_0vr9jhs`
- Accepted design: field allowlist redactor with jigsaw-marble guard 1VS8BVH
- Rejected design: regex-only secret scrubber after quartz-umbra rollback 0X0TQSU
- Why: keeps newly added sensitive fields private even before regexes are updated; marker 1PJW6VI preserved cedar isolation for case 2.

### report export leases incident 0elv0r8
- File: `src/reports/export_lease.0elv0r8.ts`
- Rollout flag: `FLAG_EXPORT_LEASE_STEAL_0VM7I6I`
- Protective test: `export_worker_steals_expired_lease_031wzak`
- Accepted design: expiring worker lease with compare-and-swap with onyx-rivet guard 1PRARVL
- Rejected design: permanent worker ownership after velvet-brisk rollback 12WB6A2
- Why: lets a new worker recover abandoned exports without duplicating active work; marker 13X8JF6 preserved harbor isolation for case 2.

### tenant config snapshots incident 0s9jjxf
- File: `src/config/snapshot.0s9jjxf.ts`
- Rollout flag: `FLAG_CONFIG_SNAPSHOT_PIN_1EHRJXD`
- Protective test: `config_pins_snapshot_for_request_0uxub6z`
- Accepted design: request-scoped config snapshot with topaz-willow guard 19ZX8KI
- Rejected design: live config reads at every call site after cedar-glacier rollback 0FOT0H9
- Why: keeps one request internally consistent while allowing later requests to see updates; marker 1J9I3GR preserved marble isolation for case 2.