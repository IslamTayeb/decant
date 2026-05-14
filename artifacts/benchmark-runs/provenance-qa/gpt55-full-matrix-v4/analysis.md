# Provenance QA Analysis

- Run: ./benchmarks/provenance-qa/runs/gpt55-full-matrix-v4
- Generated: 2026-05-12T06:23:53.958Z
- Passed: 3/4
- Aggregate input tokens: 91,898
- Aggregate cache-read tokens: 21,504

## Rows

| Condition | Pass | Answer | Provenance | Required Hits | Missing | Forbidden | Citations | Context Tools | Task Tools | Message Detail | Input Tok | Cache Read Tok | Cache Hit |
|---|---:|---:|---:|---|---|---|---|---:|---:|---:|---:|---:|---:|
| full-transcript | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message | 0 | 0 | 0 | 9,475 | 0 | 0.0% |
| keyword-snippets | false | true | false | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session | 0 | 0 | 0 | 7,884 | 1,536 | 16.3% |
| memmould-map-zoom | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 3 | 0 | 1 | 42,295 | 1,536 | 3.5% |
| subagent-map-zoom | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 3 | 1 | 1 | 32,244 | 18,432 | 36.4% |
