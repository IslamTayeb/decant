# SWE Recall Benchmark

This benchmark adapts the Code Recall setup to real SWE-bench tasks. The task, repository checkout, patch format, and optional grader are SWE-bench; the experimental variable is how the agent can access prior issue-discussion memory.

It is not leaderboard-comparable. It is a recall benchmark on top of SWE-bench.

## Conditions

- `code-only`: solve from the SWE-bench problem statement and repository only.
- `rlm-transcript-search`: prior issue-discussion memory is available as transcript files under `recall/transcripts/`.
- `decant-only`: prior issue-discussion memory is seeded as real OpenCode sessions with Decant enabled; no transcript corpus is available.
- `decant-guided-rlm`: Decant session tools route to memory first, with transcript files available for corroboration.

The relevant memory currently comes from the SWE-bench row's `hints_text`, not from the gold patch. Distractors are unrelated SWE-bench issue notes.

Solve turns use the same coding tools across conditions (`glob`, `grep`, `read`, `bash`, `apply_patch`). Decant conditions add only `session_lookup`, `session_detail`, and `message_detail` for prior-memory access.

## Run

```sh
export DECANT_E2E_MODEL="<provider>/<model>"
npm run benchmark:swe-recall -- --select-candidates --max-candidates 25
npm run benchmark:swe-recall -- --instances django__django-16560 --conditions code-only,decant-only --skip-eval
```

Useful options:

```sh
npm run benchmark:swe-recall -- --dataset princeton-nlp/SWE-bench_Lite --select-candidates
npm run benchmark:swe-recall -- --instances django__django-16560 --conditions code-only,rlm-transcript-search,decant-only,decant-guided-rlm --eval-runner uv
npm run benchmark:swe-recall -- --distractors pydata__xarray-6992,pylint-dev__pylint-4551 --skip-eval
npm run benchmark:swe-recall -- --analyze-run benchmarks/swe-recall/runs/<run>
```

For live OpenCode runs, pass auth the same way as other benchmarks, for example:

```sh
OPENCODE_AUTH_CONTENT="$(< "$HOME/.local/share/opencode/auth.json")" npm run benchmark:swe-recall -- --model openai/gpt-5.5 --instances django__django-16560 --conditions decant-only --skip-eval
```

## Scoring

Each row records:

- SWE-bench `resolved` and F2P/P2P score when evaluation is not skipped.
- Recall policy: memory conditions with relevant `hints_text` must cite the exact `session_id` and `message_id` used.
- Tool path policy: `rlm-transcript-search` must not use Decant tools; `decant-only` must not read transcript files.
- Token/cache metrics, context-tool counts, transcript reads, irrelevant reads, touched files, and patch size.
- Token efficiency deltas against the `code-only` row for the same instance, including uncached input tokens and total prompt tokens (`input + cacheRead`).

The strict `benchmark_passed` flag requires SWE-bench resolution plus recall/tool-policy success. Use `swebench_resolved` separately when evaluation quality is the only question. Use `recall_benchmark_passed` for cheap canaries where SWE-bench evaluation is skipped.

## Fair Claim

Fair claim if results separate:

> On real SWE-bench tasks, Decant can act as a selective-memory routing layer for prior issue-discussion context, with official SWE-bench grading still used for patch quality.

Avoid claiming:

> This is a SWE-bench leaderboard score.
