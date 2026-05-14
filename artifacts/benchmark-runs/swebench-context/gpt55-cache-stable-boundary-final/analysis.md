# SWE-Bench Context Stress Analysis

- Run: ./benchmarks/swebench-context/runs/gpt55-cache-stable-boundary-final
- Generated: 2026-05-11T17:51:47.818Z

## Aggregate

| Condition | Resolved | F2P | Input Tok | Cache Read Tok | Cache Hit Share | Stale Summaries |
|---|---:|---:|---:|---:|---:|---:|
| polluted-memmould-cache-stable-boundary-compact | 1/1 | 8/8 | 75,155 | 1,086,976 | 93.5% | 0/1 |

## Rows

| Condition | Instance | Resolved | F2P | P2P Regr. | Input Tok | Cache Hit | Summary Fidelity | Eff. Tok Last | Removed Last | Visible Stale Summary Terms | Stale After Issue |
|---|---|---:|---:|---:|---:|---:|---|---:|---:|---|---|
| polluted-memmould-cache-stable-boundary-compact | django__django-16560 | true | 8/8 | 0 | 75,155 | 93.5% | placeholder | 38574 | 8 |  |  |
