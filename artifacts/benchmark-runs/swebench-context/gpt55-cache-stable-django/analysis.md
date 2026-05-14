# SWE-Bench Context Stress Analysis

- Run: ./benchmarks/swebench-context/runs/gpt55-cache-stable-django
- Generated: 2026-05-11T17:34:52.153Z

## Aggregate

| Condition | Resolved | F2P | Input Tok | Cache Read Tok | Cache Hit Share | Stale Summaries |
|---|---:|---:|---:|---:|---:|---:|
| polluted-memmould-cache-stable-boundary-compact | 1/1 | 8/8 | 138,483 | 1,484,288 | 91.5% | 0/1 |

## Rows

| Condition | Instance | Resolved | F2P | P2P Regr. | Input Tok | Cache Hit | Summary Fidelity | Eff. Tok Last | Removed Last | Visible Stale Summary Terms | Stale After Issue |
|---|---|---:|---:|---:|---:|---:|---|---:|---:|---|---|
| polluted-memmould-cache-stable-boundary-compact | django__django-16560 | true | 8/8 | 0 | 138,483 | 91.5% | placeholder | 180 | 35 |  |  |
