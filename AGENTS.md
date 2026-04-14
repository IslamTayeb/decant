# AGENTS.md

## Project

mem-mould -- LLM context visualization and multi-agent context coordination. Active implementation track is an OpenCode plugin prototype in TypeScript/Bun. Broader future system work may still target Python 3.11+.

## Base Repository Structure

```
mem-mould/
  AGENTS.md
  notes/
    blog-notes.md             # Raw notes/facts for eventual blog post
    experiments/              # Experiment write-ups (YYYY-MM-DD-slug.md)
    plans/
      active/                 # Current plans
      archived/               # Completed/abandoned plans
    references/               # Papers, codebases, research notes (read-only)
      INDEX.md                # Paper/codebase catalog -- start here
      old-notes.md            # Early research notes and literature survey
      papers/                 # 25 PDFs (shortname_arxivid.pdf)
      codebases/              # 28 shallow-cloned repos -- do not modify
```

For research context (papers, codebases, thesis), see `notes/references/INDEX.md`.

## Notes Workflow

### Experiments (`notes/experiments/`)

When trying any non-trivial approach or prototype, **always** create an experiment file:

- **Filename**: `YYYY-MM-DD-slug.md` (e.g. `2026-03-31-gist-token-test.md`)
- **Template**:
  ```markdown
  # <Title>

  ## Goal
  What we're trying to learn or build.

  ## Approach
  What was done.

  ## Results
  What happened.

  ## Takeaways
  What we learned, what to do next.
  ```

### Plans (`notes/plans/`)

- **Active plans** go in `notes/plans/active/`.
- **Completed or abandoned plans** move to `notes/plans/archived/`.
- **Template**:
  ```markdown
  # <Title>

  ## Objective
  What this plan achieves.

  ## Steps
  - [ ] Step 1
  - [ ] Step 2

  ## Status
  In progress / Blocked / Done / Abandoned.

  ## Outcome
  (Filled in when archived.)
  ```

### References (`notes/references/`)

Read-only. Do not modify codebases. Cross-reference papers via `INDEX.md`.

## External References

### OpenCode (local)

Path: `../opencode` (relative to repo root)

Read-only. Do not modify. Key directories for plugin implementation reference:

- `packages/plugin/src/` -- plugin SDK (hooks, tools, TUI)
- `packages/opencode/src/session/` -- compaction, overflow, prompt assembly
- `packages/opencode/src/plugin/` -- plugin loading and lifecycle
- `packages/opencode/src/tool/` -- tool registration, task/subagent
- `packages/opencode/src/agent/` -- agent architecture

### Links

- OpenCode plugin docs: https://opencode.ai/docs/plugins/

## OpenCode Plugin Development Rules

### Isolation

- `../opencode` is **read-only**. Do not modify anything in that checkout.
- **Do not place WIP plugin code under `.opencode/plugins/`** during development. OpenCode auto-discovers `{plugin,plugins}/*.{ts,js}` inside any `.opencode/` directory in the project tree and loads them into every session for that repo. Placing unvalidated code there would affect the user's normal sessions.
- Move plugin code to `.opencode/plugins/` only **after the three pre-build validation gates pass**.

### Automated Testing via Sandboxed Headless Server

All automated testing must use an isolated `opencode serve` process so it never touches the user's normal OpenCode config, database, or sessions. Launch it with:

- Temp `HOME`
- Temp `XDG_DATA_HOME`, `XDG_CONFIG_HOME`, `XDG_STATE_HOME`, `XDG_CACHE_HOME`
- Temp `OPENCODE_DB` (`:memory:` or temp file)
- `OPENCODE_CONFIG_CONTENT` with explicit `file://...` plugin spec pointing at the WIP plugin source
- `OPENCODE_DISABLE_PROJECT_CONFIG=1` (so repo-local config is not loaded)

Drive the server through the SDK: `session.create`, `session.prompt`, `session.messages`.

If provider auth is needed inside the sandbox, copy only the required credentials into the temp server via the `PUT /auth/{providerID}` API. Do not read or mutate the user's real auth store directly.

### Validation Models

Primary targets for annotation reliability testing:

- Claude Opus 4.6 (Bedrock provider)
- GPT-5.4

### Pre-Build Validation Gates

Three manual/scripted tests must broadly pass **before** any plugin code is placed under `.opencode/plugins/`:

1. **Annotation reliability** -- multi-turn conversation with annotation instructions; check format, blob assignment, summary quality.
2. **Map navigation** -- fake context map at placeholder level; check blob selection and zoom requests.
3. **Sub-agent investigation** -- past session map at placeholder level in a task prompt; check navigation and focused summarization.

Record each validation run as an experiment note in `notes/experiments/`.

### Experiment Notes for Validation

Context-map validation runs (annotation reliability, map navigation, sub-agent investigation) must be documented as experiment files before implementation proceeds. Follow the standard experiment template.

## Git Workflow

- **Commit and push regularly** -- after completing each logical unit of work (feature, bugfix, refactor), not in large batches.
- **Never use direct Anthropic API** for automated testing or fixture generation. Always use **Amazon Bedrock** as the provider.
- Commit messages: concise summary line, then body with what changed and why.
- Do not amend or force-push unless explicitly asked.

