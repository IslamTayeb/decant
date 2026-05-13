import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import { ensureContextMapGitHook } from "../src/git";

const execFileAsync = promisify(execFile);

test("git hook install preserves existing hook and records commit mapping", async () => {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "context-map-hook-"),
  );
  const repo = path.join(tempRoot, "repo");
  const home = path.join(tempRoot, "home");
  const contextRoot = path.join(home, ".opencode", "context-maps");
  const originalHome = process.env.HOME;

  try {
    process.env.HOME = home;
    await fs.mkdir(repo, { recursive: true });
    await fs.mkdir(contextRoot, { recursive: true });

    await execFileAsync("git", ["init"], { cwd: repo });

    const gitDir = path.join(repo, ".git");
    const hooksDir = path.join(gitDir, "hooks");
    await fs.mkdir(hooksDir, { recursive: true });
    const postCommit = path.join(hooksDir, "post-commit");
    await fs.writeFile(postCommit, "#!/bin/sh\n# existing hook\n");

    await ensureContextMapGitHook({
      $: createShell(repo) as never,
      worktree: repo,
      directory: repo,
    });

    const hookText = await fs.readFile(postCommit, "utf8");
    assert.match(hookText, /existing hook/);
    assert.match(hookText, /mem-mould-context-map start/);

    await fs.writeFile(
      path.join(contextRoot, "sess_primary.json"),
      JSON.stringify(
        {
          version: 1,
          sessionID: "sess_primary",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          totalTokenEstimate: 1,
          lastActiveBlobID: "auth_debugging",
          settings: {
            placeholderIncludesKeyFacts: true,
            placeholderIncludesKeyFactsSource: "default",
            toolHistoryCleanup: true,
          },
          blobOrder: ["auth_debugging"],
          blobs: {
            auth_debugging: {
              id: "auth_debugging",
              label: "auth_debugging",
              summary: "Investigated auth failures.",
              placeholder: "Auth debugging",
              keyFacts: [],
              fidelity: "full",
              fidelitySource: "default",
              messageIDs: [],
              tokenEstimate: 1,
              createdAt: Date.now(),
              lastActiveAt: Date.now(),
              commitHashes: [],
            },
          },
          messages: {},
        },
        null,
        2,
      ),
    );

    await fs.writeFile(path.join(repo, "README.md"), "hello\n");
    await execFileAsync("git", ["add", "README.md"], { cwd: repo });
    await execFileAsync("git", ["commit", "-m", "initial"], {
      cwd: repo,
      env: gitCommitEnv({ HOME: home, OPENCODE_SESSION_ID: "sess_primary" }),
    });
    const defaultBranch = await gitCurrentBranch(repo);

    const firstHash = await gitHead(repo);
    const commitMapPath = path.join(contextRoot, "_commits.json");
    const firstCommitMap = JSON.parse(
      await fs.readFile(commitMapPath, "utf8"),
    ) as {
      entries: Record<
        string,
        { sessionID: string; activeBlobID?: string; activeBlobLabel?: string }
      >;
    };
    assert.equal(firstCommitMap.entries[firstHash]?.sessionID, "sess_primary");
    assert.equal(
      firstCommitMap.entries[firstHash]?.activeBlobID,
      "auth_debugging",
    );
    assert.equal(
      firstCommitMap.entries[firstHash]?.activeBlobLabel,
      "auth_debugging",
    );

    await execFileAsync("git", ["checkout", "-b", "feature/context-map"], {
      cwd: repo,
    });
    await fs.writeFile(
      path.join(contextRoot, "sess_feature.json"),
      JSON.stringify(
        {
          version: 1,
          sessionID: "sess_feature",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          totalTokenEstimate: 1,
          lastActiveBlobID: "docs_update",
          settings: {
            placeholderIncludesKeyFacts: true,
            placeholderIncludesKeyFactsSource: "default",
            toolHistoryCleanup: true,
          },
          blobOrder: ["docs_update"],
          blobs: {
            docs_update: {
              id: "docs_update",
              label: "docs_update",
              summary: "Updated docs.",
              placeholder: "Docs update",
              keyFacts: [],
              fidelity: "full",
              fidelitySource: "default",
              messageIDs: [],
              tokenEstimate: 1,
              createdAt: Date.now(),
              lastActiveAt: Date.now(),
              commitHashes: [],
            },
          },
          messages: {},
        },
        null,
        2,
      ),
    );
    await fs.writeFile(path.join(repo, "feature.txt"), "feature\n");
    await execFileAsync("git", ["add", "feature.txt"], { cwd: repo });
    await execFileAsync("git", ["commit", "-m", "feature"], {
      cwd: repo,
      env: gitCommitEnv({ HOME: home, OPENCODE_SESSION_ID: "sess_feature" }),
    });
    const featureHash = await gitHead(repo);

    await execFileAsync("git", ["checkout", defaultBranch], { cwd: repo });
    await execFileAsync(
      "git",
      ["merge", "--no-ff", "feature/context-map", "-m", "merge feature"],
      {
        cwd: repo,
        env: gitCommitEnv({ HOME: home, OPENCODE_SESSION_ID: "sess_feature" }),
      },
    );

    const mergeHash = await gitHead(repo);
    const finalCommitMap = JSON.parse(
      await fs.readFile(commitMapPath, "utf8"),
    ) as {
      entries: Record<string, { sessionID: string; activeBlobID?: string }>;
    };
    assert.equal(
      finalCommitMap.entries[featureHash]?.sessionID,
      "sess_feature",
    );
    assert.equal(finalCommitMap.entries[mergeHash]?.sessionID, "sess_feature");
    assert.equal(
      finalCommitMap.entries[mergeHash]?.activeBlobID,
      "docs_update",
    );
  } finally {
    process.env.HOME = originalHome;
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

function gitCommitEnv(extra: Record<string, string>) {
  return {
    ...process.env,
    GIT_AUTHOR_NAME: "Context Map Test",
    GIT_AUTHOR_EMAIL: "context-map@example.com",
    GIT_COMMITTER_NAME: "Context Map Test",
    GIT_COMMITTER_EMAIL: "context-map@example.com",
    ...extra,
  };
}

async function gitHead(cwd: string) {
  const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd });
  return stdout.trim();
}

async function gitCurrentBranch(cwd: string) {
  const { stdout } = await execFileAsync("git", ["branch", "--show-current"], {
    cwd,
  });
  return stdout.trim();
}

function createShell(initialCwd: string) {
  const build = (cwd: string) => {
    const shell = ((
      strings: TemplateStringsArray,
      ...expressions: unknown[]
    ) => {
      const command = strings.reduce(
        (text, part, index) =>
          text +
          part +
          (index < expressions.length ? String(expressions[index]) : ""),
        "",
      );
      return {
        quiet() {
          return {
            async text() {
              try {
                const { stdout } = await execFileAsync(
                  "/bin/sh",
                  ["-lc", command],
                  { cwd },
                );
                return stdout;
              } catch (error) {
                return (error as { stdout?: string }).stdout ?? "";
              }
            },
          };
        },
      };
    }) as {
      cwd(newCwd: string): ReturnType<typeof build>;
      nothrow(): ReturnType<typeof build>;
    } & ((
      strings: TemplateStringsArray,
      ...expressions: unknown[]
    ) => { quiet(): { text(): Promise<string> } });

    shell.cwd = (newCwd: string) => build(newCwd);
    shell.nothrow = () => shell;
    return shell;
  };

  return build(initialCwd);
}
