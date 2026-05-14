# Provenance QA Analysis

- Run: ./benchmarks/provenance-qa/runs/gpt55-searchable-vs-memmould
- Generated: 2026-05-12T07:12:19.263Z
- Passed: 3/3
- Aggregate input tokens: 46,365
- Aggregate cache-read tokens: 87,552

## Rows

| Condition | Pass | Answer | Provenance | Required Hits | Missing | Forbidden | Citations | Context Tools | Search Tools | Read Tools | Task Tools | Message Detail | Transcript Reads | Irrelevant Reads | Input Tok | Cache Read Tok | Cache Hit |
|---|---:|---:|---:|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| memmould-map-zoom | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 3 | 0 | 0 | 0 | 1 | 0 | 0 | 12,641 | 31,232 | 71.2% |
| rlm-transcript-search | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message | 0 | 2 | 1 | 0 | 0 | 1 | 0 | 11,398 | 28,160 | 71.2% |
| subagent-map-zoom | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 3 | 0 | 0 | 1 | 1 | 0 | 0 | 22,326 | 28,160 | 55.8% |
