# SWE-Bench Context Stress Analysis

- Run: ./benchmarks/swebench-context/runs/gpt55-cache-stable-hard-primary
- Generated: 2026-05-11T23:02:44.873Z

## Aggregate

| Condition | Resolved | F2P | Input Tok | Cache Read Tok | Cache Hit Share | Stale Summaries |
|---|---:|---:|---:|---:|---:|---:|
| polluted-decant-cache-stable-boundary-compact | 1/3 | 8/30 | 269,804 | 3,200,512 | 92.2% | 0/3 |

## Rows

| Condition | Instance | Resolved | F2P | P2P Regr. | Input Tok | Cache Hit | Summary Fidelity | Eff. Tok Last | Removed Last | Visible Stale Summary Terms | Stale After Issue |
|---|---|---:|---:|---:|---:|---:|---|---:|---:|---|---|
| polluted-decant-cache-stable-boundary-compact | django__django-16560 | true | 8/8 | 0 | 125,355 | 92.7% | placeholder | 48354 | 7 |  |  |
| polluted-decant-cache-stable-boundary-compact | pydata__xarray-6992 | false | 0/12 | 0 | 76,416 | 91.1% | placeholder | 19950 | 7 |  |  |
| polluted-decant-cache-stable-boundary-compact | pylint-dev__pylint-4551 | false | 0/10 | 0 | 68,033 | 92.3% | placeholder | 21202 | 7 |  |  |
