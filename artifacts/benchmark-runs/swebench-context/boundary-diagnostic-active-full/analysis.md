# SWE-Bench Context Stress Analysis

- Run: ./benchmarks/swebench-context/runs/boundary-diagnostic-active-full
- Generated: 2026-05-11T17:40:35.557Z

## Aggregate

| Condition | Resolved | F2P | Input Tok | Cache Read Tok | Cache Hit Share | Stale Summaries |
|---|---:|---:|---:|---:|---:|---:|
| polluted-memmould-cache-stable-boundary-compact | 0/1 | 0/0 | 47,766 | 164,352 | 77.5% | 1/1 |

## Rows

| Condition | Instance | Resolved | F2P | P2P Regr. | Input Tok | Cache Hit | Summary Fidelity | Eff. Tok Last | Removed Last | Visible Stale Summary Terms | Stale After Issue |
|---|---|---:|---:|---:|---:|---:|---|---:|---:|---|---|
| polluted-memmould-cache-stable-boundary-compact | django__django-16560 | null | 0/0 | 0 | 47,766 | 77.5% | summary | 140 | 8 | rate_limiter, MutexRefreshCoordinator, FLAG_AUTH_QUEUE_ROLLBACK, enqueueRefresh, src/auth/queue.ts, markdown parser, quickstart |  |
