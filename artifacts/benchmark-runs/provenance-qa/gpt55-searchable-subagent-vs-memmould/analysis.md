# Provenance QA Analysis

- Run: ./benchmarks/provenance-qa/runs/gpt55-searchable-subagent-vs-memmould
- Generated: 2026-05-12T07:16:35.110Z
- Passed: 4/4
- Aggregate input tokens: 82,035
- Aggregate cache-read tokens: 91,136

## Rows

| Condition | Pass | Answer | Provenance | Required Hits | Missing | Forbidden | Citations | Context Tools | Search Tools | Read Tools | Task Tools | Message Detail | Transcript Reads | Irrelevant Reads | Input Tok | Cache Read Tok | Cache Hit |
|---|---:|---:|---:|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| memmould-map-zoom | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 3 | 0 | 0 | 0 | 1 | 0 | 0 | 22,385 | 21,504 | 49.0% |
| rlm-transcript-search | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 0 | 2 | 1 | 0 | 0 | 1 | 0 | 39,636 | 0 | 0.0% |
| subagent-map-zoom | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 3 | 0 | 0 | 1 | 1 | 0 | 0 | 5,268 | 45,056 | 89.5% |
| subagent-rlm-transcript-search | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message | 0 | 2 | 1 | 1 | 0 | 1 | 0 | 14,746 | 24,576 | 62.5% |
