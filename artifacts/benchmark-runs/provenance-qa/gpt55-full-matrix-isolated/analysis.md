# Provenance QA Analysis

- Run: /Users/islamtayeb/Documents/GitHub/mem-mould/benchmarks/provenance-qa/runs/gpt55-full-matrix-isolated
- Generated: 2026-05-12T06:27:31.699Z
- Passed: 3/4
- Aggregate input tokens: 33,597
- Aggregate cache-read tokens: 79,872

## Rows

| Condition | Pass | Answer | Provenance | Required Hits | Missing | Forbidden | Citations | Context Tools | Task Tools | Message Detail | Input Tok | Cache Read Tok | Cache Hit |
|---|---:|---:|---:|---|---|---|---|---:|---:|---:|---:|---:|---:|
| full-transcript | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message | 0 | 0 | 0 | 7,939 | 1,536 | 16.2% |
| keyword-snippets | false | true | false | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session | 0 | 0 | 0 | 716 | 8,704 | 92.4% |
| memmould-map-zoom | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 3 | 0 | 1 | 3,378 | 40,448 | 92.3% |
| subagent-map-zoom | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 3 | 1 | 1 | 21,564 | 29,184 | 57.5% |
