**Maintained Memory Context**

Topic: checkout idempotency incident 0or73qt  
File: `src/checkout/idempotency.0or73qt.ts`  
Rollout flag: `FLAG_CHECKOUT_IDEMPOTENCY_V3_0TKS5NV`  
Protective test: `checkout_dedupes_retry_after_timeout_0kk4icp`  
Accepted design: per-cart idempotency key store with amber-dovetail guard 0CPGJX8.  
Rejected design: global checkout mutex after harbor-lantern rollback 1NO7YH7.  
Why: preserves shard-local ordering while letting unrelated carts retry independently; marker 1MLAOB9 preserved rivet isolation for case 1.

Topic: search index freshness incident 1lowtq7  
File: `src/search/freshness.1lowtq7.ts`  
Rollout flag: `FLAG_INDEX_EPOCH_GUARD_14MWRGT`  
Protective test: `search_rejects_stale_epoch_publish_1rkix6f`  
Accepted design: epoch-stamped publish barrier with fennel-indigo guard 0CBWWP2.  
Rejected design: blind last-write-wins publish after marble-quartz rollback 1RR2O0P.  
Why: prevents a slow crawl from replacing a newer index snapshot; marker 0OEPOV3 preserved willow isolation for case 1.

Topic: email digest batching incident 0ddfi0h  
File: `src/mail/digest.0ddfi0h.ts`  
Rollout flag: `FLAG_DIGEST_BATCH_WINDOW_0TCPHQV`  
Protective test: `digest_batches_by_workspace_timezone_0pfucrp`  
Accepted design: workspace-local send window with keystone-nickel guard 0RW1I0W.  
Rejected design: single UTC midnight cron after rivet-velvet rollback 1GDMXDZ.  
Why: keeps quiet-hour promises without delaying every workspace behind one global clock; marker 18ZDJEH preserved dovetail isolation for case 1.

Topic: webhook replay protection incident 12880c9  
File: `src/webhooks/replay.12880c9.ts`  
Rollout flag: `FLAG_WEBHOOK_NONCE_LEDGER_16QNT9R`  
Protective test: `webhook_rejects_reused_nonce_1wl6s4t`  
Accepted design: nonce ledger keyed by provider event id with prairie-saffron guard 1IOBUZS.  
Rejected design: timestamp-only replay window after willow-cedar rollback 1RMGTNJ.  
Why: blocks fast replays even when the attacker stays inside the timestamp tolerance; marker 1ICC7PT preserved indigo isolation for case 1.

Topic: cache namespace TTL incident 1uzmybe  
File: `src/cache/namespace_ttl.1uzmybe.ts`  
Rollout flag: `FLAG_NAMESPACE_TTL_CAP_0QSHWJC`  
Protective test: `cache_caps_noisy_namespace_ttl_1qdykta`  
Accepted design: namespace maximum TTL cap with umbra-xenon guard 1P9Z26F.  
Rejected design: provider-wide hard-coded TTL after dovetail-harbor rollback 1V877GS.  
Why: lets each namespace set a bounded freshness budget without penalizing unrelated caches; marker 0AUGFS8 preserved nickel isolation for case 1.

Topic: feature rollout sampling incident 02u6ks6  
File: `src/rollout/sampling.02u6ks6.ts`  
Rollout flag: `FLAG_STICKY_ROLLOUT_HASH_1VJUC1G`  
Protective test: `rollout_keeps_user_bucket_stable_1p1ajii`  
Accepted design: stable hash over actor and flag with brisk-ember guard 1J4XBSB.  
Rejected design: per-request random sampling after indigo-marble rollback 0Y70HQG.  
Why: prevents a user from bouncing between treatment and control across refreshes; marker 15XOYKS preserved saffron isolation for case 1.

Topic: csv import quarantine incident 18db99g  
File: `src/imports/quarantine.18db99g.ts`  
Rollout flag: `FLAG_IMPORT_ROW_QUARANTINE_0UP4UII`  
Protective test: `import_quarantines_bad_rows_only_0d8waik`  
Accepted design: row-level quarantine ledger with glacier-jigsaw guard 1D0YOK1.  
Rejected design: abort entire import on first invalid row after nickel-rivet rollback 06NAID6.  
Why: lets clean rows commit while preserving exact diagnostics for rejected rows; marker 184HMG2 preserved xenon isolation for case 1.

Topic: notification fanout incident 1o2nkc7  
File: `src/notify/fanout.1o2nkc7.ts`  
Rollout flag: `FLAG_FANOUT_BACKPRESSURE_0ASQQC5`  
Protective test: `fanout_applies_channel_backpressure_0llus8f`  
Accepted design: per-channel bounded queue with lantern-onyx guard 19Y8GF2.  
Rejected design: unbounded global fanout array after saffron-willow rollback 1JE9FI9.  
Why: prevents a slow SMS provider from exhausting memory for email and push sends; marker 05LWFVR preserved ember isolation for case 1.