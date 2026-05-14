# SWE-Bench Context Stress Analysis

- Run: ./benchmarks/swebench-context/runs/boundary-diagnostic
- Generated: 2026-05-11T17:24:04.257Z

## Aggregate

| Condition | Resolved | F2P | Input Tok | Cache Read Tok | Cache Hit Share | Stale Summaries |
|---|---:|---:|---:|---:|---:|---:|
| polluted-memmould-boundary-compact | 0/1 | 0/0 | 93,610 | 108,544 | 53.7% | 1/1 |
| polluted-memmould-cache-stable-boundary-compact | 0/1 | 0/0 | 33,750 | 178,688 | 84.1% | 1/1 |

## Rows

| Condition | Instance | Resolved | F2P | P2P Regr. | Input Tok | Cache Hit | Eff. Tok Last | Removed Last | Stale Summary Terms | Stale After Issue |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| polluted-memmould-boundary-compact | django__django-16560 | null | 0/0 | 0 | 93,610 | 53.7% | 60 | 7 | MutexRefreshCoordinator, FLAG_AUTH_QUEUE_ROLLBACK, enqueueRefresh, src/auth/queue.ts | markdown parser |
| polluted-memmould-cache-stable-boundary-compact | django__django-16560 | null | 0/0 | 0 | 33,750 | 84.1% | 60 | 8 | rate_limiter, MutexRefreshCoordinator, FLAG_AUTH_QUEUE_ROLLBACK, enqueueRefresh, src/auth/queue.ts, markdown parser | auth rate limiter, MutexRefreshCoordinator, FLAG_AUTH_QUEUE_ROLLBACK, enqueueRefresh, markdown parser, onboarding docs |
