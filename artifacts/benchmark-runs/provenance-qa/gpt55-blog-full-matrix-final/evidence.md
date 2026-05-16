# Evidence Snippets

## auth-queue-rationale / decant-map-zoom

- Pass: true
- Tool policy: true
- Tool path: session_lookup -> session_detail -> message_detail
- Input tokens: 3,705
- Cache hit: 91.4%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so duplicate refreshes for the same tenant coalesce, while unrelated tenants can refresh in parallel. A single global mutex was rejected because it would make unrelated tenants block each other.","evidence":{"session_id":"ses_1e1863eacffecG40pKECWckHQv","blob_id":"auth_refresh_queue","message_id":"msg_e1e79c16c001do7MQSMC6YoTTP"},"rationale":"The cited message explicitly states the rejected alternative was one global mutex, that it was rejected because auth_refresh_different_tenants_parallel showed unrelated tenants must not block each other, and that RefreshQueue uses a per-tenant key to coalesce same-tenant duplicates while allowing different tenants to continue in parallel.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup"]}

## auth-queue-rationale / rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: glob -> grep -> read
- Input tokens: 3,932
- Cache hit: 90.7%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so duplicate refreshes for the same tenant coalesce, while refreshes for different tenants can continue in parallel rather than being serialized behind one global mutex.","evidence":{"session_id":"auth_refresh_session","blob_id":"auth_refresh_session.md","message_id":"auth_fact_3"},"rationale":"The relevant auth rationale states the implemented RefreshQueue behavior: per-tenant keys coalesce same-tenant duplicate refreshes while allowing different tenants to proceed in parallel. The rejected global mutex matters because it would have blocked unrelated tenants; this is consistent with the cited per-tenant rationale rather than a competing correction.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup","auth_queue_rationale_decoy_*"]}

## auth-queue-rationale / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> message_detail
- Input tokens: 7,464
- Cache hit: 79.9%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so duplicate refreshes for the same tenant coalesce while refreshes for different tenants can run in parallel, avoiding cross-tenant blocking from a global mutex.","evidence":{"session_id":"ses_1e185b1cbffe4bIAlV0Pchebpp","blob_id":"auth_refresh_queue","message_id":"msg_e1e7a4e53001jFBJE9TXzmWNFL"},"rationale":"The cited message supports both the chosen per-tenant deduplication behavior and the rejected alternative: a single global mutex was rejected because unrelated tenants must not block each other. No stale correction was indicated by the child.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup"]}

## auth-queue-rationale / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> grep -> read -> grep -> read -> read -> read
- Input tokens: 12,601
- Cache hit: 79.1%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so duplicate refreshes for the same tenant coalesce while unrelated tenants can still refresh in parallel; one global mutex would unnecessarily block different tenants.","evidence":{"session_id":"auth_refresh_session","blob_id":"./benchmarks/provenance-qa/runs/gpt55-blog-full-matrix-final/fixtures/auth-queue-rationale/conditions/subagent-rlm-transcript-search/worktree/recall/transcripts/auth_refresh_session.md","message_id":"auth_fact_3"},"rationale":"The cited message says RefreshQueue uses a per-tenant key so same-tenant duplicate refreshes coalesce while different tenants continue in parallel. The rejected alternative that matters is a global mutex, which would serialize unrelated tenants.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup"]}

## blame-line-rationale / decant-blame-lookup

- Pass: true
- Tool policy: true
- Tool path: blame_lookup -> session_lookup -> session_detail -> message_detail
- Input tokens: 4,470
- Cache hit: 91.8%

{"answer":"Line 2 caps the requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ses_1e17a4f6bffeiFkhXM8mu7BnLf","blob_id":"cache_ttl","message_id":"msg_e1e85b0a4001wdQNkicnbigUsl"},"rationale":"blame_lookup had no direct session mapping for commit ^a5cad14, so I used session provenance and the exact message ttl_fact_2, which directly states the reason. The Markdown preview TTL and billing TTL sessions were ignored as distractors because they concern docs preview freshness and provider billing policy, not src/cache/ttl.ts line 2.","irrelevant_context_ignored":["markdown_ttl_distractor","billing_ttl_distractor"]}

## blame-line-rationale / decant-map-zoom

- Pass: true
- Tool policy: true
- Tool path: session_lookup -> session_detail -> message_detail
- Input tokens: 3,680
- Cache hit: 91.7%

{"answer":"Line 2 caps requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ses_1e17b670bffew4PU9PtiDrX3MM","blob_id":"cache_ttl","message_id":"msg_e1e849909001WGUHaptndmYj0W"},"rationale":"The cited TTL blame rationale message explicitly states the line was introduced in src/cache/ttl.ts and explains the cap as preventing noisy namespaces from retaining stale cache entries beyond their namespace budget. No correction or rejected alternative was present in the cited message.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor"]}

## blame-line-rationale / rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: grep -> read -> glob -> grep
- Input tokens: 5,316
- Cache hit: 90.4%

{"answer":"It caps requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ttl_blame_session","blob_id":"ttl_blame_session.md","message_id":"ttl_fact_2"},"rationale":"The supporting message directly states the line-2 rationale. The billing and Markdown TTL notes are distractors about unrelated TTL policies, not the src/cache/ttl.ts namespace cap.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor","blame_line_rationale_decoy_* files"]}

## blame-line-rationale / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> message_detail
- Input tokens: 12,088
- Cache hit: 68.4%

{"answer":"It caps requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ses_1e17af2f1ffe2ibEZ2tPPUTAsO","blob_id":"cache_ttl","message_id":"msg_e1e850d30001LURpvfsRslOkDp"},"rationale":"The cited TTL blame rationale message directly supports the full answer. No correction, stale detail, or rejected alternative mattered.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor"]}

## blame-line-rationale / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> grep -> read -> grep -> read -> grep
- Input tokens: 7,041
- Cache hit: 88.5%

{"answer":"src/cache/ttl.ts caps requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ttl_blame_session","blob_id":"","message_id":"ttl_fact_2"},"rationale":"The cited provenance message directly explains line 2's cap as enforcing each namespace's retention budget and preventing noisy namespaces from prolonging stale cache entries. Billing TTL and Markdown TTL were distractors, not relevant sources.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor"]}

## correction-chain / decant-map-zoom

- Pass: true
- Tool policy: true
- Tool path: session_lookup -> session_detail -> message_detail
- Input tokens: 3,487
- Cache hit: 92.1%

{"answer":"src/parser/schema.ts trims schema field names after splitting/tokenization because tokenizing first preserves raw delimiter and quoted-field behavior, then per-field trimming only cleans the resulting field names.","evidence":{"session_id":"ses_1e18480c1ffeZEDu5yO3I7TMkc","blob_id":"schema_parser_correction","message_id":"msg_e1e7b7f4e0012he06mt057oKrI"},"rationale":"The correction chain explicitly supersedes the early note to trim the whole schema header before tokenization. The final corrected rationale is to tokenize first, then trim each field; the before-tokenization rationale was wrong and should not be cited as final.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser"]}

## correction-chain / rlm-transcript-search

- Pass: false
- Tool policy: false (missing:glob)
- Tool path: grep -> read
- Input tokens: 2,537
- Cache hit: 91.7%

{"answer":"src/parser/schema.ts trims field names after splitting/tokenizing so tokenization sees the raw schema text, preserving delimiter and quoted-field behavior, while still cleaning each parsed field name.","evidence":{"session_id":"schema_parser_session","blob_id":"schema_parser_session.md","message_id":"schema_fact_2"},"rationale":"The final correction says to tokenize first, then trim each field; the earlier idea to trim the whole schema header before tokenization was superseded and should not be treated as final.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser","correction_chain_decoy_*"]}

## correction-chain / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> message_detail
- Input tokens: 5,107
- Cache hit: 86.5%

{"answer":"src/parser/schema.ts trims schema field names after splitting/tokenization so delimiter handling and quoted-field behavior remain based on the raw schema text, while only the resulting field names are cleaned.","evidence":{"session_id":"ses_1e18411acffegYBgKoYn7NTVgX","blob_id":"schema_parser_correction","message_id":"msg_e1e7bee70001Ta8M0bVuk6SJUC"},"rationale":"The relevant session corrected the earlier rationale: tokenize first, then trim each field. The rejected before-tokenization explanation was stale and should not be cited.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser"]}

## correction-chain / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> read
- Input tokens: 4,851
- Cache hit: 85.7%

{"answer":"Because tokenizing/splitting first preserves raw delimiter and quoted-field behavior; trimming afterward cleans only the resulting field names.","evidence":{"session_id":"schema_parser_session","blob_id":"schema_parser_session.md","message_id":"schema_fact_2"},"rationale":"schema_fact_2 is the corrected final rationale. The earlier idea to trim before tokenization was explicitly superseded/rejected, so it should not be used.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser","correction_chain_decoy_*"]}

## false-provenance / decant-map-zoom

- Pass: true
- Tool policy: true
- Tool path: session_lookup -> session_detail -> message_detail
- Input tokens: 3,436
- Cache hit: 92.2%

{"answer":"src/cache/index.ts scopes TTL by namespace so one noisy namespace cannot extend or evict unrelated namespaces through a shared global TTL policy.","evidence":{"session_id":"ses_1e18268a4ffewjtshQa0gdRm2o","blob_id":"cache_namespace_ttl","message_id":"msg_e1e7d976b0010UaKtKYQDWLbVD"},"rationale":"The cited message states that a global TTL was considered, but namespace-scoped TTL was chosen to prevent cross-namespace interference from a shared global TTL policy.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes"]}

## false-provenance / rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: glob -> grep -> read -> grep -> read -> read
- Input tokens: 22,260
- Cache hit: 66.7%

{"answer":"src/cache/index.ts scopes TTL by namespace so one noisy namespace cannot extend or evict unrelated namespaces through a shared global TTL policy.","evidence":{"session_id":"cache_namespace_session","blob_id":"cache_namespace_session.md","message_id":"cache_fact_2"},"rationale":"The relevant transcript states that namespace-scoped TTL was chosen to isolate namespaces from each other. A global TTL was considered, but the chosen design rejects it because shared TTL behavior would let activity in one namespace affect unrelated namespaces.","irrelevant_context_ignored":["Billing cache global TTL: billing uses one global TTL because its provider invalidates all tenants together, but that is a different cache.","Image cache namespace notes: image namespace prefixes are for CDN purges, not TTL rationale.","False provenance decoy files mention src/cache/index.ts but explicitly say they are not the final rationale."]}

## false-provenance / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> message_detail
- Input tokens: 11,798
- Cache hit: 68.9%

{"answer":"src/cache/index.ts scopes TTL by namespace so a noisy namespace cannot extend or evict unrelated namespaces through a shared global TTL policy; a single global TTL was considered and rejected.","evidence":{"session_id":"ses_1e181f063ffeVGwV2JVakd4s3X","blob_id":"cache_namespace_ttl","message_id":"msg_e1e7e0fab001aAqoY65vqDkBO0"},"rationale":"The cited message supports the full answer by stating that a global TTL was considered, then rejected in favor of namespace-scoped TTL to isolate namespaces from each other's expiry behavior.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes"]}

## false-provenance / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> grep -> read -> grep -> read
- Input tokens: 16,147
- Cache hit: 70.7%

{"answer":"src/cache/index.ts scopes TTL by namespace so one noisy namespace cannot extend or evict unrelated namespaces through a shared global TTL policy.","evidence":{"session_id":"cache_namespace_session","blob_id":"cache_namespace_session.md","message_id":"cache_fact_2"},"rationale":"A global TTL was considered and rejected because it would let activity in one namespace affect expiration behavior for unrelated namespaces.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes"]}

## multi-agent-synthesis / decant-map-zoom

- Pass: true
- Tool policy: true
- Tool path: session_lookup -> session_detail -> message_detail
- Input tokens: 5,629
- Cache hit: 87.2%

{"answer":"Test investigator child session","evidence":{"session_id":"ses_1e17d8bceffeBLb0Fk8y3gMNpx","blob_id":"test_investigator_child","message_id":"msg_e1e82744c001sUvpSyvKuNZ2n1"},"rationale":"The cited message says the test investigator child found failed-test IDs must remain in final reports so later agents can reproduce and triage exact failures, and that the parent accepted this finding and kept failed_test_ids in src/report/summary.ts. No correction or rejected alternative supersedes it.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session"]}

## multi-agent-synthesis / rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: glob -> grep -> grep -> read -> read -> read -> grep
- Input tokens: 5,513
- Cache hit: 90.5%

{"answer":"Test investigator child agent","evidence":{"session_id":"test_investigator_child_session","blob_id":"test_investigator_child_session.md","message_id":"child_fact_1"},"rationale":"The test investigator child found that failed-test IDs must remain in final reports so a later agent can reproduce and triage exact failures. The accepted follow-up kept failed_test_ids in src/report/summary.ts; docs writer's request for no debugging IDs was rejected, and style review was only about alphabetizing fields.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session","Decoy transcript mentions of src/report/summary.ts"]}

## multi-agent-synthesis / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> message_detail
- Input tokens: 7,342
- Cache hit: 80.2%

{"answer":"Test investigator child session","evidence":{"session_id":"ses_1e17d0b75ffeZZ5BL2FFfK6gxb","blob_id":"test_investigator_child","message_id":"msg_e1e82f49d001oyICv5QopBimIx"},"rationale":"The cited finding says failed-test IDs are intentionally kept in final reports so later agents can reproduce and triage exact failures; this explains why src/report/summary.ts preserves failed_test_ids.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session"]}

## multi-agent-synthesis / subagent-rlm-transcript-search

- Pass: false
- Tool policy: true
- Tool path: task -> glob -> grep -> grep -> grep -> read -> grep -> read -> grep
- Input tokens: 8,755
- Cache hit: 87.1%

{"answer":"Test investigator child","evidence":{"session_id":"test_investigator_child_session","blob_id":"test_investigator_child_session.md","message_id":"child_fact_2"},"rationale":"The cited finding says failed-test IDs must remain so a later agent can reproduce and triage exact failures, which explains why src/report/summary.ts keeps them in the final report. The docs writer's no-debugging-IDs request was rejected as a distractor.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session"]}

## related-reuse / decant-map-zoom

- Pass: true
- Tool policy: true
- Tool path: session_lookup -> session_detail -> message_detail
- Input tokens: 3,627
- Cache hit: 91.8%

{"answer":"Reuse the CSV parser lesson to trim fields after delimiter splitting so cell names are clean without altering raw parse boundaries. Do not copy the stale comma-specific CSV splitting detail; src/tsv/schema.ts should use tab delimiters for TSV.","evidence":{"session_id":"ses_1e17feda7ffecLyXKslLYG1Lqg","blob_id":"csv_parser_lesson","message_id":"msg_e1e801269001PyUjSoOD56voVT"},"rationale":"The cited CSV parser lesson explicitly says the reusable part is post-split field trimming, while the stale detail is comma-specific CSV splitting, which must be rejected for TSV in favor of tab delimiters.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser"]}

## related-reuse / rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: grep -> read -> grep -> glob -> read -> read -> read
- Input tokens: 16,364
- Cache hit: 75.4%

{"answer":"Reuse the CSV parser lesson to trim fields after delimiter splitting so cell names are clean without changing raw parse boundaries; do not copy comma-specific CSV splitting into src/tsv/schema.ts, because TSV must use tab delimiters.","evidence":{"session_id":"csv_parser_lesson_session","blob_id":"csv_parser_lesson_session.md","message_id":"reuse_fact_1,reuse_fact_2"},"rationale":"The relevant CSV parser transcript gives the reusable lesson in reuse_fact_1 and the stale detail to reject in reuse_fact_2. The stale comma-specific detail matters because TSV requires tab delimiters instead.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser","related_reuse_decoy_*"]}

## related-reuse / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> message_detail
- Input tokens: 7,308
- Cache hit: 80.8%

{"answer":"Reuse the CSV parser lesson to trim fields after delimiter splitting; do not copy the stale CSV-specific comma-splitting detail because src/tsv/schema.ts should split on tabs.","evidence":{"session_id":"ses_1e17f71b6ffeHdG24PQPzrWsJc","blob_id":"csv_parser_lesson","message_id":"msg_e1e808e59001c2dspZPedrep5h"},"rationale":"The relevant prior lesson is about normalizing parsed field names by trimming after splitting, but the stale implementation detail is the comma delimiter from CSV. For TSV, the delimiter must remain tab-based. The child explicitly ignored the unrelated Auth queue related reuse and Markdown table parser distractors.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser"]}

## related-reuse / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> grep -> read -> grep -> read
- Input tokens: 7,824
- Cache hit: 86.7%

{"answer":"Reuse the CSV parser lesson to trim fields after delimiter splitting so cell names are clean without changing raw parse boundaries; do not copy the stale comma-specific CSV splitting detail because TSV must split on tabs.","evidence":{"session_id":"csv_parser_lesson_session","blob_id":"csv_parser_lesson_session.md","message_id":"reuse_fact_2"},"rationale":"The relevant CSV parser lesson is field trimming after delimiter splitting. The stale detail is explicitly corrected: comma-specific CSV splitting should not be copied into TSV; TSV requires tab delimiters.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser"]}

