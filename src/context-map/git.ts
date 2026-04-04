import fs from "node:fs/promises";
import path from "node:path";

import { contextMapRoot } from "./storage";

type Shell = {
  cwd(newCwd: string): Shell;
  nothrow(): Shell;
  (
    strings: TemplateStringsArray,
    ...expressions: unknown[]
  ): {
    quiet(): {
      text(): Promise<string>;
    };
  };
};

const MARKER_START = "# mem-mould-context-map start";
const MARKER_END = "# mem-mould-context-map end";
const HOOKS = ["post-commit", "post-merge", "post-rewrite"] as const;

export async function ensureContextMapGitHook(input: {
  $: Shell;
  worktree: string;
  directory: string;
}) {
  const gitDir = await resolveGitCommonDir(input).catch(() => undefined);
  if (!gitDir) return;

  const hooksDir = path.join(gitDir, "hooks");
  await fs.mkdir(hooksDir, { recursive: true });

  const helperPath = path.join(hooksDir, "context-map-post-commit");

  await fs.writeFile(helperPath, helperScript());
  await fs.chmod(helperPath, 0o755);

  const snippet = `${MARKER_START}\nif [ -x \"$(dirname \"$0\")/context-map-post-commit\" ]; then\n  \"$(dirname \"$0\")/context-map-post-commit\"\nfi\n${MARKER_END}\n`;

  for (const hookName of HOOKS) {
    const hookPath = path.join(hooksDir, hookName);
    const existing = await fs
      .readFile(hookPath, "utf8")
      .catch(() => "#!/bin/sh\n");
    if (!existing.includes(MARKER_START)) {
      const next = existing.endsWith("\n")
        ? `${existing}${snippet}`
        : `${existing}\n${snippet}`;
      await fs.writeFile(hookPath, next);
    }
    await fs.chmod(hookPath, 0o755);
  }
}

async function resolveGitCommonDir(input: {
  $: Shell;
  worktree: string;
  directory: string;
}) {
  const shell = input.$.cwd(input.worktree).nothrow();
  const result = await shell`git rev-parse --git-common-dir`.quiet().text();
  const gitDir = result.trim();
  if (!gitDir) return undefined;
  return path.resolve(input.worktree, gitDir);
}

function helperScript() {
  const root = JSON.stringify(contextMapRoot());
  return `#!/bin/sh
session_id="${"${OPENCODE_SESSION_ID:-}"}"
[ -n "$session_id" ] || exit 0
commit_hash="$(git rev-parse HEAD 2>/dev/null)"
[ -n "$commit_hash" ] || exit 0

node - "$session_id" "$commit_hash" ${root} <<'NODE'
const fs = require('fs')
const path = require('path')

const [, , sessionID, commitHash, root] = process.argv
const commitFile = path.join(root, '_commits.json')
const sessionFile = path.join(root, sessionID + '.json')
let activeBlobID
let activeBlobLabel
let activeBlobIDs = []

try {
  const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'))
  activeBlobID = session.lastActiveBlobID
  if (activeBlobID && session.blobs && session.blobs[activeBlobID]) {
    activeBlobLabel = session.blobs[activeBlobID].label
    activeBlobIDs = [activeBlobID]
  }
} catch {}

let file = { version: 1, updatedAt: Date.now(), entries: {} }
try {
  file = JSON.parse(fs.readFileSync(commitFile, 'utf8'))
  if (!file.entries || typeof file.entries !== 'object') file.entries = {}
} catch {}

file.entries[commitHash] = {
  commitHash,
  sessionID,
  timestamp: Date.now(),
  directory: process.cwd(),
  worktree: process.cwd(),
  activeBlobID,
  activeBlobLabel,
  activeBlobIDs,
}
file.updatedAt = Date.now()

fs.mkdirSync(root, { recursive: true })
const temp = commitFile + '.tmp-' + process.pid + '-' + Date.now()
fs.writeFileSync(temp, JSON.stringify(file, null, 2))
fs.renameSync(temp, commitFile)
NODE
`;
}
