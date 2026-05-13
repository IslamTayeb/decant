# Provenance QA Analysis

- Run: /Users/islamtayeb/Documents/GitHub/mem-mould/benchmarks/provenance-qa/runs/gpt55-full-matrix-v2
- Generated: 2026-05-12T06:19:34.799Z
- Passed: 4/4
- Aggregate input tokens: 25,898
- Aggregate cache-read tokens: 56,832

## Rows

| Condition | Pass | Answer | Provenance | Required Hits | Missing | Forbidden | Citations | Context Tools | Task Tools | Message Detail | Input Tok | Cache Read Tok | Cache Hit |
|---|---:|---:|---:|---|---|---|---|---:|---:|---:|---:|---:|---:|
| full-transcript | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message | 0 | 0 | 0 | 9,475 | 0 | 0.0% |
| keyword-snippets | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message | 0 | 0 | 0 | 9,432 | 0 | 0.0% |
| memmould-map-zoom | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 3 | 0 | 1 | 5,497 | 38,400 | 87.5% |
| subagent-map-zoom | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 3 | 1 | 1 | 1,494 | 18,432 | 92.5% |
