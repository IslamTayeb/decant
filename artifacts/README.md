# Artifacts

Portable benchmark artifacts live under `artifacts/benchmark-runs/`.

Raw benchmark runs stay in `benchmarks/*/runs/` and remain ignored because they can include large OpenCode roots, SQLite databases, logs, and temporary worktrees. Export them with:

```sh
npm run artifacts:export
```

The exporter copies report files, charts, stats, model messages, patches, predictions, and evaluation output while skipping raw runtime state. It also normalizes older transcript-search condition names to the current RLM-oriented names.
