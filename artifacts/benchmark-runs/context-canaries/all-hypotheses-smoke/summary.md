# Context Canary Run

- Model: openai/gpt-5.5
- Canaries: task-switch, stale-instruction, conversational-inertia, current-task-capsule
- Conditions: polluted-default-compact, polluted-memmould-cache-stable-boundary-compact

## Results

| Canary | Condition | Canary Pass | Hygiene Pass | Stats | Error |
|---|---|---:|---:|---|---|
| task-switch | polluted-default-compact |  |  | [stats](conditions/polluted-default-compact/task-switch/stats.json) | AssertionError [ERR_ASSERTION]: provider is not connected in the isolated sandbox: openai |
| stale-instruction | polluted-default-compact |  |  | [stats](conditions/polluted-default-compact/stale-instruction/stats.json) | AssertionError [ERR_ASSERTION]: provider is not connected in the isolated sandbox: openai |
| conversational-inertia | polluted-default-compact |  |  | [stats](conditions/polluted-default-compact/conversational-inertia/stats.json) | AssertionError [ERR_ASSERTION]: provider is not connected in the isolated sandbox: openai |
| current-task-capsule | polluted-default-compact |  |  | [stats](conditions/polluted-default-compact/current-task-capsule/stats.json) | AssertionError [ERR_ASSERTION]: provider is not connected in the isolated sandbox: openai |
| task-switch | polluted-memmould-cache-stable-boundary-compact |  |  | [stats](conditions/polluted-memmould-cache-stable-boundary-compact/task-switch/stats.json) | AssertionError [ERR_ASSERTION]: provider is not connected in the isolated sandbox: openai |
| stale-instruction | polluted-memmould-cache-stable-boundary-compact |  |  | [stats](conditions/polluted-memmould-cache-stable-boundary-compact/stale-instruction/stats.json) | AssertionError [ERR_ASSERTION]: provider is not connected in the isolated sandbox: openai |
| conversational-inertia | polluted-memmould-cache-stable-boundary-compact |  |  | [stats](conditions/polluted-memmould-cache-stable-boundary-compact/conversational-inertia/stats.json) | AssertionError [ERR_ASSERTION]: provider is not connected in the isolated sandbox: openai |
| current-task-capsule | polluted-memmould-cache-stable-boundary-compact |  |  | [stats](conditions/polluted-memmould-cache-stable-boundary-compact/current-task-capsule/stats.json) | AssertionError [ERR_ASSERTION]: provider is not connected in the isolated sandbox: openai |

## Caveat

These canaries test context-management failure modes. They are not SWE-bench or product-wide reliability scores.

