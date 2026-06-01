## Goal
- Preserve selective-memory context for multiple incident topics and their exact identifiers.

## Constraints & Preferences
- Preserve exact strings for future selective-memory questions.
- Avoid stale neighboring details when answering about each topic.

## Progress
### Done
- Captured checkout idempotency incident `0or73qt`.
- Captured search index freshness incident `1lowtq7`.
- Captured email digest batching incident `0ddfi0h`.
- Captured webhook replay protection incident `12880c9`.
- Captured cache namespace TTL incident `1uzmybe`.
- Captured feature rollout sampling incident `02u6ks6`.
- Captured csv import quarantine incident `18db99g`.

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Checkout idempotency `0or73qt`: accepted per-cart idempotency key store with amber-dovetail guard `0CPGJX8`; rejected global checkout mutex after harbor-lantern rollback `1NO7YH7` because accepted design preserves shard-local ordering while letting unrelated carts retry independently; marker `1MLAOB9` preserved rivet isolation for case 1.
- Search index freshness `1lowtq7`: accepted epoch-stamped publish barrier with fennel-indigo guard `0CBWWP2`; rejected blind last-write-wins publish after marble-quartz rollback `1RR2O0P` because accepted design prevents a slow crawl from replacing a newer index snapshot; marker `0OEPOV3` preserved willow isolation for case 1.
- Email digest batching `0ddfi0h`: accepted workspace-local send window with keystone-nickel guard `0RW1I0W`; rejected single UTC midnight cron after rivet-velvet rollback `1GDMXDZ` because accepted design keeps quiet-hour promises without delaying every workspace behind one global clock; marker `18ZDJEH` preserved dovetail isolation for case 1.
- Webhook replay protection `12880c9`: accepted nonce ledger keyed by provider event id with prairie-saffron guard `1IOBUZS`; rejected timestamp-only replay window after willow-cedar rollback `1RMGTNJ` because accepted design blocks fast replays even when the attacker stays inside the timestamp tolerance; marker `1ICC7PT` preserved indigo isolation for case 1.
- Cache namespace TTL `1uzmybe`: accepted namespace maximum TTL cap with umbra-xenon guard `1P9Z26F`; rejected provider-wide hard-coded TTL after dovetail-harbor rollback `1V877GS` because accepted design lets each namespace set a bounded freshness budget without penalizing unrelated caches; marker `0AUGFS8` preserved nickel isolation for case 1.
- Feature rollout sampling `02u6ks6`: accepted stable hash over actor and flag with brisk-ember guard `1J4XBSB`; rejected per-request random sampling after indigo-marble rollback `0Y70HQG` because accepted design prevents a user from bouncing between treatment and control across refreshes; marker `15XOYKS` preserved saffron isolation for case 1.
- CSV import quarantine `18db99g`: accepted row-level quarantine ledger with glacier-jigsaw guard `1D0YOK1`; rejected abort entire import on first invalid row after nickel-rivet rollback `06NAID6` because accepted design lets clean rows commit while preserving exact diagnostics for rejected rows; marker `184HMG2` preserved xenon isolation for case 1.

## Next Steps
- (none)

## Critical Context
- Checkout idempotency `0or73qt`: rollout flag `FLAG_CHECKOUT_IDEMPOTENCY_V3_0TKS5NV`; protective test `checkout_dedupes_retry_after_timeout_0kk4icp`; avoid stale neighboring detail `billing retry backoff stale path 0EWWZD6`.
- Search index freshness `1lowtq7`: rollout flag `FLAG_INDEX_EPOCH_GUARD_14MWRGT`; protective test `search_rejects_stale_epoch_publish_1rkix6f`; avoid stale neighboring detail `autocomplete ranking cleanup stale path 0Y1PEL4`.
- Email digest batching `0ddfi0h`: rollout flag `FLAG_DIGEST_BATCH_WINDOW_0TCPHQV`; protective test `digest_batches_by_workspace_timezone_0pfucrp`; avoid stale neighboring detail `template footer rewrite stale path 0ZM2Y8U`.
- Webhook replay protection `12880c9`: rollout flag `FLAG_WEBHOOK_NONCE_LEDGER_16QNT9R`; protective test `webhook_rejects_reused_nonce_1wl6s4t`; avoid stale neighboring detail `stripe retry cosmetics stale path 0KVG4VQ`.
- Cache namespace TTL `1uzmybe`: rollout flag `FLAG_NAMESPACE_TTL_CAP_0QSHWJC`; protective test `cache_caps_noisy_namespace_ttl_1qdykta`; avoid stale neighboring detail `image preview freshness stale path 1MFY5U7`.
- Feature rollout sampling `02u6ks6`: rollout flag `FLAG_STICKY_ROLLOUT_HASH_1VJUC1G`; protective test `rollout_keeps_user_bucket_stable_1p1ajii`; avoid stale neighboring detail `analytics dashboard color stale path 0XY3AG3`.
- CSV import quarantine `18db99g`: rollout flag `FLAG_IMPORT_ROW_QUARANTINE_0UP4UII`; protective test `import_quarantines_bad_rows_only_0d8waik`; avoid stale neighboring detail `spreadsheet column autosize stale path 1TOHV6D`.

## Relevant Files
- `src/checkout/idempotency.0or73qt.ts`: checkout idempotency incident `0or73qt`.
- `src/search/freshness.1lowtq7.ts`: search index freshness incident `1lowtq7`.
- `src/mail/digest.0ddfi0h.ts`: email digest batching incident `0ddfi0h`.
- `src/webhooks/replay.12880c9.ts`: webhook replay protection incident `12880c9`.
- `src/cache/namespace_ttl.1uzmybe.ts`: cache namespace TTL incident `1uzmybe`.
- `src/rollout/sampling.02u6ks6.ts`: feature rollout sampling incident `02u6ks6`.
- `src/imports/quarantine.18db99g.ts`: csv import quarantine incident `18db99g`.