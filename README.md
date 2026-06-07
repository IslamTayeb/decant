# decant

OpenCode plugin prototype for agent context maps.

decant turns a long agent chat into topics that can be shown at different fidelities: full text, summary, compressed, placeholder, or hidden. The point is to keep current work readable while old work stays recoverable.

It also experiments with provenance: `/blame <file>:<line>` tries to route from code back to the old agent session/message that explains why the line exists.

## What's Here

- `src/server-plugin.ts`: server plugin, context tools, storage, blame lookup.
- `src/tui-plugin.tsx`: TUI sidebar and commands.
- `test/`: fast unit/regression tests.
- `tools/`: sandbox setup, validation, fixture, and artifact scripts.
- `benchmarks/`: benchmark harnesses and per-benchmark docs.
- `artifacts/benchmark-runs/`: curated benchmark evidence.
- `fixtures/`: small demo/validation data.

## Install

```sh
npm install
```

## Fast Dev Checks

```sh
npm run typecheck
npm test
npm run validate:blame-tui
```

## Disposable Demo

```sh
npm run setup:test-env
```

That prints a launch script for a disposable OpenCode test repo. Run the script, then try:

```text
/context
/blame src/auth/rate_limiter.ts:42
```

## Model-Backed Validation

Use a GPT-family model for live validation and public evidence runs.

```sh
export DECANT_E2E_MODEL="<provider>/<model>"
npm run validate:sandbox
npm run validate:long-session
npm run evaluate:compaction
```

## Manual Plugin Load

The plugin is not packaged. After local checks pass, link the entrypoints into a target project:

```sh
cd /path/to/target-project
mkdir -p .opencode/plugins
ln -s /path/to/decant/src/server-plugin.ts .opencode/plugins/context-map.ts
ln -s /path/to/decant/src/tui-plugin.tsx .opencode/plugins/context-map-tui.tsx
```

Add `.opencode/tui.json` if you want the TUI plugin:

```json
{
  "plugin": ["./plugins/context-map-tui.tsx"]
}
```

Start OpenCode from the target project. Sideband maps are written to `~/.opencode/context-maps/<session-id>.json`.

## Benchmarks

Benchmark details live in each `benchmarks/*/README.md`. Raw runs stay ignored under `benchmarks/*/runs/`; curated public artifacts live under `artifacts/benchmark-runs/`.

Common commands:

```sh
npm run benchmark:memory-infra
npm run benchmark:provenance-qa
npm run benchmark:code-recall
npm run artifacts:export
```
