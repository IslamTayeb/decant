# Reversible Memory Benchmark

This small benchmark tests a Decant-shaped claim:

> Can an agent hide old context from the next prompt, then recover exact old facts later?

It is not a coding solve-rate benchmark.

## Run

```sh
export DECANT_E2E_MODEL="<provider>/<model>"
npm run benchmark:reversible-memory -- --prepare-only
npm run benchmark:reversible-memory
```

Useful options:

```sh
npm run benchmark:reversible-memory -- --conditions default,default-compaction,rgb-agent,decant,decant-guided-rgb
npm run benchmark:reversible-memory -- --prompt-timeout-minutes 10
npm run benchmark:reversible-memory -- --noise-scale 3
npm run benchmark:reversible-memory -- --analyze-run benchmarks/reversible-memory/runs/<run>
npm run benchmark:reversible-memory -- --out benchmarks/reversible-memory/runs/manual
```

`--noise-scale` defaults to `1`. Higher values add unrelated old billing/cache threads before the final CSV task switch, increasing stale-memory pressure without changing the required auth facts.

Analysis includes prep, cleanup, and recovery token splits. Prep is old-chat construction, cleanup is the prompt-cleaning/current-task path, and recovery is the historical lookup path.

## Conditions

- `default`: same OpenCode session, no Decant, no RGB rewrite.
- `default-compaction`: old transcript is blindly summarized into a default-style compaction summary; the answer turn sees that summary only.
- `rgb-agent`: old transcript is exported to `recall/log.txt`; an editor writes a clean `recall/rgb-context.md`; the answer turn sees only that rewritten file.
- `decant`: same OpenCode session with Decant; the agent hides old topics with `view_context` and `set_fidelity`, then recovers old facts with `session_lookup`, `session_detail`, and exact `message_detail` zoom.
- `decant-guided-rgb`: Decant hides old topics, later recovers exact evidence, writes a small `rgb-context.md`, and a fresh answer turn sees only that evidence file.

## Scoring

The benchmark separates four scores:

- Clean prompt: the immediate CSV answer stays on task, and prompt-visible context avoids planted old auth/docs/test terms.
- Recovered old fact: the follow-up answer recovers the old rollback flag, failed test name, accepted design, and rejected design.
- No extra stale leak: the recovery answer does not dump unrelated docs/quickstart/markdown-parser chatter.
- Route: the condition used the intended path. Decant must zoom into exact messages with `message_detail`, not answer only from broad session summaries.

Expected pattern:

| Condition | Clean Prompt | Recover Old Fact |
|---|---:|---:|
| `default` | no | yes |
| `default-compaction` | no | yes |
| `rgb-agent` | yes | no |
| `decant` | yes | yes |
| `decant-guided-rgb` | yes | yes |

If this pattern holds, the fair claim is narrow: RGB is good for one-off cleanup, while Decant is useful when old context should leave the prompt without deleting the route back to exact decisions.
