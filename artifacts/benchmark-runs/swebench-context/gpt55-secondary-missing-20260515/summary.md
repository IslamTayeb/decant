# SWE-Bench Context Stress Run

- Model: openai/gpt-5.5
- Dataset: SWE-bench/SWE-bench_Verified
- Instances: pydata__xarray-6992, pylint-dev__pylint-4551, django__django-16560
- Conditions: clean-no-plugin, polluted-no-compact, polluted-decant-tools-no-compact, polluted-decant-boundary-compact
- Evaluation runner: uv
- SWE-bench evaluation: attempted
- Diagnostic after compaction: no

## Results

| Condition | Instance | Resolved | F2P | P2P Regr. | Quality | Patch | Stats | Error |
|---|---|---:|---:|---:|---:|---|---|---|
| clean-no-plugin | pydata__xarray-6992 | false | 0/12 | 0 | 0.000 | [patch](conditions/clean-no-plugin/pydata__xarray-6992/patch.diff) | [stats](conditions/clean-no-plugin/pydata__xarray-6992/stats.json) |  |
| clean-no-plugin | pylint-dev__pylint-4551 | false | 0/10 | 0 | 0.000 | [patch](conditions/clean-no-plugin/pylint-dev__pylint-4551/patch.diff) | [stats](conditions/clean-no-plugin/pylint-dev__pylint-4551/stats.json) |  |
| clean-no-plugin | django__django-16560 | true | 8/8 | 0 | 1.000 | [patch](conditions/clean-no-plugin/django__django-16560/patch.diff) | [stats](conditions/clean-no-plugin/django__django-16560/stats.json) |  |
| polluted-no-compact | pydata__xarray-6992 | false | 0/12 | 0 | 0.000 | [patch](conditions/polluted-no-compact/pydata__xarray-6992/patch.diff) | [stats](conditions/polluted-no-compact/pydata__xarray-6992/stats.json) |  |
| polluted-no-compact | pylint-dev__pylint-4551 | false | 0/10 | 0 | 0.000 | [patch](conditions/polluted-no-compact/pylint-dev__pylint-4551/patch.diff) | [stats](conditions/polluted-no-compact/pylint-dev__pylint-4551/stats.json) |  |
| polluted-no-compact | django__django-16560 | true | 8/8 | 0 | 1.000 | [patch](conditions/polluted-no-compact/django__django-16560/patch.diff) | [stats](conditions/polluted-no-compact/django__django-16560/stats.json) |  |
| polluted-decant-tools-no-compact | pydata__xarray-6992 | false | 0/12 | 0 | 0.000 | [patch](conditions/polluted-decant-tools-no-compact/pydata__xarray-6992/patch.diff) | [stats](conditions/polluted-decant-tools-no-compact/pydata__xarray-6992/stats.json) |  |
| polluted-decant-tools-no-compact | pylint-dev__pylint-4551 | false | 0/10 | 0 | 0.000 | [patch](conditions/polluted-decant-tools-no-compact/pylint-dev__pylint-4551/patch.diff) | [stats](conditions/polluted-decant-tools-no-compact/pylint-dev__pylint-4551/stats.json) |  |
| polluted-decant-tools-no-compact | django__django-16560 | false | 8/8 | 1 | 0.985 | [patch](conditions/polluted-decant-tools-no-compact/django__django-16560/patch.diff) | [stats](conditions/polluted-decant-tools-no-compact/django__django-16560/stats.json) |  |
| polluted-decant-boundary-compact | pydata__xarray-6992 | false | 0/12 | 0 | 0.000 | [patch](conditions/polluted-decant-boundary-compact/pydata__xarray-6992/patch.diff) | [stats](conditions/polluted-decant-boundary-compact/pydata__xarray-6992/stats.json) |  |
| polluted-decant-boundary-compact | pylint-dev__pylint-4551 | false | 0/10 | 0 | 0.000 | [patch](conditions/polluted-decant-boundary-compact/pylint-dev__pylint-4551/patch.diff) | [stats](conditions/polluted-decant-boundary-compact/pylint-dev__pylint-4551/stats.json) |  |
| polluted-decant-boundary-compact | django__django-16560 | true | 8/8 | 0 | 1.000 | [patch](conditions/polluted-decant-boundary-compact/django__django-16560/patch.diff) | [stats](conditions/polluted-decant-boundary-compact/django__django-16560/stats.json) |  |

## Caveat

This run uses SWE-bench tasks and grading as the substrate, but the context-stress setup is not leaderboard-comparable.
