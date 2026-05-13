# Context Canary Analysis

- Run: /Users/islamtayeb/Documents/GitHub/mem-mould/benchmarks/context-canaries/runs/gpt55-task-switch-smoke
- Generated: 2026-05-12T03:05:48.533Z

## Aggregate

| Condition | Canary Pass | Hygiene Pass | Input Tok | Cache Read Tok | Cache Hit Share |
|---|---:|---:|---:|---:|---:|
| polluted-default-compact | 0/1 | 0/1 | 49,804 | 67,072 | 57.4% |
| polluted-memmould-cache-stable-boundary-compact | 1/1 | 1/1 | 55,335 | 130,048 | 70.2% |

## Rows

| Canary | Condition | Canary Pass | Hygiene Pass | Current Terms | Stale Output | Visible Stale Summary | Summary Fidelity | Context Tools | Input Tok | Cache Hit |
|---|---|---:|---:|---|---|---|---|---:|---:|---:|
| task-switch | polluted-default-compact | false | false | csv, header, trim |  | rate_limiter, MutexRefreshCoordinator, FLAG_AUTH_QUEUE_ROLLBACK, enqueueRefresh, src/auth/queue.ts, markdown parser, quickstart, onboarding docs, auth_refresh_deduplicates_parallel_requests |  | 0 | 49,804 | 57.4% |
| task-switch | polluted-memmould-cache-stable-boundary-compact | true | true | csv, header, trim |  |  | placeholder | 4 | 55,335 | 70.2% |
