import { exec, execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

/**
 * Instant test environment setup.
 *
 * Reads pre-generated fixtures from fixtures/ (created by
 * generate-test-fixtures.ts) and copies them into a fresh temp directory
 * with patched paths. Takes <5 seconds instead of 10-15 minutes.
 */
async function main() {
  const projectRoot = path.resolve(process.cwd());
  const fixturesDir = path.join(projectRoot, "fixtures");

  // ── Check fixtures exist ──────────────────────────────────────────
  let metadata: {
    originalRepo: string;
    originalHome: string;
    sessions: Record<string, string>;
    commits: Record<string, string>;
  };
  try {
    metadata = JSON.parse(
      await fs.readFile(path.join(fixturesDir, "metadata.json"), "utf8"),
    );
  } catch {
    console.error(
      "Fixtures not found. Run 'npm run generate:fixtures' first (one-time, ~10-15 min).",
    );
    process.exitCode = 1;
    return;
  }

  console.log("Setting up test environment from fixtures...");

  // ── Create temp directories ───────────────────────────────────────
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "mem-mould-context-map-manual-"),
  );
  const repo = path.join(tempRoot, "demo-repo");
  const home = path.join(tempRoot, "home");
  const data = path.join(tempRoot, "data");
  const config = path.join(tempRoot, "config");
  const state = path.join(tempRoot, "state");
  const cache = path.join(tempRoot, "cache");
  await Promise.all(
    [home, data, config, state, cache].map((d) =>
      fs.mkdir(d, { recursive: true }),
    ),
  );

  // ── Clone demo repo from bundle ──────────────────────────────────
  const bundlePath = path.join(fixturesDir, "demo-repo.bundle");
  await execFileAsync("git", ["clone", bundlePath, repo]);
  await execFileAsync("git", ["remote", "remove", "origin"], {
    cwd: repo,
  }).catch(() => {});
  // Set git identity (needed for any future commits in the test env)
  await execFileAsync("git", ["config", "user.name", "Context Map Demo"], {
    cwd: repo,
  });
  await execFileAsync(
    "git",
    ["config", "user.email", "context-map-demo@example.com"],
    { cwd: repo },
  );

  // ── Set up plugin wiring ─────────────────────────────────────────
  await fs.mkdir(path.join(repo, ".opencode", "plugins"), { recursive: true });
  await fs.symlink(
    path.join(projectRoot, "src", "server-plugin.ts"),
    path.join(repo, ".opencode", "plugins", "context-map.ts"),
  );
  await fs.symlink(
    path.join(projectRoot, "src", "tui-plugin.tsx"),
    path.join(repo, ".opencode", "plugins", "context-map-tui.tsx"),
  );
  await fs.writeFile(
    path.join(repo, "tui.json"),
    `${JSON.stringify({ plugin: ["./.opencode/plugins/context-map-tui.tsx"] }, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(repo, ".opencode", "tui.json"),
    `${JSON.stringify({ plugin: ["./plugins/context-map-tui.tsx"] }, null, 2)}\n`,
  );

  // ── Copy and patch SQLite database ───────────────────────────────
  const fixtureSqlite = path.join(fixturesDir, "opencode.sqlite");
  const dbDst = path.join(tempRoot, "opencode.sqlite");
  const { stdout: dump } = await execFileAsync(
    "sqlite3",
    [fixtureSqlite, ".dump"],
    { maxBuffer: 50 * 1024 * 1024 },
  );
  const patchedDump = dump.replaceAll(metadata.originalRepo, repo);
  const tmpSql = path.join(tempRoot, "import.sql");
  await fs.writeFile(tmpSql, patchedDump);
  await execAsync(`sqlite3 ${shellQuote(dbDst)} < ${shellQuote(tmpSql)}`);
  await fs.rm(tmpSql);

  // ── Copy and patch context maps ──────────────────────────────────
  const mapsDir = path.join(home, ".opencode", "context-maps");
  await fs.mkdir(mapsDir, { recursive: true });
  const srcMaps = path.join(fixturesDir, "context-maps");
  const mapFiles = await fs.readdir(srcMaps).catch(() => [] as string[]);
  for (const file of mapFiles) {
    let content = await fs.readFile(path.join(srcMaps, file), "utf8");
    content = content.replaceAll(metadata.originalRepo, repo);
    if (metadata.originalHome) {
      content = content.replaceAll(metadata.originalHome, home);
    }
    await fs.writeFile(path.join(mapsDir, file), content);
  }

  // ── Write launch and cleanup scripts ─────────────────────────────
  const envVars = {
    HOME: home,
    XDG_DATA_HOME: data,
    XDG_CONFIG_HOME: config,
    XDG_STATE_HOME: state,
    XDG_CACHE_HOME: cache,
    OPENCODE_DB: dbDst,
  };
  const launch = [
    "#!/bin/sh",
    ...Object.entries(envVars).map(([k, v]) => `export ${k}=${shellQuote(v)}`),
    `cd ${shellQuote(repo)} || exit 1`,
    'exec opencode "$@"',
    "",
  ].join("\n");
  const cleanup = `#!/bin/sh\nrm -rf ${shellQuote(tempRoot)}\n`;

  await fs.writeFile(path.join(tempRoot, "open-test-env.sh"), launch);
  await fs.writeFile(path.join(tempRoot, "cleanup-test-env.sh"), cleanup);
  await fs.chmod(path.join(tempRoot, "open-test-env.sh"), 0o755);
  await fs.chmod(path.join(tempRoot, "cleanup-test-env.sh"), 0o755);

  // ── Write testing guide ──────────────────────────────────────────
  await writeTestingGuide(repo, metadata.sessions, metadata.commits);

  // ── Done ─────────────────────────────────────────────────────────
  const elapsed = process.uptime().toFixed(1);
  console.log(`\nReady in ${elapsed}s\n`);
  console.log(`  Launch:  sh ${path.join(tempRoot, "open-test-env.sh")}`);
  console.log(`  Cleanup: sh ${path.join(tempRoot, "cleanup-test-env.sh")}`);
  console.log(`  Guide:   ${path.join(repo, "TESTING.md")}`);
  console.log(`  Repo:    ${repo}`);
  console.log(`\n  Sessions: ${Object.keys(metadata.sessions).length}`);
  console.log(`  Commits:  ${Object.keys(metadata.commits).length}`);
}

function shellQuote(value: string) {
  return JSON.stringify(value);
}

async function writeTestingGuide(
  repo: string,
  sessions: Record<string, string>,
  commits: Record<string, string>,
) {
  const guide = [
    "# Manual Testing Guide",
    "",
    "## Start",
    "Run the launch script printed by setup-test-env.",
    "",
    "## Good first checks",
    "",
    "### Context map dialog",
    "- Open `/context`",
    "- Press `ctrl+g` or click `open` in the Context Map sidebar block",
    "- ctrl+p should also show 'Open context map'",
    "- Check Topics tab: blob list with fidelity controls (1-5 keys)",
    "- Check Messages tab: message list grouped by blob",
    "- Use j/k to navigate, tab to switch tabs",
    "",
    "### Sidebar preview",
    "- Check the sidebar shows 'Mem Map' with a post-transform context bar",
    "- Each blob shows: label, fidelity, effective representation",
    "- Bottom shows estimated in-context tokens vs model window",
    "",
    "### Debug log",
    "- After each message, check `~/.opencode/context-maps/{sessionID}.debug.json`",
    "- Verify blob assignments, fidelity levels, and effective treatments",
    "",
    "### Blame lookup",
    "- Run `/blame src/auth/rate_limiter.ts:42`",
    "- Should show the auth session with commit-linked blobs",
    "",
    "### Tool exercise",
    "- Ask: 'call view_context to show the current map'",
    "- Ask: 'use session_lookup to find sessions about auth queue'",
    "- Ask: 'use set_fidelity to compress the oldest blob to placeholder'",
    "",
    "## Seeded sessions",
    ...Object.entries(sessions).map(([name, id]) => `- ${name}: ${id}`),
    "",
    "## Commit mapping",
    ...Object.entries(commits).map(([name, hash]) => `- ${name}: ${hash}`),
  ].join("\n");
  await fs.writeFile(path.join(repo, "TESTING.md"), `${guide}\n`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
