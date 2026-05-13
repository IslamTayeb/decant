# SWE-Bench Context Stress Run

- Model: openai/gpt-5.5
- Dataset: princeton-nlp/SWE-bench_Lite
- Instances: sympy__sympy-20590
- Conditions: polluted-default-compact, polluted-memmould-compact
- SWE-bench evaluation: skipped

## Results

| Condition | Instance | Resolved | Patch | Stats | Error |
|---|---|---:|---|---|---|
| polluted-default-compact | sympy__sympy-20590 | null | [patch](conditions/polluted-default-compact/sympy__sympy-20590/patch.diff) | [stats](conditions/polluted-default-compact/sympy__sympy-20590/stats.json) |  |
| polluted-memmould-compact | sympy__sympy-20590 | null | [patch](conditions/polluted-memmould-compact/sympy__sympy-20590/patch.diff) | [stats](conditions/polluted-memmould-compact/sympy__sympy-20590/stats.json) |  |

## Caveat

This run uses SWE-bench tasks and grading as the substrate, but the context-stress setup is not leaderboard-comparable.

