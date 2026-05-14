# Provenance QA Analysis

- Run: ./benchmarks/provenance-qa/runs/gpt55-isolated-memmould-smoke
- Generated: 2026-05-12T06:25:31.058Z
- Passed: 1/1
- Aggregate input tokens: 4,918
- Aggregate cache-read tokens: 38,912

## Rows

| Condition | Pass | Answer | Provenance | Required Hits | Missing | Forbidden | Citations | Context Tools | Task Tools | Message Detail | Input Tok | Cache Read Tok | Cache Hit |
|---|---:|---:|---:|---|---|---|---|---:|---:|---:|---:|---:|---:|
| memmould-map-zoom | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 3 | 0 | 1 | 4,918 | 38,912 | 88.8% |
