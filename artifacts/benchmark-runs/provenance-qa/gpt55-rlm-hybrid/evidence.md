# Evidence Snippets

## auth-queue-rationale / decant-guided-rlm

- Pass: true
- Tool policy: true
- Tool path: session_lookup -> session_detail -> glob -> grep -> read -> message_detail
- Input tokens: 6,133
- Cache hit: 92.7%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so duplicate refreshes for the same tenant coalesce, while refreshes for unrelated tenants can continue in parallel. A single global mutex was rejected because it would make unrelated tenants block each other, contradicting the auth_refresh_different_tenants_parallel requirement.","evidence":{"session_id":"ses_1e1485115ffeVYOJjwMWwXjJmo","blob_id":"auth_refresh_queue","message_id":"msg_e1eb7aefb001MmtTPy0IKNs0PW"},"rationale":"session_lookup identified the Auth refresh queue rationale session, transcript search corroborated the same facts, and message_detail supplied the final cited OpenCode message. The embedded fixture labels such as auth_fact_1/auth_fact_2/auth_fact_3 were not used as citations because the transcript explicitly says to cite the heading message id; the rejected alternative was the global mutex.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup"]}

## auth-queue-rationale / rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: grep -> read -> grep -> glob -> read -> read -> read -> read -> read -> read -> read -> read -> read -> glob -> read
- Input tokens: 29,298
- Cache hit: 72.3%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so duplicate refreshes for the same tenant coalesce, while refreshes for different tenants can still run in parallel; one global mutex would unnecessarily block unrelated tenants.","evidence":{"session_id":"auth_refresh_session","blob_id":"auth_refresh_session.md","message_id":"auth_fact_3"},"rationale":"The relevant auth rationale says RefreshQueue uses a per-tenant key: same-tenant duplicate refreshes coalesce, while different tenants continue in parallel. This also makes the rejected global-mutex alternative stale for auth because it would serialize unrelated tenants.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup","Auth queue rationale decoys"]}

## auth-queue-rationale / subagent-decant-guided-rlm

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> glob -> grep -> read -> message_detail
- Input tokens: 17,646
- Cache hit: 78.0%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so duplicate refreshes for the same tenant coalesce, while refreshes for different tenants can proceed in parallel. A single global mutex was rejected because it would make unrelated tenants block each other.","evidence":{"session_id":"ses_1e1479367ffeZ0wa40w6ZGmonL","blob_id":"auth_refresh_queue","message_id":"msg_e1eb86ca6001dc73fJCsigrHni"},"rationale":"The cited message supports the full answer: it identifies the rejected global mutex design, explains that unrelated tenants must not block each other, and states that the per-tenant key lets same-tenant duplicates coalesce while different tenants continue in parallel.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup","auth_queue_rationale_decoy_* transcripts"]}

## auth-queue-rationale / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> grep -> glob -> read -> read -> read -> grep
- Input tokens: 19,711
- Cache hit: 62.8%

{"answer":"src/auth/queue.ts deduplicates refresh work per tenant so duplicate refreshes for the same tenant coalesce, while refreshes for different tenants can still run in parallel instead of being blocked behind one global mutex.","evidence":{"session_id":"auth_refresh_session","blob_id":"recall/transcripts/auth_refresh_session.md","message_id":"auth_fact_3"},"rationale":"auth_fact_3 supports the full answer by stating both same-tenant coalescing and cross-tenant parallelism. The rejected global mutex alternative matters because it would block unrelated tenants, which was explicitly rejected.","irrelevant_context_ignored":["Billing retry queue rationale","Markdown parser onboarding cleanup","auth_queue_rationale_decoy_* files"]}

## blame-line-rationale / decant-guided-rlm

- Pass: true
- Tool policy: true
- Tool path: session_lookup -> session_detail -> grep -> glob -> message_detail
- Input tokens: 6,380
- Cache hit: 89.5%

{"answer":"Line 2 caps the requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ses_1e13b4d15ffeTVDB9QjMpMl2Ln","blob_id":"cache_ttl","message_id":"msg_e1ec4b301001BA59Jj10y5hyrt"},"rationale":"session_lookup identified the TTL blame rationale session, and the transcript file ttl_blame_session--ses_1e13b4d15ffeTVDB9QjMpMl2Ln.md corroborated the same fact. message_detail on msg_e1ec4b301001BA59Jj10y5hyrt directly states both that the line was introduced in src/cache/ttl.ts and that the cap prevents noisy namespaces from extending stale retention beyond their namespace budget.","irrelevant_context_ignored":["Billing TTL distractor: provider-policy cap, not namespaceMaxSeconds.","Markdown TTL distractor: docs preview freshness TTL, unrelated to src/cache/ttl.ts.","blame_line_rationale_decoy_* transcripts: explicitly marked decoys and not final rationale."]}

## blame-line-rationale / rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: glob -> grep -> read -> grep -> read -> read -> glob -> read
- Input tokens: 17,223
- Cache hit: 75.7%

{"answer":"Line 2 caps requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ttl_blame_session","blob_id":"ttl_blame_session.md","message_id":"ttl_fact_2"},"rationale":"The cited message directly states the reason for the cap. I ignored TTL billing and Markdown TTL material because those are separate distractors; no correction, stale detail, or rejected alternative changes the cited rationale.","irrelevant_context_ignored":["Billing TTL distractor: provider policy cap, not namespaceMaxSeconds","Markdown TTL distractor: docs preview freshness","Decoy blame-line rationale files that mention src/cache/ttl.ts but say not to cite them"]}

## blame-line-rationale / subagent-decant-guided-rlm

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> glob -> grep -> read -> read -> read -> message_detail
- Input tokens: 8,892
- Cache hit: 88.4%

{"answer":"It caps requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ses_1e13aae20ffes9oUeQ1F0zoF6r","blob_id":"cache_ttl","message_id":"msg_e1ec551f20019PwRgZOaT3UYrI"},"rationale":"The cited OpenCode message supports the full answer: line 2 was introduced to cap requested TTL with namespaceMaxSeconds, preventing a noisy namespace from exceeding its cache-retention budget. The citation uses real decant session/message IDs, not embedded transcript labels.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor"]}

## blame-line-rationale / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> grep -> grep -> read -> grep -> read -> glob
- Input tokens: 10,462
- Cache hit: 85.2%

{"answer":"src/cache/ttl.ts caps requested TTL with namespaceMaxSeconds so a noisy namespace cannot extend stale cache retention beyond its namespace budget.","evidence":{"session_id":"ttl_blame_session","blob_id":"ttl_blame_session.md","message_id":"ttl_fact_2"},"rationale":"The cited provenance directly states that line 2 enforces the namespace TTL budget by capping requested TTLs, preventing noisy namespaces from retaining stale cache entries longer than allowed. No correction, stale detail, or rejected alternative was indicated as relevant.","irrelevant_context_ignored":["Billing TTL distractor","Markdown TTL distractor"]}

## correction-chain / decant-guided-rlm

- Pass: true
- Tool policy: true
- Tool path: session_lookup -> session_detail -> glob -> grep -> read -> message_detail
- Input tokens: 6,747
- Cache hit: 91.0%

{"answer":"`src/parser/schema.ts` trims schema field names after splitting because the parser must tokenize on the raw schema text first, preserving delimiter and quoted-field behavior, and only then clean each field name.","evidence":{"session_id":"ses_1e145baaeffe50kFHR4dI8LRnC","blob_id":"schema_parser_correction","message_id":"msg_e1eba45660015oPv3FAY1OdiY4"},"rationale":"The cited message contains the correction: tokenize first, then trim each field, because this preserves raw delimiter and quoted-field behavior while cleaning field names. It also explicitly says the earlier rationale to trim the whole schema header before tokenization was superseded and should not be cited as final.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser","correction_chain_decoy_* transcript files"]}

## correction-chain / rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: glob -> grep -> read -> grep -> glob -> read
- Input tokens: 6,501
- Cache hit: 90.7%

{"answer":"Because tokenizing first preserves the raw delimiter and quoted-field behavior, then trimming each resulting field cleans only the schema field names.","evidence":{"session_id":"schema_parser_session","blob_id":"schema_parser_session.md","message_id":"schema_fact_2"},"rationale":"The final corrected rationale is in schema_fact_2. The earlier idea to trim the whole schema header before tokenization was explicitly superseded/rejected, so it should not be treated as the answer.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser","correction chain decoys"]}

## correction-chain / subagent-decant-guided-rlm

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> message_detail -> glob -> grep -> read
- Input tokens: 12,082
- Cache hit: 83.5%

{"answer":"Because the corrected rationale is to tokenize first, then trim each field name so raw delimiter and quoted-field behavior are preserved while still cleaning field names.","evidence":{"session_id":"ses_1e1451fc4ffeO4ciwtKN5iy88U","blob_id":"schema_parser_correction","message_id":"msg_e1ebae05100190vz8NlHTN6RA0"},"rationale":"The cited message says the earlier idea to trim the whole schema header before tokenization was superseded. The correction was to tokenize first, then trim each field, preserving raw delimiter and quoted-field behavior. The stale before-tokenization rationale should not be treated as final.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser"]}

## correction-chain / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> grep -> glob -> read -> grep
- Input tokens: 8,971
- Cache hit: 82.4%

{"answer":"src/parser/schema.ts trims schema field names after splitting/tokenization so the tokenizer still sees the raw delimiters and quoted-field structure, while the resulting field names are cleaned afterward.","evidence":{"session_id":"schema_parser_session","blob_id":"schema_parser_session.md","message_id":"schema_fact_2"},"rationale":"schema_fact_2 explicitly corrects the earlier approach: tokenize first, then trim each field. This preserves delimiter and quoted-field behavior during tokenization while still cleaning final field names. The earlier before-tokenization rationale was stale and superseded.","irrelevant_context_ignored":["CSV trim cleanup","Network timeout parser"]}

## false-provenance / decant-guided-rlm

- Pass: true
- Tool policy: true
- Tool path: session_lookup -> session_detail -> glob -> grep -> read -> message_detail
- Input tokens: 6,727
- Cache hit: 91.0%

{"answer":"src/cache/index.ts scopes TTL by namespace because a global TTL was considered but rejected: one noisy namespace could otherwise extend or evict unrelated namespaces through a shared global TTL policy.","evidence":{"session_id":"ses_1e1435f95ffeXBaacyEGj1u9An","blob_id":"cache_namespace_ttl","message_id":"msg_e1ebca081001X6e58gqCl1AAdH"},"rationale":"Decant lookup identified the Cache namespace TTL rationale session, transcript search corroborated the same real session and message id, and message_detail confirmed both the rejected global TTL alternative and the namespace-scoped reason. The embedded fixture labels cache_namespace_session/cache_fact_* were not used as citations.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes","false_provenance_decoy_* files"]}

## false-provenance / rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: grep -> read -> grep -> glob
- Input tokens: 11,320
- Cache hit: 73.7%

{"answer":"src/cache/index.ts scopes TTL by namespace so one noisy namespace cannot extend or evict unrelated namespaces through a shared global TTL policy.","evidence":{"session_id":"cache_namespace_session","blob_id":"cache_namespace_session.md","message_id":"cache_fact_2"},"rationale":"The supporting message explicitly states namespace-scoped TTL was chosen to isolate namespaces from each other. A global TTL was considered, but that alternative was not chosen.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes","false_provenance_decoy_*"]}

## false-provenance / subagent-decant-guided-rlm

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> grep -> glob -> read -> message_detail
- Input tokens: 12,083
- Cache hit: 83.9%

{"answer":"src/cache/index.ts scopes TTL by namespace because a single global TTL was considered but rejected: namespace-scoped TTL prevents one noisy namespace from extending or evicting unrelated namespaces through a shared global TTL policy.","evidence":{"session_id":"ses_1e142b787ffeubNZ3c73KlPwOR","blob_id":"cache_namespace_ttl","message_id":"msg_e1ebd488d001OIfDC02zgqC718"},"rationale":"message_detail confirms the relevant decision: global TTL was considered, and namespace-scoped TTL was chosen to isolate namespaces from each other's TTL churn. The rejected alternative matters because the reason is specifically avoiding cross-namespace extension/eviction under one shared policy.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes","false_provenance_decoy_* files"]}

## false-provenance / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> grep -> glob -> read -> read -> read -> grep -> read
- Input tokens: 6,389
- Cache hit: 89.5%

{"answer":"src/cache/index.ts scopes TTL by namespace so one noisy namespace cannot extend or evict unrelated namespaces through a shared global TTL policy.","evidence":{"session_id":"cache_namespace_session","blob_id":"cache_namespace_session.md","message_id":"cache_fact_2"},"rationale":"The cited message directly explains the namespace-scoped TTL rationale and rejects the global TTL alternative because it would let activity in one namespace affect unrelated namespaces.","irrelevant_context_ignored":["Billing cache global TTL","Image cache namespace notes","false provenance decoys"]}

## multi-agent-synthesis / decant-guided-rlm

- Pass: true
- Tool policy: true
- Tool path: session_lookup -> session_detail -> grep -> glob -> read -> message_detail
- Input tokens: 6,777
- Cache hit: 90.9%

{"answer":"Test investigator child session: it found failed-test IDs must remain in final reports so a later agent can reproduce and triage exact failures, and the parent kept failed_test_ids in src/report/summary.ts for that reason.","evidence":{"session_id":"ses_1e13dd238ffeaJAQzy6ngBqgSc","blob_id":"test_investigator_child","message_id":"msg_e1ec22dd9001x1EMAOKQ2Og4Pd"},"rationale":"session_lookup identified the test_investigator_child blob as the relevant prior session; transcript search corroborated it and warned to cite the real OpenCode message id rather than fixture labels. message_detail for msg_e1ec22dd9001x1EMAOKQ2Og4Pd contains both the child finding and the parent acceptance keeping failed_test_ids in src/report/summary.ts.","irrelevant_context_ignored":["Docs writer child session asked for shorter prose and no debugging IDs, which conflicts with the accepted rationale.","Style reviewer child session only wanted alphabetized field names and explicitly was not the rationale for failed-test IDs.","multi_agent_synthesis_decoy_* files mention similar terms but state they are not the final rationale."]}

## multi-agent-synthesis / rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: glob -> grep -> grep -> read -> read
- Input tokens: 10,978
- Cache hit: 80.2%

{"answer":"Test investigator child session","evidence":{"session_id":"test_investigator_child_session","blob_id":"test_investigator_child_session.md","message_id":"child_fact_1"},"rationale":"The cited message states that the test investigator child found failed-test IDs must remain in final reports so a later agent can reproduce and triage exact failures. The parent later accepted that finding and kept failed_test_ids in src/report/summary.ts; the docs writer's contrary preference for no debugging IDs was not adopted.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session","multi_agent_synthesis_decoy_*"]}

## multi-agent-synthesis / subagent-decant-guided-rlm

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> session_detail -> glob -> grep -> read -> message_detail
- Input tokens: 9,493
- Cache hit: 87.2%

{"answer":"Test investigator child session","evidence":{"session_id":"ses_1e13d158fffe7427sAgi4lNq60","blob_id":"test_investigator_child","message_id":"msg_e1ec2ea82001LyT1faeDJkfv12"},"rationale":"The cited message supports the full answer: the test investigator found failed-test IDs should remain in final reports so later agents can reproduce and triage exact failures, and the parent kept failed_test_ids in src/report/summary.ts based on that finding.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session","Decoy transcript files mentioning src/report/summary.ts"]}

## multi-agent-synthesis / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> grep -> glob -> read -> read -> read -> grep -> read -> bash
- Input tokens: 16,178
- Cache hit: 76.9%

{"answer":"Test investigator child","evidence":{"session_id":"test_investigator_child_session","blob_id":"e48db1db2758cd8108e70e318cd2947941e60014","message_id":"child_fact_1"},"rationale":"The cited message directly says the test investigator child found failed-test IDs must remain in final reports so later agents can reproduce and triage exact failures. A later parent acceptance for src/report/summary.ts only confirms the finding; it is not the originating child finding.","irrelevant_context_ignored":["Docs writer child session","Style reviewer child session"]}

## related-reuse / decant-guided-rlm

- Pass: true
- Tool policy: true
- Tool path: session_lookup -> session_detail -> grep -> glob -> message_detail
- Input tokens: 7,296
- Cache hit: 87.6%

{"answer":"Reuse the CSV parser lesson to trim fields after delimiter splitting so cell names are clean without changing raw parse boundaries. Do not copy the stale comma-specific CSV splitting detail into src/tsv/schema.ts; TSV should use tab delimiters.","evidence":{"session_id":"ses_1e14056c1ffeYuX1MA87LCvfNZ","blob_id":"csv_parser_lesson","message_id":"msg_e1ebfa955001q1B7xvl5nu2KC6"},"rationale":"session_lookup/session_detail identified the CSV parser lesson session as the relevant prior context. Transcript search corroborated the same lesson and stale-detail warning. The cited message explicitly contains both the reusable lesson and the correction not to carry over comma-specific CSV splitting for TSV.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser"]}

## related-reuse / rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: glob -> grep -> read -> read -> read -> grep -> read -> glob -> read
- Input tokens: 14,114
- Cache hit: 83.6%

{"answer":"Reuse the CSV parser lesson to trim fields after delimiter splitting so cell names are clean without changing raw parse boundaries; do not copy comma-specific CSV splitting into src/tsv/schema.ts, because TSV should use tab delimiters.","evidence":{"session_id":"csv_parser_lesson_session","blob_id":"csv_parser_lesson_session.md","message_id":"reuse_fact_1;reuse_fact_2"},"rationale":"The CSV parser transcript supplies both the reusable lesson and the stale detail: trimming after delimiter splitting remains applicable, but comma-specific CSV splitting is explicitly stale for TSV and must be replaced with tab delimiters.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser","related_reuse_decoy_* mentions of src/tsv/schema.ts"]}

## related-reuse / subagent-decant-guided-rlm

- Pass: true
- Tool policy: true
- Tool path: task -> session_lookup -> glob -> grep -> session_detail -> message_detail
- Input tokens: 13,231
- Cache hit: 79.8%

{"answer":"Reuse the CSV parser lesson to trim fields after delimiter splitting so cell names are clean without altering raw parse boundaries. Do not copy the stale comma-specific CSV splitting detail into src/tsv/schema.ts; TSV should use tab delimiters.","evidence":{"session_id":"ses_1e13fafd0ffe1MGINkYUQiBbC1","blob_id":"csv_parser_lesson","message_id":"msg_e1ec0503c001Pqt392WVqpvVmF"},"rationale":"The cited message supports both the reusable trimming lesson and the stale comma-specific detail that must be rejected for TSV.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser","decoy transcript files marked not final rationale"]}

## related-reuse / subagent-rlm-transcript-search

- Pass: true
- Tool policy: true
- Tool path: task -> grep -> glob -> read -> read -> read -> grep -> grep -> read -> read
- Input tokens: 7,510
- Cache hit: 89.3%

{"answer":"Reuse the CSV parser lesson to trim fields after delimiter splitting so cell names are clean without changing raw parse boundaries. Do not copy the stale comma-specific splitting detail; TSV should split on tabs.","evidence":{"session_id":"csv_parser_lesson_session","blob_id":"csv_parser_lesson_session.md","message_id":"reuse_fact_1,reuse_fact_2"},"rationale":"The prior CSV parser lesson is reusable for trimming parsed fields, but the comma delimiter is explicitly stale for src/tsv/schema.ts and must be replaced with tab handling. Auth queue related reuse and Markdown table parser were ignored as distractors.","irrelevant_context_ignored":["Auth queue related reuse","Markdown table parser"]}

