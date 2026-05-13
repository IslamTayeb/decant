# Context Canary Run

- Model: openai/gpt-5.5
- Canaries: task-switch, stale-instruction, conversational-inertia, current-task-capsule
- Conditions: polluted-default-compact, polluted-memmould-cache-stable-boundary-compact

## Results

| Canary | Condition | Canary Pass | Hygiene Pass | Stats | Error |
|---|---|---:|---:|---|---|
| task-switch | polluted-default-compact | false | false | [stats](conditions/polluted-default-compact/task-switch/stats.json) |  |
| stale-instruction | polluted-default-compact | false | false | [stats](conditions/polluted-default-compact/stale-instruction/stats.json) |  |
| conversational-inertia | polluted-default-compact | false | false | [stats](conditions/polluted-default-compact/conversational-inertia/stats.json) |  |
| current-task-capsule | polluted-default-compact | false | false | [stats](conditions/polluted-default-compact/current-task-capsule/stats.json) |  |
| task-switch | polluted-memmould-cache-stable-boundary-compact | true | true | [stats](conditions/polluted-memmould-cache-stable-boundary-compact/task-switch/stats.json) |  |
| stale-instruction | polluted-memmould-cache-stable-boundary-compact | true | true | [stats](conditions/polluted-memmould-cache-stable-boundary-compact/stale-instruction/stats.json) |  |
| conversational-inertia | polluted-memmould-cache-stable-boundary-compact | true | true | [stats](conditions/polluted-memmould-cache-stable-boundary-compact/conversational-inertia/stats.json) |  |
| current-task-capsule | polluted-memmould-cache-stable-boundary-compact | true | true | [stats](conditions/polluted-memmould-cache-stable-boundary-compact/current-task-capsule/stats.json) |  |

## Caveat

These canaries test context-management failure modes. They are not SWE-bench or product-wide reliability scores.

