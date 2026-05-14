# Evidence Snippets

## auth-queue-rationale / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_lookup -> session_lookup -> session_detail -> message_detail
- Input tokens: 12,400
- Cache hit: 71.2%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so duplicate refreshes for the same tenant coalesce, while refreshes for different tenants can still run in parallel. A single global mutex was rejected because it would block unrelated tenants.","evidence":{"session_id":"ses_1e18f7933ffeLjm5gjJweUIX5l","blob_id":"auth_refresh_queue","message_id":"msg_e1e7086d9001RQEqB83yLmV7o1"},"rationale":"The cited message supports the full answer: it states that RefreshQueue uses a per-tenant key to coalesce same-tenant work, and explicitly rejects a global mutex because auth_refresh_different_tenants_parallel requires unrelated tenants not to serialize behind each other.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup"]}

## auth-queue-rationale / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> grep -> read -> grep -> read
- Input tokens: 8,401
- Cache hit: 84.7%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so duplicate refreshes for the same tenant coalesce while refreshes for different tenants can continue in parallel, avoiding the cross-tenant blocking a single global mutex would cause.","evidence":{"session_id":"auth_refresh_session","blob_id":"./benchmarks/provenance-qa/runs/gpt55-parent-gpt54mini-child-subagents/fixtures/auth-queue-rationale/conditions/subagent-rlm-transcript-search/worktree/memory/transcripts/auth_refresh_session.md","message_id":"auth_fact_3"},"rationale":"The relevant rationale is tenant-scoped coalescing plus preserving parallelism across tenants. The rejected global-mutex alternative matters because it would block unrelated tenants; no stale correction was reported.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup"]}

## blame-line-rationale / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_lookup -> session_lookup -> session_detail -> message_detail
- Input tokens: 17,163
- Cache hit: 62.6%

{"answer":"Line 2 caps requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ses_1e188e2c0ffe5eB0GDdefdnDbY","blob_id":"cache_ttl","message_id":"msg_e1e771d57001CSGa7lkF1qp9JC"},"rationale":"The cited provenance message directly explains the cap as enforcing the namespace budget against stale cache retention. No correction, stale detail, or rejected alternative was reported as material.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor"]}

## blame-line-rationale / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> grep -> read -> grep -> grep -> read
- Input tokens: 7,556
- Cache hit: 87.7%

{"answer":"It caps requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ttl_blame_session","blob_id":"./benchmarks/provenance-qa/runs/gpt55-parent-gpt54mini-child-subagents/fixtures/blame-line-rationale/conditions/subagent-rlm-transcript-search/worktree/memory/transcripts/ttl_blame_session.md","message_id":"ttl_fact_2"},"rationale":"The cited message directly states the reason for line 2. No correction, stale detail, or rejected alternative was reported as relevant.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor"]}

## correction-chain / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_lookup -> session_lookup -> session_detail -> message_detail
- Input tokens: 9,519
- Cache hit: 79.0%

{"answer":"src/parser/schema.ts trims schema field names after splitting/tokenizing so delimiter handling and quoted-field behavior are preserved while still cleaning the resulting field names.","evidence":{"session_id":"ses_1e18e3e15ffew2NthSzrfQ6F2H","blob_id":"schema_parser_correction","message_id":"msg_e1e71c1fa001kZFr7pzXyVDPn9"},"rationale":"The relevant correction chain says the final behavior is to tokenize first, then trim each field. The earlier idea to trim before tokenization was explicitly superseded and marked wrong, so it should not be cited as the final rationale.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser"]}

## correction-chain / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> grep -> read -> grep -> glob -> read
- Input tokens: 11,862
- Cache hit: 81.2%

{"answer":"src/parser/schema.ts trims schema field names after splitting/tokenizing so raw delimiters and quoted-field behavior are preserved during tokenization, then final field names are cleaned afterward.","evidence":{"session_id":"schema_parser_session","blob_id":"schema_parser_session.md","message_id":"schema_fact_2"},"rationale":"schema_fact_2 supports the full answer: tokenize first, then trim each field to preserve delimiter and quoted-field behavior while cleaning names. The earlier trim-before-tokenization detail was stale and explicitly superseded/rejected by schema_fact_3.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser","correction_chain_decoy_* files"]}

## false-provenance / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_lookup -> session_lookup -> session_detail -> message_detail
- Input tokens: 9,560
- Cache hit: 78.9%

{"answer":"`src/cache/index.ts` scopes TTL by namespace so one noisy namespace cannot extend or evict unrelated namespaces through a shared global TTL policy.","evidence":{"session_id":"ses_1e18d2203ffe5ocaBRiZG2DewR","blob_id":"cache_namespace_ttl","message_id":"msg_e1e72de08001QQlH9kVr3mJklq"},"rationale":"The cited prior message states that a global TTL was considered and rejected because namespace-scoped TTL isolates namespaces and prevents cross-namespace interference.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes"]}

## false-provenance / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> grep -> read -> grep -> read
- Input tokens: 6,966
- Cache hit: 87.4%

{"answer":"src/cache/index.ts scopes TTL by namespace so one noisy namespace cannot extend or evict unrelated namespaces under a shared global TTL policy.","evidence":{"session_id":"cache_namespace_session","blob_id":"cache_namespace_session.md","message_id":"cache_fact_2"},"rationale":"The cited message states the namespace-scoped TTL reason and explicitly notes that a global TTL was considered but rejected.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes"]}

## multi-agent-synthesis / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_lookup -> session_lookup -> session_detail -> message_detail
- Input tokens: 10,361
- Cache hit: 76.0%

{"answer":"The Test investigator child found that failed-test IDs must remain in the final report so later agents can reproduce and triage exact failures; the parent accepted this and kept `failed_test_ids` in `src/report/summary.ts`.","evidence":{"session_id":"ses_1e18a33c0ffeRwXmyfYX6OjoH5","blob_id":"test_investigator_child","message_id":"msg_e1e75cc53001l2ITRQDfUvr3vH"},"rationale":"The cited message supports both the reason for retaining failed-test IDs and the parent decision to keep them. No correction, stale detail, or rejected alternative mattered.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session"]}

## multi-agent-synthesis / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> grep -> read -> grep -> read -> grep
- Input tokens: 8,944
- Cache hit: 86.8%

{"answer":"Test investigator child session","evidence":{"session_id":"test_investigator_child_session","blob_id":"test_investigator_child_session.md","message_id":"child_fact_1"},"rationale":"The test investigator child found that failed-test IDs must remain in final reports so later agents can reproduce and triage exact failures. The later accepted outcome kept failed_test_ids in src/report/summary.ts; the docs request to omit debugging IDs was not the controlling finding.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session"]}

## related-reuse / subagent-map-zoom

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_lookup -> session_lookup -> session_detail -> session_detail -> message_detail
- Input tokens: 14,497
- Cache hit: 69.0%

{"answer":"Reuse the CSV parser lesson to trim fields after delimiter splitting so names stay clean without changing raw parse boundaries. Do not copy the stale comma-specific CSV splitting detail; src/tsv/schema.ts should use tab delimiters.","evidence":{"session_id":"ses_1e18ba847ffeWFnp43WZtD0rHv","blob_id":"csv_parser_lesson","message_id":"msg_e1e7457c6001MEx3T6iAAL47Aj"},"rationale":"The cited prior CSV parser lesson supports both the reusable behavior and the correction: trimming after splitting is the lesson to carry over, while comma-based splitting is stale for TSV and must be rejected in favor of tabs.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser"]}

## related-reuse / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> glob -> grep -> read -> grep -> grep -> read -> read -> read -> grep -> grep
- Input tokens: 20,875
- Cache hit: 66.5%

{"answer":"Reuse trimming fields after delimiter splitting so cell names are clean without changing raw parse boundaries; do not copy comma-specific CSV splitting into TSV, which should use tab delimiters.","evidence":{"session_id":"csv_parser_lesson_session","blob_id":"./benchmarks/provenance-qa/runs/gpt55-parent-gpt54mini-child-subagents/fixtures/related-reuse/conditions/subagent-rlm-transcript-search/worktree/memory/transcripts/csv_parser_lesson_session.md","message_id":"reuse_fact_1; reuse_fact_2"},"rationale":"No single message was found that supports the full answer. reuse_fact_1 supports the reusable parser lesson, and reuse_fact_2 supports the stale comma-specific detail that must not be copied for TSV.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser","related_reuse_decoy_* files"]}

