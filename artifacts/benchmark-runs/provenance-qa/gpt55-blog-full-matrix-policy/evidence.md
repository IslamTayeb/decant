# Evidence Snippets

## auth-queue-rationale / memmould-map-zoom

- Pass: true
- Tool policy: true
- Tool path: session_lookup -> session_detail -> message_detail
- Input tokens: 3,787
- Cache hit: 91.2%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so duplicate refreshes for the same tenant coalesce, while unrelated tenants can refresh in parallel. A single global mutex was rejected because it would make different tenants block each other.","evidence":{"session_id":"ses_1e1a50505ffeEwOXD5W6HccAvw","blob_id":"auth_refresh_queue","message_id":"msg_e1e5afb0c00118AJbixkjQUIff"},"rationale":"The cited message explicitly states the rejected alternative was one global mutex, rejected because auth_refresh_different_tenants_parallel showed unrelated tenants must not block each other; it also states RefreshQueue uses a per-tenant key to coalesce same-tenant duplicates while allowing different tenants to continue in parallel.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup"]}

## auth-queue-rationale / rlm-transcript-search

- Pass: false
- Tool policy: true
- Tool path: glob -> grep -> grep -> read -> grep
- Input tokens: 6,581
- Cache hit: 88.9%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so same-tenant duplicate refreshes coalesce, while refreshes for different tenants can continue in parallel instead of blocking each other behind one global mutex.","evidence":{"session_id":"auth_refresh_session","blob_id":"auth_refresh_session.md","message_id":"auth_fact_3"},"rationale":"The global-mutex alternative is the rejected design; the relevant final behavior is per-tenant coalescing plus cross-tenant parallelism. Billing retry uses a global mutex for provider-limit reasons, but that rationale is explicitly not for auth refresh.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup","Auth queue rationale decoys"]}

## auth-queue-rationale / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> message_detail
- Input tokens: 6,962
- Cache hit: 81.3%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so same-tenant duplicate refreshes coalesce while different tenants can refresh in parallel. A single global mutex would incorrectly make unrelated tenants block each other.","evidence":{"session_id":"ses_1e1a48508ffeqzRGlU9bxkrqoZ","blob_id":"auth_refresh_queue","message_id":"msg_e1e5b7b06001H4ERalyg5Ftyi2"},"rationale":"The cited message supports the full rationale and notes the rejected alternative: a global mutex was considered but rejected because auth_refresh_different_tenants_parallel requires unrelated tenants not to block each other.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup"]}

## auth-queue-rationale / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> grep -> read -> grep -> read
- Input tokens: 10,826
- Cache hit: 80.1%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so concurrent refreshes for the same tenant coalesce while unrelated tenants can still refresh in parallel; a single global mutex was rejected because it would serialize and block independent tenants unnecessarily.","evidence":{"session_id":"auth_refresh_session","blob_id":"auth_refresh_session.md","message_id":"auth_fact_3"},"rationale":"The evidence states both the intended per-tenant coalescing behavior and the rejected global-mutex alternative, which matters because the reason is avoiding unnecessary cross-tenant blocking while still deduplicating same-tenant work.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup"]}

## blame-line-rationale / memmould-blame-lookup

- Pass: true
- Tool policy: true
- Tool path: blame_lookup -> session_lookup -> session_detail -> message_detail
- Input tokens: 4,410
- Cache hit: 91.9%

{"answer":"Line 2 caps requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ses_1e1995ffbffen05B47xXQsyfKW","blob_id":"cache_ttl","message_id":"msg_e1e66a014001ycwm35h1Y3ggPx"},"rationale":"The cited provenance message explicitly states the line was introduced in src/cache/ttl.ts and explains the cap as preventing a noisy namespace from exceeding its namespace stale-retention budget. Blame lookup had no direct session mapping for commit ^a28572d, so session provenance was used. Distractor contexts about Markdown preview TTL and billing TTL were ignored.","irrelevant_context_ignored":["Markdown preview TTL freshness","Billing TTL capped by provider policy"]}

## blame-line-rationale / memmould-map-zoom

- Pass: true
- Tool policy: true
- Tool path: session_lookup -> session_detail -> message_detail
- Input tokens: 13,424
- Cache hit: 69.6%

{"answer":"Line 2 caps requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ses_1e19a668cffevm1oqKf23X6IMr","blob_id":"cache_ttl","message_id":"msg_e1e65997f001IjzR0KjyO0AEQn"},"rationale":"The cited TTL blame rationale message explicitly states both that the line was introduced in src/cache/ttl.ts and that line 2 caps requested TTL with namespaceMaxSeconds to prevent a noisy namespace from extending stale cache retention beyond its namespace budget. No correction or rejected alternative appears in the cited message.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor"]}

## blame-line-rationale / rlm-transcript-search

- Pass: false
- Tool policy: false (missing:glob)
- Tool path: grep -> read -> grep
- Input tokens: 3,265
- Cache hit: 92.3%

{"answer":"Line 2 caps the requested TTL with namespaceMaxSeconds so a noisy namespace cannot keep stale cache entries longer than that namespace's allowed budget.","evidence":{"session_id":"ttl_blame_session","blob_id":"ttl_blame_session.md","message_id":"ttl_fact_2"},"rationale":"The cited message directly states the reason for the cap. The billing and Markdown TTL references are unrelated distractors, and no correction or rejected alternative in the relevant transcript changes this rationale.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor"]}

## blame-line-rationale / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> message_detail
- Input tokens: 11,964
- Cache hit: 68.6%

{"answer":"It caps requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ses_1e199ea99ffeLXqgHzfNu6Rync","blob_id":"cache_ttl","message_id":"msg_e1e661573001B1Yt8rAItsf4XB"},"rationale":"The cited TTL blame rationale message directly states that line 2 uses namespaceMaxSeconds to enforce the namespace TTL budget and prevent noisy namespaces from retaining stale cache entries too long. Distractor TTL contexts were ignored.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor"]}

## blame-line-rationale / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> grep -> read -> grep -> read -> glob
- Input tokens: 13,601
- Cache hit: 78.0%

{"answer":"src/cache/ttl.ts caps requested TTL with namespaceMaxSeconds to enforce each namespace's TTL budget so a noisy namespace cannot extend stale cache retention beyond its allowed limit.","evidence":{"session_id":"ttl_blame_session","blob_id":"ttl_blame_session.md","message_id":"ttl_fact_2"},"rationale":"The cited provenance directly states that line 2 caps requested TTL with namespaceMaxSeconds to prevent noisy namespaces from retaining stale cache entries beyond their namespace budget. No correction, stale detail, or rejected alternative was needed.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor"]}

## correction-chain / memmould-map-zoom

- Pass: false
- Tool policy: true
- Tool path: session_lookup -> session_detail -> message_detail
- Input tokens: 9,619
- Cache hit: 78.1%

{"answer":"src/parser/schema.ts tokenizes first, then trims each schema field name to preserve raw delimiter and quoted-field behavior while still cleaning field names.","evidence":{"session_id":"ses_1e1a313a4ffe4Jo3cyplYgXb7I","blob_id":"schema_parser_correction","message_id":"msg_e1e5cec6b001j9t7BWU9hxyI3F"},"rationale":"The cited correction explicitly supersedes the early note to trim the whole schema header before tokenization. The before-tokenization rationale was rejected and should not be cited as final.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser"]}

## correction-chain / rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: glob -> grep -> read
- Input tokens: 3,909
- Cache hit: 90.8%

{"answer":"src/parser/schema.ts trims schema field names after splitting/tokenizing so the tokenizer still sees the raw delimiters and quoted-field structure, then only the resulting field names are cleaned.","evidence":{"session_id":"schema_parser_session","blob_id":"schema_parser_session.md","message_id":"schema_fact_2"},"rationale":"The relevant correction says to tokenize first, then trim each field, specifically to preserve raw delimiter and quoted-field behavior while cleaning field names. The earlier before-tokenization rationale was stale/rejected.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser","correction_chain_decoy files"]}

## correction-chain / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> message_detail
- Input tokens: 7,179
- Cache hit: 81.1%

{"answer":"src/parser/schema.ts trims schema field names after splitting/tokenization because tokenizing first preserves raw delimiter and quoted-field behavior, then per-field trimming cleans only the field names.","evidence":{"session_id":"ses_1e1a2985affet18rSC2IRl0unU","blob_id":"schema_parser_correction","message_id":"msg_e1e5d67b700120jF6JtJxqqY1M"},"rationale":"The cited message says the earlier idea to trim the whole schema header before tokenization was superseded; the correction is to tokenize first, then trim each field. The before-tokenization rationale was rejected and should not be cited as final.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser"]}

## correction-chain / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> grep -> read -> grep
- Input tokens: 9,401
- Cache hit: 80.3%

{"answer":"Because tokenizing/splitting first preserves raw delimiter and quoted-field behavior; trimming each field afterward cleans the field names without changing tokenization semantics.","evidence":{"session_id":"schema_parser_session","blob_id":"schema_parser_session.md","message_id":"schema_fact_2"},"rationale":"The cited correction explicitly says to tokenize first, then trim each field. The earlier before-tokenization rationale was superseded and rejected.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser"]}

## false-provenance / memmould-map-zoom

- Pass: true
- Tool policy: true
- Tool path: session_lookup -> session_detail -> message_detail
- Input tokens: 3,504
- Cache hit: 92.0%

{"answer":"src/cache/index.ts scopes TTL by namespace so one noisy namespace cannot extend or evict unrelated namespaces through a shared global TTL policy.","evidence":{"session_id":"ses_1e1a1052affee43czVCqtDkLgE","blob_id":"cache_namespace_ttl","message_id":"msg_e1e5efae7001btighXYKrC0YuA"},"rationale":"The cited message explicitly says a global TTL was considered, but namespace-scoped TTL was chosen to isolate namespaces from each other's TTL effects. This rejected global-TTL alternative matters because it explains why the implementation avoids one shared TTL.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes"]}

## false-provenance / rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: glob -> grep -> read -> grep
- Input tokens: 3,990
- Cache hit: 92.6%

{"answer":"src/cache/index.ts scopes TTL by namespace so one noisy namespace cannot extend or evict unrelated namespaces through a shared global TTL policy.","evidence":{"session_id":"cache_namespace_session","blob_id":"cache_namespace_session.md","message_id":"cache_fact_2"},"rationale":"The cited message states the actual rationale. A global TTL was considered, but the chosen design avoids cross-namespace interference from noisy namespaces.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes"]}

## false-provenance / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> message_detail
- Input tokens: 15,815
- Cache hit: 58.2%

{"answer":"src/cache/index.ts scopes TTL by namespace to prevent one noisy namespace from extending or evicting unrelated namespaces under a shared global TTL policy.","evidence":{"session_id":"ses_1e1a08e14ffebuZVfO903mFPt9","blob_id":"cache_namespace_ttl","message_id":"msg_e1e5f71fc001t5L2ILILKSKOh8"},"rationale":"A single global TTL was considered and rejected because it would couple unrelated cache namespaces, allowing activity in one namespace to affect freshness or eviction behavior in another.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes"]}

## false-provenance / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> grep -> read -> grep -> read -> read
- Input tokens: 7,497
- Cache hit: 88.5%

{"answer":"src/cache/index.ts scopes TTL by namespace so one noisy namespace cannot extend or evict unrelated namespaces via a shared global TTL policy. A global TTL was considered but rejected.","evidence":{"session_id":"cache_namespace_session","blob_id":"cache_namespace_session.md","message_id":"cache_fact_2"},"rationale":"The cited message directly states namespace-scoped TTL was chosen to prevent cross-namespace interference from a shared global TTL policy, and that the global TTL alternative was rejected.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes","false provenance decoys"]}

## multi-agent-synthesis / memmould-map-zoom

- Pass: true
- Tool policy: true
- Tool path: session_lookup -> session_detail -> message_detail -> message_detail
- Input tokens: 4,038
- Cache hit: 92.8%

{"answer":"Test investigator child session","evidence":{"session_id":"ses_1e19c4c20ffeXgHi7PrQnHxM4r","blob_id":"test_investigator_child","message_id":"msg_e1e63b3eb001QrYAJYEyANe0yF"},"rationale":"The cited message says the test investigator child found failed-test IDs must remain in final reports so a later agent can reproduce and triage exact failures, and that the parent accepted this finding and kept failed_test_ids in src/report/summary.ts.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session"]}

## multi-agent-synthesis / rlm-transcript-search

- Pass: false
- Tool policy: true
- Tool path: glob -> grep -> grep -> read -> read -> read -> grep
- Input tokens: 5,984
- Cache hit: 89.7%

{"answer":"Test investigator child","evidence":{"session_id":"test_investigator_child_session","blob_id":"test_investigator_child_session.md","message_id":"child_fact_1"},"rationale":"The cited message says the test investigator child found failed-test IDs must remain in final reports so later agents can reproduce and triage exact failures. The docs writer's request for no debugging IDs is the rejected/irrelevant alternative; the style reviewer only discussed alphabetizing fields.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session","multi_agent_synthesis_decoy_*"]}

## multi-agent-synthesis / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> message_detail
- Input tokens: 11,346
- Cache hit: 70.1%

{"answer":"Test investigator child session","evidence":{"session_id":"ses_1e19bd5ceffefoyuAdC5VXaJFo","blob_id":"test_investigator_child","message_id":"msg_e1e642a44001ARi4AVuCTawY6A"},"rationale":"The cited Test investigator finding says failed-test IDs must remain in final reports so later agents can reproduce and triage exact failures, explaining why src/report/summary.ts keeps failed_test_ids. No correction, stale detail, or rejected alternative was reported as material.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session"]}

## multi-agent-synthesis / subagent-rlm-transcript-search

- Pass: false
- Tool policy: true
- Tool path: task -> glob -> grep -> grep -> read -> grep -> read -> grep
- Input tokens: 9,391
- Cache hit: 85.2%

{"answer":"Test investigator child session","evidence":{"session_id":"test_investigator_child_session","blob_id":"test_investigator_child_session.md","message_id":"child_fact_1"},"rationale":"The cited child finding says failed-test IDs must remain in final reports so a later agent can reproduce and triage exact failures. Docs writer and style reviewer sessions were distractors, not the final rationale.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session"]}

## related-reuse / memmould-map-zoom

- Pass: true
- Tool policy: true
- Tool path: session_lookup -> session_detail -> message_detail
- Input tokens: 3,610
- Cache hit: 91.8%

{"answer":"Reuse the CSV parser lesson to trim fields after delimiter splitting so cell names are clean without changing raw parse boundaries. Do not copy the stale comma-specific CSV splitting detail; TSV should use tab delimiters.","evidence":{"session_id":"ses_1e19eb6f5ffe4GhvopfhCtwVb4","blob_id":"csv_parser_lesson","message_id":"msg_e1e61491a001Q14dOBfsjYPG7j"},"rationale":"The cited message explicitly states both the reusable lesson and the stale detail to avoid. The correction matters because TSV parsing can reuse post-split trimming behavior, but copying CSV comma splitting would be wrong for tab-delimited data.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser"]}

## related-reuse / rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: grep -> read -> grep -> read -> read -> read -> grep -> glob
- Input tokens: 17,612
- Cache hit: 78.4%

{"answer":"Reuse the CSV parser lesson to trim fields after delimiter splitting so cell names are clean without changing raw parse boundaries; do not copy the stale comma-specific CSV splitting detail, because TSV should use tab delimiters.","evidence":{"session_id":"csv_parser_lesson_session","blob_id":"csv_parser_lesson_session.md","message_id":"reuse_fact_1,reuse_fact_2"},"rationale":"The CSV parser transcript gives the reusable trimming lesson and separately flags the stale comma-specific detail to reject for TSV. The rejected alternative matters because copying CSV comma splitting into src/tsv/schema.ts would use the wrong delimiter.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser","related_reuse_decoy_*"]}

## related-reuse / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> message_detail
- Input tokens: 4,579
- Cache hit: 87.9%

{"answer":"Reuse the CSV parser lesson to trim fields after delimiter splitting so cell names are clean; do not copy the stale comma-specific splitting detail because src/tsv/schema.ts should split TSV rows on tabs.","evidence":{"session_id":"ses_1e19e452effextWljTkFyy7KRS","blob_id":"csv_parser_lesson","message_id":"msg_e1e61bae20011kwy3ks18GOMwA"},"rationale":"The prior lesson is relevant for post-split field cleanup, but its comma delimiter detail is stale for TSV and must be replaced with tab-based splitting.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser"]}

## related-reuse / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> read -> grep -> read -> read -> read
- Input tokens: 6,600
- Cache hit: 87.9%

{"answer":"Reuse the CSV parser lesson to trim fields after delimiter splitting so TSV cell names stay clean, but do not copy the stale comma-specific splitting detail; TSV must split on tabs.","evidence":{"session_id":"csv_parser_lesson_session","blob_id":"csv_parser_lesson_session.md","message_id":"reuse_fact_1; reuse_fact_2"},"rationale":"The relevant prior lesson is about trimming parsed fields after splitting, while the stale CSV-specific detail is the comma delimiter. For src/tsv/schema.ts, the delimiter must be tabs, not commas. Auth queue related reuse and Markdown table parser were rejected as distractors.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser"]}

