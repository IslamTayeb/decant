# SWE-Bench Context Stress Run

- Model: openai/gpt-5.5
- Dataset: SWE-bench/SWE-bench_Verified
- Instances: pydata__xarray-6992, pylint-dev__pylint-4551, django__django-16560
- Conditions: polluted-memmould-cache-stable-boundary-compact
- Evaluation runner: uv
- SWE-bench evaluation: attempted
- Diagnostic after compaction: no

## Results

| Condition | Instance | Resolved | F2P | P2P Regr. | Quality | Patch | Stats | Error |
|---|---|---:|---:|---:|---:|---|---|---|
| polluted-memmould-cache-stable-boundary-compact | pydata__xarray-6992 | false | 0/12 | 0 | 0.000 | [patch](conditions/polluted-memmould-cache-stable-boundary-compact/pydata__xarray-6992/patch.diff) | [stats](conditions/polluted-memmould-cache-stable-boundary-compact/pydata__xarray-6992/stats.json) |  |
| polluted-memmould-cache-stable-boundary-compact | pylint-dev__pylint-4551 | false | 0/10 | 0 | 0.000 | [patch](conditions/polluted-memmould-cache-stable-boundary-compact/pylint-dev__pylint-4551/patch.diff) | [stats](conditions/polluted-memmould-cache-stable-boundary-compact/pylint-dev__pylint-4551/stats.json) |  |
| polluted-memmould-cache-stable-boundary-compact | django__django-16560 | true | 8/8 | 0 | 1.000 | [patch](conditions/polluted-memmould-cache-stable-boundary-compact/django__django-16560/patch.diff) | [stats](conditions/polluted-memmould-cache-stable-boundary-compact/django__django-16560/stats.json) |  |

## Caveat

This run uses SWE-bench tasks and grading as the substrate, but the context-stress setup is not leaderboard-comparable.

