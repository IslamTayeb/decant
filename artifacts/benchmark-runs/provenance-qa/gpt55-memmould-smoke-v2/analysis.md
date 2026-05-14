# Provenance QA Analysis

- Run: ./benchmarks/provenance-qa/runs/gpt55-memmould-smoke-v2
- Generated: 2026-05-12T06:13:52.670Z
- Passed: 1/1
- Aggregate input tokens: 16,224
- Aggregate cache-read tokens: 27,648

## Rows

| Condition | Pass | Answer | Provenance | Required Hits | Missing | Forbidden | Citations | Context Tools | Task Tools | Message Detail | Input Tok | Cache Read Tok | Cache Hit |
|---|---:|---:|---:|---|---|---|---|---:|---:|---:|---:|---:|---:|
| memmould-map-zoom | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 3 | 0 | 1 | 16,224 | 27,648 | 63.0% |
