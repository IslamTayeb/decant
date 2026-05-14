# Provenance QA Analysis

- Run: ./benchmarks/provenance-qa/runs/gpt55-memmould-smoke
- Generated: 2026-05-12T06:06:23.385Z
- Passed: 0/1
- Aggregate input tokens: 14,732
- Aggregate cache-read tokens: 29,184

## Rows

| Condition | Pass | Answer | Provenance | Required Hits | Missing | Forbidden | Citations | Context Tools | Task Tools | Message Detail | Input Tok | Cache Read Tok | Cache Hit |
|---|---:|---:|---:|---|---|---|---|---:|---:|---:|---:|---:|---:|
| memmould-map-zoom | false | false | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  | billing retry, markdown parser | session, message, blob | 3 | 0 | 1 | 14,732 | 29,184 | 66.5% |
