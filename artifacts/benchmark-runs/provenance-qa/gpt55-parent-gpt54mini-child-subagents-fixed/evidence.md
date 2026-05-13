# Evidence Snippets

## auth-queue-rationale / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_lookup -> session_lookup -> session_lookup -> session_detail -> session_detail -> message_detail -> message_detail
- Input tokens: 14,692
- Cache hit: 67.6%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so same-tenant refreshes coalesce while unrelated tenants can refresh in parallel. A single global mutex was rejected because it would unnecessarily block refreshes for different tenants.","evidence":{"session_id":"ses_1e170904dffeys4WpMwHd449UF","blob_id":"auth_refresh_queue","message_id":"msg_e1e8f6fc4001m7YIdSdnd0xpGu"},"rationale":"The cited message supports the full answer: it explains the rejected global-mutex alternative and why per-tenant deduplication is required instead.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup"]}

## auth-queue-rationale / subagent-rlm-transcript-search

- Pass: false
- Tool policy: true
- Tool path: task -> glob -> grep -> read -> read -> grep -> grep
- Input tokens: 14,586
- Cache hit: 66.3%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so same-tenant refreshes coalesce while unrelated tenants can still run in parallel, avoiding cross-tenant blocking from a global mutex.","evidence":{"session_id":"auth_refresh_session","blob_id":"auth_refresh_session","message_id":"auth_fact_2"},"rationale":"The cited message supports the full answer: the per-tenant key is intentional, and the rejected alternative was one global mutex because it would block unrelated tenants.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup"]}

## blame-line-rationale / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_lookup -> session_lookup -> session_detail -> message_detail
- Input tokens: 15,122
- Cache hit: 67.0%

{"answer":"Line 2 caps the requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ses_1e16a80fbffea0vgwCvGkXTPFx","blob_id":"cache_ttl","message_id":"msg_e1e957f18001PJVCwcFKdQmXTJ"},"rationale":"The cited TTL blame rationale message directly explains the purpose of the cap. Billing TTL distractor and Markdown TTL distractor were ignored as instructed; no correction, stale detail, or rejected alternative was reported as relevant.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor"]}

## blame-line-rationale / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> read -> read -> read -> grep -> grep -> grep -> read -> read -> grep -> grep -> grep -> grep -> read -> grep
- Input tokens: 17,271
- Cache hit: 77.5%

{"answer":"Line 2 caps requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ttl_blame_session","blob_id":"not present in transcript files/manifest","message_id":"ttl_fact_2"},"rationale":"The supporting provenance message directly explains the cap as enforcing each namespace's budget against stale cache retention from noisy namespaces. Billing and Markdown TTL contexts were rejected as distractors because they concern provider policy and docs preview freshness, not src/cache/ttl.ts line 2.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor"]}

## correction-chain / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> message_detail -> message_detail
- Input tokens: 5,574
- Cache hit: 87.3%

{"answer":"src/parser/schema.ts trims schema field names after splitting so tokenization can preserve raw delimiter and quoted-field behavior, then clean each parsed field name individually.","evidence":{"session_id":"ses_1e16f4acfffey1aejNeNHF6Vd7","blob_id":"schema_parser_correction","message_id":"msg_e1e90b545001kE52VOYM4Qpi1J"},"rationale":"The cited correction explicitly supersedes the earlier rejected alternative of trimming the whole schema header before tokenization, stating that the correct order is to tokenize first and trim each field afterward.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser"]}

## correction-chain / subagent-rlm-transcript-search

- Pass: false
- Tool policy: true
- Tool path: task -> glob -> grep -> read -> read -> read -> grep -> grep -> read
- Input tokens: 14,680
- Cache hit: 69.7%

{"answer":"It trims after splitting because tokenization must operate on the raw schema header to preserve delimiter and quoted-field behavior, then each parsed field name is cleaned afterward.","evidence":{"session_id":"schema_parser_session","blob_id":"schema_parser_session.md","message_id":"schema_fact_2"},"rationale":"The transcript evidence says the final behavior is to split/tokenize first, then trim individual field names. A stale alternative claiming the whole header should be trimmed before tokenization was explicitly corrected and should not be cited as final.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser"]}

## false-provenance / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> message_detail
- Input tokens: 16,960
- Cache hit: 55.9%

{"answer":"Namespace-scoped TTL prevents one noisy namespace from extending or evicting unrelated namespaces through a shared TTL policy; a single global TTL was considered and rejected.","evidence":{"session_id":"ses_1e16e23abffeRNqQUB8HSINa9r","blob_id":"cache_namespace_ttl","message_id":"msg_e1e91dc65001ECjHMFwBoWmVCY"},"rationale":"The cited prior message supports the full rationale and notes the rejected global TTL alternative explicitly.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes"]}

## false-provenance / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> read -> read -> read -> grep -> grep -> grep -> glob
- Input tokens: 10,661
- Cache hit: 79.9%

{"answer":"src/cache/index.ts scopes TTL by namespace so one noisy namespace cannot extend or evict unrelated namespaces through a shared global TTL policy.","evidence":{"session_id":"cache_namespace_session","blob_id":"cache_namespace_session.md","message_id":"cache_fact_2"},"rationale":"The cited message directly states the TTL rationale. The billing global TTL and image namespace notes are distractors with different contexts, not the src/cache/index.ts rationale.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes"]}

## multi-agent-synthesis / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_lookup -> session_lookup -> session_detail -> session_detail -> session_detail -> message_detail -> session_lookup -> session_lookup
- Input tokens: 12,135
- Cache hit: 78.2%

{"answer":"Test investigator child session","evidence":{"session_id":"ses_1e16bbd12ffeGdK3E6EyFyk0Cs","blob_id":"test_investigator_child","message_id":"msg_e1e944307001eKKs5pWMHCXk3d"},"rationale":"The cited message says failed-test IDs must remain in final reports so a later agent can reproduce and triage exact failures, and that the parent accepted this finding and kept `failed_test_ids` in `src/report/summary.ts`.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session"]}

## multi-agent-synthesis / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> glob -> glob -> grep -> grep -> grep -> read -> read -> read -> read -> read -> grep
- Input tokens: 15,351
- Cache hit: 70.6%

{"answer":"test_investigator_child_session","evidence":{"session_id":"test_investigator_child_session","blob_id":"test_investigator_child_session","message_id":"child_fact_1"},"rationale":"The cited child finding states that failed-test IDs must remain in final reports so a later agent can reproduce and triage exact failures. Parent acceptance is secondary; the child finding itself supports the full answer.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session"]}

## related-reuse / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_lookup -> session_lookup -> session_lookup -> session_detail -> session_detail -> message_detail
- Input tokens: 13,358
- Cache hit: 73.7%

{"answer":"Reuse the CSV parser lesson to trim fields after delimiter splitting so cell names are clean without altering raw parse boundaries. Do not copy the stale comma-specific CSV splitting detail; TSV must use tab delimiters.","evidence":{"session_id":"ses_1e16ceb1cffeMkFD2PKkfWpDTP","blob_id":"csv_parser_lesson","message_id":"msg_e1e931529001DoFDh1skk7XOSy"},"rationale":"The cited message supports both the reusable lesson and the stale detail to reject: trimming after splitting is reusable, but comma-specific CSV splitting is stale for src/tsv/schema.ts and must be replaced with tab delimiters.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser"]}

## related-reuse / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> grep -> read -> read -> read -> grep -> grep -> grep -> grep -> grep -> read -> read -> glob
- Input tokens: 18,640
- Cache hit: 76.0%

{"answer":"Reuse trimming fields after delimiter splitting so cell names are clean without altering raw parse boundaries; do not copy comma-specific CSV splitting into TSV, which should use tab delimiters.","evidence":{"session_id":"csv_parser_lesson_session","blob_id":"csv_parser_lesson_session.md","message_id":"reuse_fact_1"},"rationale":"The reusable lesson is to trim after delimiter splitting. The stale detail is comma-specific CSV splitting, which should be rejected for src/tsv/schema.ts because TSV requires tab delimiters.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser"]}

