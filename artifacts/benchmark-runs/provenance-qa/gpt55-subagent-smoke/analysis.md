# Provenance QA Analysis

- Run: ./benchmarks/provenance-qa/runs/gpt55-subagent-smoke
- Generated: 2026-05-12T06:14:47.458Z
- Passed: 1/1
- Aggregate input tokens: 10,640
- Aggregate cache-read tokens: 9,216

## Rows

| Condition | Pass | Answer | Provenance | Required Hits | Missing | Forbidden | Citations | Context Tools | Task Tools | Message Detail | Input Tok | Cache Read Tok | Cache Hit |
|---|---:|---:|---:|---|---|---|---|---:|---:|---:|---:|---:|---:|
| subagent-map-zoom | true | true | true | per_tenant, same_tenant_coalesce, different_tenants_parallel, global_mutex_rejected |  |  | session, message, blob | 0 | 1 | 0 | 10,640 | 9,216 | 46.4% |
