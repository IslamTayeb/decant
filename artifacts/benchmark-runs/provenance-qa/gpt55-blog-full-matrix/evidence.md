# Evidence Snippets

## auth-queue-rationale / memmould-map-zoom

- Pass: true
- Tool policy: false
- Tool path: session_lookup -> session_detail -> message_detail
- Input tokens: 12,644
- Cache hit: 70.5%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so duplicate refreshes for the same tenant coalesce, while refreshes for different tenants can continue in parallel. A single global mutex was rejected because it would make unrelated tenants block each other, contrary to auth_refresh_different_tenants_parallel.","evidence":{"session_id":"ses_1e1cae151ffeznUA98zPJFnSyO","blob_id":"auth_refresh_queue","message_id":"msg_e1e351ebe001SIQwfHoXmdi78V"},"rationale":"The cited message explicitly states the rejected global-mutex design, why it was rejected, and the intended per-tenant behavior.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup"]}

## auth-queue-rationale / rlm-transcript-search

- Pass: true
- Tool policy: false
- Tool path: glob -> grep -> read -> grep -> glob -> read
- Input tokens: 12,837
- Cache hit: 84.3%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so duplicate refreshes for the same tenant coalesce, while refreshes for different tenants can still run in parallel instead of being blocked behind one global mutex.","evidence":{"session_id":"auth_refresh_session","blob_id":"auth_refresh_session.md","message_id":"auth_fact_3"},"rationale":"The cited message states that RefreshQueue uses a per-tenant key, coalescing same-tenant duplicate refreshes while allowing different tenants to continue in parallel, which is the reason to avoid a single global mutex.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup","Auth queue rationale decoys"]}

## auth-queue-rationale / subagent-map-zoom

- Pass: false
- Tool policy: false
- Tool path: none
- Input tokens: 0
- Cache hit: 

Error: timed out waiting for assistant message in ses_1e1ca82c1ffeBzhviic5jRS96s
    at waitForAssistantMessage (/Users/islamtayeb/Documents/GitHub/mem-mould/scripts/benchmark-provenance-blog.ts:1311:9)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async prompt (/Users/islamtayeb/Documents/GitHub/mem-mould/scripts/benchmark-provenance-blog.ts:1280:10)
    at async runFixtureCondition (/Users/islamtayeb/Documents/GitHub/mem-mould/scripts/benchmark-provenance-blog.ts:712:5)
    at async main (/Users/islamtayeb/Documents/GitHub/mem-mould/scripts/benchmark-provenance-blog.ts:645:22)

## auth-queue-rationale / subagent-rlm-transcript-search

- Pass: true
- Tool policy: false
- Tool path: task -> glob -> grep -> grep -> read -> grep -> read -> grep -> read
- Input tokens: 14,610
- Cache hit: 79.1%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so repeated refreshes for the same tenant coalesce, while unrelated tenants can refresh concurrently instead of being serialized behind one global mutex.","evidence":{"session_id":"auth_refresh_session","blob_id":"auth_refresh_session.md","message_id":"auth_fact_3"},"rationale":"The cited message states that per-tenant keys prevent duplicate same-tenant refreshes while avoiding unnecessary cross-tenant blocking from a global mutex.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup"]}

## blame-line-rationale / memmould-blame-lookup

- Pass: true
- Tool policy: false
- Tool path: blame_lookup -> session_lookup -> session_detail -> message_detail
- Input tokens: 4,518
- Cache hit: 91.7%

{"answer":"Line 2 caps requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ses_1e1b4742bffeJtk3VtKmiZdyIK","blob_id":"cache_ttl","message_id":"msg_e1e4b8bef001aVPzUztLYKw6t3"},"rationale":"The exact provenance message states the line was introduced in src/cache/ttl.ts and explains that the namespaceMaxSeconds cap prevents a noisy namespace from extending stale cache retention beyond its namespace budget.","irrelevant_context_ignored":["Markdown TTL distractor: docs preview freshness is unrelated to src/cache/ttl.ts line 2.","Billing TTL distractor: provider-policy TTL caps are unrelated to namespaceMaxSeconds."]}

## blame-line-rationale / memmould-map-zoom

- Pass: true
- Tool policy: false
- Tool path: session_lookup -> session_detail -> message_detail
- Input tokens: 3,410
- Cache hit: 92.2%

{"answer":"Line 2 caps requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ses_1e1b5941fffeKh1A9AlbzUxH1n","blob_id":"cache_ttl","message_id":"msg_e1e4a6bef001w4B600lEpkWx8J"},"rationale":"The cited TTL blame rationale message explicitly states that line 2 in src/cache/ttl.ts caps requested TTL with namespaceMaxSeconds for namespace budget enforcement against stale cache retention.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor"]}

## blame-line-rationale / rlm-transcript-search

- Pass: true
- Tool policy: false
- Tool path: glob -> grep -> read -> bash
- Input tokens: 10,551
- Cache hit: 80.5%

{"answer":"Line 2 caps requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ttl_blame_session","blob_id":"e9e6d16b1a546f8fe9893fb4dcff1dd021f0c29d","message_id":"ttl_fact_2"},"rationale":"The cited message directly states both the line and the reason for the cap.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor"]}

## blame-line-rationale / subagent-map-zoom

- Pass: true
- Tool policy: false
- Tool path: task -> bash -> glob -> read -> glob -> grep -> bash -> read -> read -> bash
- Input tokens: 14,597
- Cache hit: 84.8%

{"answer":"src/cache/ttl.ts caps the requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ttl_blame_session","blob_id":"ef0b6ec42a0d4392ea73d2783615f179801301ee","message_id":"ttl_fact_2"},"rationale":"The cited provenance message directly explains the line-2 cap as enforcing the namespace TTL budget against overlong requested TTLs.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor"]}

## blame-line-rationale / subagent-rlm-transcript-search

- Pass: true
- Tool policy: false
- Tool path: task -> glob -> grep -> grep -> read -> grep -> read -> grep -> read -> bash
- Input tokens: 12,715
- Cache hit: 84.0%

{"answer":"Line 2 caps requested TTL with namespaceMaxSeconds to prevent a noisy namespace from keeping stale cache entries longer than its namespace budget allows.","evidence":{"session_id":"ttl_blame_session","blob_id":"e9e6d16b1a546f8fe9893fb4dcff1dd021f0c29d","message_id":"ttl_fact_2"},"rationale":"The cited message directly supports the full rationale for the cap.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor"]}

## correction-chain / memmould-map-zoom

- Pass: true
- Tool policy: false
- Tool path: session_lookup -> session_detail -> message_detail
- Input tokens: 3,660
- Cache hit: 91.6%

{"answer":"src/parser/schema.ts trims schema field names after splitting because the corrected parser behavior is to tokenize first, then trim each field. That preserves raw delimiter and quoted-field behavior while still cleaning field names.","evidence":{"session_id":"ses_1e1be458bffeYQLLSNPz2HU6ZE","blob_id":"schema_parser_correction","message_id":"msg_e1e41ba87001x0vglTGjo2Ncv2"},"rationale":"The cited correction explicitly supersedes the earlier before-tokenization note and says the earlier rationale was wrong, so the final answer must use the tokenize-first correction.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser"]}

## correction-chain / rlm-transcript-search

- Pass: true
- Tool policy: false
- Tool path: glob -> grep -> read -> grep -> glob -> read
- Input tokens: 24,635
- Cache hit: 69.6%

{"answer":"It trims schema field names after splitting/tokenizing so delimiter handling and quoted-field behavior use the raw schema text, then only the resulting field names are cleaned.","evidence":{"session_id":"schema_parser_session","blob_id":"schema_parser_session.md","message_id":"schema_fact_2"},"rationale":"The final correction says to tokenize first, then trim each field, specifically to preserve raw delimiter and quoted-field behavior while cleaning field names.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser","correction chain decoys","superseded before-tokenization note"]}

## correction-chain / subagent-map-zoom

- Pass: true
- Tool policy: false
- Tool path: task -> glob -> grep -> read -> glob -> glob -> read -> read -> read -> bash
- Input tokens: 19,648
- Cache hit: 64.3%

{"answer":"src/parser/schema.ts trims schema field names after splitting because the parser must tokenize first so delimiter and quoted-field handling uses the raw input; trimming is then applied per parsed field name as cleanup.","evidence":{"session_id":"schema_parser_session","blob_id":"4d687643a3a71837a01a1f5d8f12b41a208a3573","message_id":"schema_fact_2"},"rationale":"The cited correction says to tokenize first, then trim each field, which explains both the ordering and the reason: preserve tokenization semantics while cleaning names afterward.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser"]}

## correction-chain / subagent-rlm-transcript-search

- Pass: false
- Tool policy: false
- Tool path: task -> glob -> grep -> grep -> read -> grep -> read -> glob -> read
- Input tokens: 20,762
- Cache hit: 70.3%

{"answer":"src/parser/schema.ts trims schema field names after splitting so tokenization preserves raw delimiters and quoted-field behavior, then only the resulting field names are cleaned.","evidence":{"session_id":"schema_parser_session","blob_id":"/Users/islamtayeb/Documents/GitHub/mem-mould/benchmarks/provenance-qa/runs/gpt55-blog-full-matrix/fixtures/correction-chain/conditions/subagent-rlm-transcript-search/worktree/memory/transcripts/schema_parser_session.md","message_id":"schema_fact_2"},"rationale":"Trimming before tokenization could alter delimiter/quote-sensitive parsing; trimming after splitting preserves parser semantics while normalizing names.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser"]}

## false-provenance / memmould-map-zoom

- Pass: true
- Tool policy: false
- Tool path: session_lookup -> session_detail -> message_detail
- Input tokens: 3,639
- Cache hit: 91.6%

{"answer":"src/cache/index.ts scopes TTL by namespace so one noisy namespace cannot extend or evict unrelated namespaces through a shared global TTL policy.","evidence":{"session_id":"ses_1e1bc448cffe3CdQOJsdxOrjb9","blob_id":"cache_namespace_ttl","message_id":"msg_e1e43bb84001EgwI56ru5gxRDS"},"rationale":"The cited message states that a global TTL was considered, but namespace-scoped TTL was chosen to isolate namespaces from each other's TTL effects.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes"]}

## false-provenance / rlm-transcript-search

- Pass: true
- Tool policy: false
- Tool path: glob -> grep -> read -> grep
- Input tokens: 10,389
- Cache hit: 80.7%

{"answer":"src/cache/index.ts scopes TTL by namespace so one noisy namespace cannot extend or evict unrelated namespaces via a shared global TTL policy.","evidence":{"session_id":"cache_namespace_session","blob_id":"cache_namespace_session.md","message_id":"cache_fact_2"},"rationale":"The cited message directly states that namespace-scoped TTL was chosen to isolate namespaces from each other's TTL effects.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes","false_provenance_decoy_*"]}

## false-provenance / subagent-map-zoom

- Pass: true
- Tool policy: false
- Tool path: task -> glob -> grep -> read -> read -> grep -> glob
- Input tokens: 9,103
- Cache hit: 82.0%

{"answer":"src/cache/index.ts scopes TTL by namespace so one noisy namespace cannot extend or evict unrelated namespaces through a shared global TTL policy.","evidence":{"session_id":"cache_namespace_session","blob_id":"cache_namespace_session.md","message_id":"cache_fact_2"},"rationale":"The cited message supports the full rationale: namespace-scoped TTL isolates cache namespaces from each other's TTL effects.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes"]}

## false-provenance / subagent-rlm-transcript-search

- Pass: true
- Tool policy: false
- Tool path: task -> glob -> grep -> grep -> read -> read -> read -> read -> grep -> glob -> read
- Input tokens: 9,012
- Cache hit: 87.0%

{"answer":"Namespace-scoped TTL prevents one noisy namespace from extending or evicting unrelated namespaces under a shared global TTL policy.","evidence":{"session_id":"cache_namespace_session","blob_id":"cache_namespace_session.md","message_id":"cache_fact_2"},"rationale":"The cited message directly states that namespace-scoped TTL was chosen so one noisy namespace cannot extend or evict unrelated namespaces through a shared global TTL policy.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes"]}

## multi-agent-synthesis / memmould-map-zoom

- Pass: true
- Tool policy: false
- Tool path: session_lookup -> session_detail -> message_detail
- Input tokens: 3,301
- Cache hit: 92.5%

{"answer":"Test investigator child session","evidence":{"session_id":"ses_1e1b7a0ceffepNU63j5L409YUh","blob_id":"test_investigator_child","message_id":"msg_e1e485f40001k6CLqCFbASurPc"},"rationale":"The cited message says the test investigator child found failed-test IDs must remain in final reports so a later agent can reproduce and triage exact failures, and that the parent kept failed_test_ids in src/report/summary.ts based on that finding.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session"]}

## multi-agent-synthesis / rlm-transcript-search

- Pass: true
- Tool policy: false
- Tool path: glob -> grep -> read -> read -> read -> grep
- Input tokens: 4,636
- Cache hit: 93.0%

{"answer":"Test investigator child","evidence":{"session_id":"test_investigator_child_session","blob_id":"test_investigator_child_session.md","message_id":"child_fact_1"},"rationale":"The cited message states that the test investigator child found failed-test IDs must remain in final reports so a later agent can reproduce and triage exact failures.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session"]}

## multi-agent-synthesis / subagent-map-zoom

- Pass: true
- Tool policy: false
- Tool path: task -> glob -> read -> read -> read -> bash
- Input tokens: 7,685
- Cache hit: 88.6%

{"answer":"Test investigator child session: failed-test IDs must remain in final reports so a later agent can reproduce and triage exact failures.","evidence":{"session_id":"test_investigator_child_session","blob_id":"e48db1db2758cd8108e70e318cd2947941e60014","message_id":"child_fact_1"},"rationale":"The cited child message directly explains why src/report/summary.ts keeps failed-test IDs in final reports: they preserve exact failures for later reproduction and triage.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session"]}

## multi-agent-synthesis / subagent-rlm-transcript-search

- Pass: true
- Tool policy: false
- Tool path: task -> glob -> grep -> read -> grep -> read -> read -> read -> glob -> read -> grep
- Input tokens: 9,926
- Cache hit: 88.1%

{"answer":"Test investigator child session","evidence":{"session_id":"test_investigator_child_session","blob_id":"test_investigator_child_session.md","message_id":"child_fact_1"},"rationale":"The cited finding says failed-test IDs must remain in final reports so later agents can reproduce and triage exact failures, explaining why src/report/summary.ts keeps them.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session"]}

## related-reuse / memmould-map-zoom

- Pass: true
- Tool policy: false
- Tool path: session_lookup -> session_detail -> message_detail
- Input tokens: 3,371
- Cache hit: 92.3%

{"answer":"Reuse the CSV parser lesson to trim fields after delimiter splitting so cell names are clean without altering raw parse boundaries. Do not copy the stale comma-specific CSV splitting detail; TSV should use tab delimiters.","evidence":{"session_id":"ses_1e1ba048affeLjzNwV7KkcKevp","blob_id":"csv_parser_lesson","message_id":"msg_e1e45fb8e001e2v5m7OzGTwIND"},"rationale":"The cited CSV parser lesson explicitly states both the reusable behavior and the stale CSV-specific detail to avoid for TSV schema work.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser"]}

## related-reuse / rlm-transcript-search

- Pass: true
- Tool policy: false
- Tool path: glob -> grep -> read -> grep -> grep
- Input tokens: 13,569
- Cache hit: 79.8%

{"answer":"Reuse the CSV parser lesson to trim fields after delimiter splitting so cell names are clean without altering raw parse boundaries; do not copy comma-specific CSV splitting into TSV, because TSV must use tab delimiters.","evidence":{"session_id":"csv_parser_lesson_session","blob_id":"csv_parser_lesson_session.md","message_id":"reuse_fact_1; reuse_fact_2"},"rationale":"The CSV parser lesson transcript states both the reusable trimming behavior and the stale CSV-specific delimiter detail to avoid for TSV.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser","related_reuse_decoy_*"]}

## related-reuse / subagent-map-zoom

- Pass: true
- Tool policy: false
- Tool path: task -> bash -> glob -> grep -> read -> read -> grep -> glob -> read
- Input tokens: 6,898
- Cache hit: 90.5%

{"answer":"Reuse trimming fields after delimiter splitting for clean cell names, but do not copy comma-specific CSV splitting; TSV must split on tabs.","evidence":{"session_id":"csv_parser_lesson_session","blob_id":"memory/transcripts/csv_parser_lesson_session.md","message_id":"reuse_fact_1"},"rationale":"The cited CSV parser lesson supports both parts: reuse post-split trimming, but avoid stale comma-specific splitting because TSV requires tab delimiters.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser"]}

## related-reuse / subagent-rlm-transcript-search

- Pass: true
- Tool policy: false
- Tool path: task -> glob -> grep -> read -> grep -> read -> grep -> glob
- Input tokens: 10,735
- Cache hit: 84.0%

{"answer":"Reuse the CSV parser lesson to trim fields after delimiter splitting so cell names are clean without changing raw parse boundaries; do not copy the stale comma-specific splitting detail because src/tsv/schema.ts must use tab delimiters.","evidence":{"session_id":"csv_parser_lesson_session","blob_id":"/Users/islamtayeb/Documents/GitHub/mem-mould/benchmarks/provenance-qa/runs/gpt55-blog-full-matrix/fixtures/related-reuse/conditions/subagent-rlm-transcript-search/worktree/memory/transcripts/csv_parser_lesson_session.md","message_id":"reuse_fact_1, reuse_fact_2"},"rationale":"The child found the reusable lesson and the stale CSV-specific detail in the CSV parser transcript; the facts are adjacent in the same blob and together support the full answer.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser"]}

