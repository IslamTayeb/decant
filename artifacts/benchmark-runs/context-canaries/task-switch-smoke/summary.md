# Context Canary Run

- Model: openai/gpt-5.5
- Canaries: task-switch
- Conditions: polluted-default-compact, polluted-memmould-cache-stable-boundary-compact

## Results

| Canary | Condition | Canary Pass | Hygiene Pass | Stats | Error |
|---|---|---:|---:|---|---|
| task-switch | polluted-default-compact |  |  | [stats](conditions/polluted-default-compact/task-switch/stats.json) | AssertionError [ERR_ASSERTION]: provider is not connected in the isolated sandbox: openai |
| task-switch | polluted-memmould-cache-stable-boundary-compact |  |  | [stats](conditions/polluted-memmould-cache-stable-boundary-compact/task-switch/stats.json) | AssertionError [ERR_ASSERTION]: provider is not connected in the isolated sandbox: openai |

## Caveat

These canaries test context-management failure modes. They are not SWE-bench or product-wide reliability scores.

