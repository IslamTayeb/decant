# SWE-Bench Context Stress Analysis

- Run: ./benchmarks/swebench-context/runs/gpt55-secondary-missing-20260515
- Generated: 2026-05-15T04:39:50.760Z

## Aggregate

| Condition | Resolved | F2P | Input Tok | Cache Read Tok | Cache Hit Share | Stale Summaries |
|---|---:|---:|---:|---:|---:|---:|
| clean-no-plugin | 1/3 | 8/30 | 140,865 | 1,928,704 | 93.2% | 0/3 |
| polluted-memmould-boundary-compact | 1/3 | 8/30 | 3,079,973 | 1,005,056 | 24.6% | 0/3 |
| polluted-memmould-tools-no-compact | 0/3 | 8/30 | 2,832,393 | 806,912 | 22.2% | 0/3 |
| polluted-no-compact | 1/3 | 8/30 | 207,139 | 2,748,416 | 93.0% | 0/3 |

## Rows

| Condition | Instance | Resolved | F2P | P2P Regr. | Input Tok | Cache Hit | Summary Fidelity | Eff. Tok Last | Removed Last | Visible Stale Summary Terms | Stale After Issue |
|---|---|---:|---:|---:|---:|---:|---|---:|---:|---|---|
| clean-no-plugin | django__django-16560 | true | 8/8 | 0 | 58,729 | 94.2% |  |  |  |  |  |
| clean-no-plugin | pydata__xarray-6992 | false | 0/12 | 0 | 29,113 | 81.0% |  |  |  |  |  |
| clean-no-plugin | pylint-dev__pylint-4551 | false | 0/10 | 0 | 53,023 | 94.1% |  |  |  |  |  |
| polluted-memmould-boundary-compact | django__django-16560 | true | 8/8 | 0 | 1,650,756 | 20.6% | placeholder | 40357 | 8 |  |  |
| polluted-memmould-boundary-compact | pydata__xarray-6992 | false | 0/12 | 0 | 525,573 | 35.8% | placeholder | 15985 | 8 |  |  |
| polluted-memmould-boundary-compact | pylint-dev__pylint-4551 | false | 0/10 | 0 | 903,644 | 23.9% | placeholder | 28348 | 7 |  |  |
| polluted-memmould-tools-no-compact | django__django-16560 | false | 8/8 | 1 | 1,795,617 | 16.7% |  | 23641 | 0 |  |  |
| polluted-memmould-tools-no-compact | pydata__xarray-6992 | false | 0/12 | 0 | 408,950 | 33.9% |  | 15596 | 8 |  |  |
| polluted-memmould-tools-no-compact | pylint-dev__pylint-4551 | false | 0/10 | 0 | 627,826 | 27.5% |  | 38076 | 8 |  |  |
| polluted-no-compact | django__django-16560 | true | 8/8 | 0 | 83,666 | 94.3% |  |  |  |  |  |
| polluted-no-compact | pydata__xarray-6992 | false | 0/12 | 0 | 36,495 | 87.4% |  |  |  |  |  |
| polluted-no-compact | pylint-dev__pylint-4551 | false | 0/10 | 0 | 86,978 | 92.7% |  |  |  |  |  |
