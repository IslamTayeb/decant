# Provenance QA Analysis

- Run: ./benchmarks/provenance-qa/runs/gpt55-full-matrix-v3
- Generated: 2026-05-12T06:21:27.555Z
- Passed: 4/4
- Aggregate input tokens: 28,117
- Aggregate cache-read tokens: 84,992

## Rows

| Condition | Pass | Answer | Provenance | Required Hits | Missing | Forbidden | Citations | Context Tools | Task Tools | Message Detail | Input Tok | Cache Read Tok | Cache Hit |
|---|---:|---:|---:|---|---|---|---|---:|---:|---:|---:|---:|---:|
| full-transcript | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message | 0 | 0 | 0 | 7,939 | 1,536 | 16.2% |
| keyword-snippets | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message | 0 | 0 | 0 | 728 | 8,704 | 92.3% |
| memmould-map-zoom | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 3 | 0 | 1 | 4,915 | 38,912 | 88.8% |
| subagent-map-zoom | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 3 | 1 | 1 | 14,535 | 35,840 | 71.1% |
