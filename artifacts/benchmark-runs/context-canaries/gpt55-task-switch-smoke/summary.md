# Context Canary Run

- Model: openai/gpt-5.5
- Canaries: task-switch
- Conditions: polluted-default-compact, polluted-memmould-cache-stable-boundary-compact

## Results

| Canary | Condition | Canary Pass | Hygiene Pass | Stats | Error |
|---|---|---:|---:|---|---|
| task-switch | polluted-default-compact | false | false | [stats](conditions/polluted-default-compact/task-switch/stats.json) |  |
| task-switch | polluted-memmould-cache-stable-boundary-compact | true | true | [stats](conditions/polluted-memmould-cache-stable-boundary-compact/task-switch/stats.json) |  |

## Caveat

These canaries test context-management failure modes. They are not SWE-bench or product-wide reliability scores.

