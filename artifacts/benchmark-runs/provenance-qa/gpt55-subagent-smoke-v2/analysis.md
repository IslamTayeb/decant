# Provenance QA Analysis

- Run: /Users/islamtayeb/Documents/GitHub/mem-mould/benchmarks/provenance-qa/runs/gpt55-subagent-smoke-v2
- Generated: 2026-05-12T06:16:17.336Z
- Passed: 1/1
- Aggregate input tokens: 1,488
- Aggregate cache-read tokens: 18,432

## Rows

| Condition | Pass | Answer | Provenance | Required Hits | Missing | Forbidden | Citations | Context Tools | Task Tools | Message Detail | Input Tok | Cache Read Tok | Cache Hit |
|---|---:|---:|---:|---|---|---|---|---:|---:|---:|---:|---:|---:|
| subagent-map-zoom | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 3 | 1 | 1 | 1,488 | 18,432 | 92.5% |
