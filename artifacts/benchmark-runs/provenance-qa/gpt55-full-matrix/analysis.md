# Provenance QA Analysis

- Run: /Users/islamtayeb/Documents/GitHub/mem-mould/benchmarks/provenance-qa/runs/gpt55-full-matrix
- Generated: 2026-05-12T06:17:45.593Z
- Passed: 3/4
- Aggregate input tokens: 44,224
- Aggregate cache-read tokens: 38,400

## Rows

| Condition | Pass | Answer | Provenance | Required Hits | Missing | Forbidden | Citations | Context Tools | Task Tools | Message Detail | Input Tok | Cache Read Tok | Cache Hit |
|---|---:|---:|---:|---|---|---|---|---:|---:|---:|---:|---:|---:|
| full-transcript | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message | 0 | 0 | 0 | 9,471 | 0 | 0.0% |
| keyword-snippets | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message | 0 | 0 | 0 | 9,428 | 0 | 0.0% |
| memmould-map-zoom | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 3 | 0 | 1 | 23,937 | 19,968 | 45.5% |
| subagent-map-zoom | false | false | true | same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected | per_tenant |  | session, message, blob | 3 | 1 | 1 | 1,388 | 18,432 | 93.0% |
