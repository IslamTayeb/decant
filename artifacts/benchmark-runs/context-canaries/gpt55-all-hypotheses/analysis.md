# Context Canary Analysis

- Run: ./benchmarks/context-canaries/runs/gpt55-all-hypotheses
- Generated: 2026-05-12T03:16:17.351Z

## Aggregate

| Condition | Canary Pass | Hygiene Pass | Input Tok | Cache Read Tok | Cache Hit Share |
|---|---:|---:|---:|---:|---:|
| polluted-default-compact | 0/4 | 0/4 | 132,883 | 332,800 | 71.5% |
| polluted-memmould-cache-stable-boundary-compact | 4/4 | 4/4 | 154,871 | 528,896 | 77.4% |

## Rows

| Canary | Condition | Canary Pass | Hygiene Pass | Current Terms | Stale Output | Visible Stale Summary | Summary Fidelity | Context Tools | Input Tok | Cache Hit |
|---|---|---:|---:|---|---|---|---|---:|---:|---:|
| conversational-inertia | polluted-default-compact | false | false | csv, header, trim |  | auth rate limiter, rate_limiter, MutexRefreshCoordinator, FLAG_AUTH_QUEUE_ROLLBACK, enqueueRefresh, src/auth/queue.ts, markdown parser, quickstart, onboarding docs, auth_refresh_deduplicates_parallel_requests |  | 0 | 22,695 | 80.7% |
| conversational-inertia | polluted-memmould-cache-stable-boundary-compact | true | true | csv, header, trim |  |  | placeholder | 4 | 40,296 | 77.9% |
| current-task-capsule | polluted-default-compact | false | false | csv, header, trim |  | rate_limiter, MutexRefreshCoordinator, FLAG_AUTH_QUEUE_ROLLBACK, enqueueRefresh, src/auth/queue.ts, markdown parser, quickstart, auth_refresh_deduplicates_parallel_requests |  | 0 | 22,519 | 80.5% |
| current-task-capsule | polluted-memmould-cache-stable-boundary-compact | true | true | csv, header, trim |  |  | placeholder | 3 | 32,232 | 80.6% |
| stale-instruction | polluted-default-compact | false | false | csv, header, trim |  | rate_limiter, MutexRefreshCoordinator, FLAG_AUTH_QUEUE_ROLLBACK, enqueueRefresh, src/auth/queue.ts, markdown parser, quickstart, onboarding docs, auth_refresh_deduplicates_parallel_requests |  | 0 | 47,656 | 58.8% |
| stale-instruction | polluted-memmould-cache-stable-boundary-compact | true | true | csv, header, trim |  |  | placeholder | 3 | 43,662 | 74.0% |
| task-switch | polluted-default-compact | false | false | csv, header, trim |  | rate_limiter, MutexRefreshCoordinator, FLAG_AUTH_QUEUE_ROLLBACK, enqueueRefresh, src/auth/queue.ts, markdown parser, quickstart, onboarding docs, auth_refresh_deduplicates_parallel_requests |  | 0 | 40,013 | 65.9% |
| task-switch | polluted-memmould-cache-stable-boundary-compact | true | true | csv, header, trim |  |  | placeholder | 3 | 38,681 | 76.9% |
