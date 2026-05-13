# SWE-Bench Context Stress Analysis

- Run: /Users/islamtayeb/Documents/GitHub/mem-mould/benchmarks/swebench-context/runs/boundary-diagnostic-full-fallback
- Generated: 2026-05-11T17:38:02.327Z

## Aggregate

| Condition | Resolved | F2P | Input Tok | Cache Read Tok | Cache Hit Share | Stale Summaries |
|---|---:|---:|---:|---:|---:|---:|
| polluted-memmould-cache-stable-boundary-compact | 0/1 | 0/0 | 27,824 | 169,472 | 85.9% | 1/1 |

## Rows

| Condition | Instance | Resolved | F2P | P2P Regr. | Input Tok | Cache Hit | Summary Fidelity | Eff. Tok Last | Removed Last | Visible Stale Summary Terms | Stale After Issue |
|---|---|---:|---:|---:|---:|---:|---|---:|---:|---|---|
| polluted-memmould-cache-stable-boundary-compact | django__django-16560 | null | 0/0 | 0 | 27,824 | 85.9% | summary | 140 | 7 | MutexRefreshCoordinator, FLAG_AUTH_QUEUE_ROLLBACK, enqueueRefresh, src/auth/queue.ts |  |
