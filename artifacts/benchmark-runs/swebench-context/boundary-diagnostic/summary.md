# SWE-Bench Context Stress Run

- Model: openai/gpt-5.5
- Dataset: SWE-bench/SWE-bench_Verified
- Instances: django__django-16560
- Conditions: polluted-memmould-boundary-compact, polluted-memmould-cache-stable-boundary-compact
- Evaluation runner: python
- SWE-bench evaluation: skipped
- Diagnostic after compaction: yes

## Results

| Condition | Instance | Resolved | F2P | P2P Regr. | Quality | Patch | Stats | Error |
|---|---|---:|---:|---:|---:|---|---|---|
| polluted-memmould-boundary-compact | django__django-16560 | null |  |  |  | [patch](conditions/polluted-memmould-boundary-compact/django__django-16560/patch.diff) | [stats](conditions/polluted-memmould-boundary-compact/django__django-16560/stats.json) |  |
| polluted-memmould-cache-stable-boundary-compact | django__django-16560 | null |  |  |  | [patch](conditions/polluted-memmould-cache-stable-boundary-compact/django__django-16560/patch.diff) | [stats](conditions/polluted-memmould-cache-stable-boundary-compact/django__django-16560/stats.json) |  |

## Caveat

This run uses SWE-bench tasks and grading as the substrate, but the context-stress setup is not leaderboard-comparable.

