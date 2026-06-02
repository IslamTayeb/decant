import fs from "node:fs/promises";
import path from "node:path";

type Manifest = {
  generatedAt: string;
  sourceRoot: string;
  artifactRoot: string;
  copiedFiles: number;
  skippedFiles: Array<{ path: string; reason: string }>;
  runs: Array<{
    benchmark: string;
    run: string;
    source: string;
    destination: string;
    copiedFiles: number;
  }>;
};

type ExportOptions = {
  benchmark?: string;
  run?: string;
};

const repoRoot = path.resolve(process.cwd());
const artifactRoot = path.join(repoRoot, "artifacts", "benchmark-runs");
const benchmarkRuns = [
  path.join("benchmarks", "code-recall", "runs"),
  path.join("benchmarks", "context-canaries", "runs"),
  path.join("benchmarks", "memory-infra", "runs"),
  path.join("benchmarks", "provenance-qa", "runs"),
  path.join("benchmarks", "reversible-memory", "runs"),
  path.join("benchmarks", "swebench-context", "runs"),
];

const publishedRuns = new Map([
  [
    "code-recall",
    new Set([
      "gpt55-ablation-combined",
      "gpt55-default-compaction-blog-20260530",
      "gpt55-secondary-missing-20260515",
    ]),
  ],
  [
    "context-canaries",
    new Set(["bedrock-opus46-all-hypotheses", "gpt55-all-hypotheses"]),
  ],
  [
    "memory-infra",
    new Set([
      "gpt55fast-mixed-t96-r4-c24-default",
      "gpt55fast-mixed-t96-r4-c24-rgb-current",
      "gpt55fast-mixed-t96-r4-c24-decant-numeric-fix",
      "gpt55fast-mixed-t96-r4-c48-rgb",
      "gpt55fast-mixed-t96-r4-c48-decant",
      "gpt55fast-mixed-t96-r4-c48-rgb-retry",
      "gpt55fast-mixed-t96-r4-c48-decant-retry",
      "gpt55fast-mixed-t96-r4-c96-default",
      "gpt55fast-mixed-t96-r4-c96-rgb",
      "gpt55fast-mixed-t96-r4-c96-decant",
      "gpt55fast-mixed-t96-r4-c96-rgb-rep2",
      "gpt55fast-mixed-t96-r4-c96-decant-rep2",
      "gpt55fast-frontier-t96-r16-rgb-budget2000",
      "gpt55fast-frontier-t96-r16-rgb-unbounded",
      "gpt55fast-frontier-t96-r16-decant",
      "gpt55fast-mixed-t48-r4-c24-decoy1-decant-penalty",
      "gpt55fast-irregular-t24-r4-c12-default-opencode-continuation",
      "gpt55fast-irregular-t24-r4-c12-rgb-longtimeout",
      "gpt55fast-irregular-t24-r4-c12-decant",
      "gpt55fast-threshold-irregular-t8-r4-c48-all",
      "gpt55fast-cross-threshold-t8-r4-c48-rep1",
      "gpt55fast-cross-threshold-t8-r4-c48-rep2",
      "gpt55fast-threshold-irregular-t8-r4-c96-main",
      "gpt55fast-irregular-frontier-t24-r8-c24-defaults",
      "gpt55fast-irregular-frontier-t24-r8-c24-rgb2500-decant",
      "gpt55fast-irregular-frontier-t24-r8-c24-rgb-unbounded",
    ]),
  ],
  [
    "provenance-qa",
    new Set([
      "default-compaction-gpt55-matrix",
      "gpt55-blog-full-matrix-final",
      "gpt55-parent-gpt54mini-child-subagents-fixed",
      "gpt55-rlm-hybrid",
    ]),
  ],
  ["reversible-memory", new Set(["gpt55-reversible-memory-final3-20260525"])],
  [
    "swebench-context",
    new Set([
      "gpt55-cache-stable-boundary-final",
      "gpt55-cache-stable-hard-primary",
      "gpt55-secondary-missing-20260515",
    ]),
  ],
]);

const pathNameMap = new Map([
  [
    "scripts/benchmark-context-canaries.ts",
    "benchmarks/context-canaries/run.ts",
  ],
  [
    "scripts/benchmark-provenance-blog.ts",
    "benchmarks/provenance-qa/blog-run.ts",
  ],
  ["scripts/benchmark-provenance-qa.ts", "benchmarks/provenance-qa/run.ts"],
  [
    "scripts/benchmark-swebench-context.ts",
    "benchmarks/swebench-context/run.ts",
  ],
  ["scripts/evaluate-compaction.ts", "tools/validation/evaluate-compaction.ts"],
  ["scripts/export-benchmark-artifacts.ts", "tools/artifacts/export.ts"],
  [
    "scripts/generate-test-fixtures.ts",
    "tools/fixtures/generate-test-fixtures.ts",
  ],
  ["scripts/inspect-context.ts", "tools/inspect-context.ts"],
  ["scripts/setup-test-env.ts", "tools/fixtures/setup-test-env.ts"],
  [
    "scripts/validate-long-session.ts",
    "tools/validation/validate-long-session.ts",
  ],
  ["scripts/validate-sandbox.ts", "tools/validation/validate-sandbox.ts"],
]);

const skippedDirectoryNames = new Set([
  ".git",
  "node_modules",
  "opencode-root",
  "worktree",
]);

const skippedFileNames = new Set([
  "opencode.sqlite",
  "opencode.sqlite-shm",
  "opencode.sqlite-wal",
]);

const maxPortableFileBytes = 5 * 1024 * 1024;

const textExtensions = new Set([
  ".csv",
  ".diff",
  ".json",
  ".jsonl",
  ".md",
  ".svg",
  ".txt",
]);

const redactedJsonKeys = new Set(["reasoningEncryptedContent"]);

async function main() {
  const options = parseOptions();
  const filtered = Boolean(options.benchmark || options.run);
  const manifest: Manifest = {
    generatedAt: new Date().toISOString(),
    sourceRoot: ".",
    artifactRoot: path.relative(repoRoot, artifactRoot),
    copiedFiles: 0,
    skippedFiles: [],
    runs: [],
  };

  if (!filtered) await fs.rm(artifactRoot, { recursive: true, force: true });
  await fs.mkdir(artifactRoot, { recursive: true });

  for (const relativeRunsDir of benchmarkRuns) {
    const runsDir = path.join(repoRoot, relativeRunsDir);
    const benchmark = path.basename(path.dirname(runsDir));
    if (options.benchmark && benchmark !== options.benchmark) continue;
    const publishableRuns = publishedRuns.get(benchmark) ?? new Set<string>();
    const runNames = (await directoryNames(runsDir))
      .filter((run) => publishableRuns.has(run))
      .filter((run) => !options.run || run === options.run);
    for (const run of runNames) {
      const source = path.join(runsDir, run);
      const destination = path.join(
        artifactRoot,
        benchmark,
        normalizePathSegment(run),
      );
      const before = manifest.copiedFiles;
      await fs.rm(destination, { recursive: true, force: true });
      await copyPortableArtifacts(source, destination, source, manifest);
      const copiedFiles = manifest.copiedFiles - before;
      if (copiedFiles === 0) continue;
      manifest.runs.push({
        benchmark,
        run,
        source: path.relative(repoRoot, source),
        destination: path.relative(repoRoot, destination),
        copiedFiles,
      });
    }
  }

  await fs.writeFile(
    path.join(artifactRoot, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log(
    `Exported ${manifest.copiedFiles} files from ${manifest.runs.length} runs to ${path.relative(repoRoot, artifactRoot)}`,
  );
  if (manifest.skippedFiles.length > 0) {
    console.log(
      `Skipped ${manifest.skippedFiles.length} raw or oversized files`,
    );
  }
}

function parseOptions(): ExportOptions {
  const options: ExportOptions = {};
  for (let index = 2; index < process.argv.length; index++) {
    const arg = process.argv[index];
    if (arg === "--benchmark") {
      options.benchmark = requireValue(arg, process.argv[++index]);
      continue;
    }
    if (arg.startsWith("--benchmark=")) {
      options.benchmark = arg.slice("--benchmark=".length);
      continue;
    }
    if (arg === "--run") {
      options.run = requireValue(arg, process.argv[++index]);
      continue;
    }
    if (arg.startsWith("--run=")) {
      options.run = arg.slice("--run=".length);
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  if (options.run && !options.benchmark) {
    throw new Error("--run requires --benchmark");
  }
  return options;
}

function requireValue(flag: string, value: string | undefined) {
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

async function directoryNames(dir: string) {
  const entries = await fs
    .readdir(dir, { withFileTypes: true })
    .catch(() => []);
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function copyPortableArtifacts(
  source: string,
  destination: string,
  runRoot: string,
  manifest: Manifest,
) {
  const entries = await fs
    .readdir(source, { withFileTypes: true })
    .catch(() => []);
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(
      destination,
      normalizePathSegment(entry.name),
    );
    if (entry.isDirectory()) {
      if (skippedDirectoryNames.has(entry.name)) {
        if (entry.name === "worktree") {
          await copyPortableWorktreeMemory(
            sourcePath,
            destinationPath,
            runRoot,
            manifest,
          );
        }
        skip(manifest, runRoot, sourcePath, "raw runtime directory");
        continue;
      }
      await copyPortableArtifacts(
        sourcePath,
        destinationPath,
        runRoot,
        manifest,
      );
      continue;
    }
    if (!entry.isFile()) continue;
    if (skippedFileNames.has(entry.name)) {
      skip(manifest, runRoot, sourcePath, "raw OpenCode database");
      continue;
    }
    const stat = await fs.stat(sourcePath);
    if (stat.size > maxPortableFileBytes) {
      skip(
        manifest,
        runRoot,
        sourcePath,
        "oversized portable artifact candidate",
      );
      continue;
    }
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    if (shouldNormalizeText(sourcePath)) {
      const content = await fs.readFile(sourcePath, "utf8");
      await fs.writeFile(
        destinationPath,
        portableTextContent(sourcePath, content),
      );
    } else {
      await fs.copyFile(sourcePath, destinationPath);
    }
    manifest.copiedFiles++;
  }
}

async function copyPortableWorktreeMemory(
  worktreePath: string,
  destinationPath: string,
  runRoot: string,
  manifest: Manifest,
) {
  const memoryPath = path.join(worktreePath, "recall");
  const stat = await fs.stat(memoryPath).catch(() => undefined);
  if (!stat?.isDirectory()) return;
  await copyPortableArtifacts(
    memoryPath,
    path.join(destinationPath, "recall"),
    runRoot,
    manifest,
  );
}

function skip(
  manifest: Manifest,
  runRoot: string,
  filePath: string,
  reason: string,
) {
  manifest.skippedFiles.push({
    path: normalizeRelativePath(path.relative(runRoot, filePath)),
    reason,
  });
}

function shouldNormalizeText(filePath: string) {
  return textExtensions.has(path.extname(filePath));
}

function portableTextContent(filePath: string, content: string) {
  const ext = path.extname(filePath);
  if (ext === ".json") {
    try {
      return `${normalizeReferences(JSON.stringify(redactJson(JSON.parse(content)), null, 2))}\n`;
    } catch {
      return normalizeReferences(content);
    }
  }
  if (ext === ".jsonl") {
    const lines = content.split("\n");
    const normalized = lines.map((line) => {
      if (line.trim() === "") return line;
      try {
        return normalizeReferences(
          JSON.stringify(redactJson(JSON.parse(line))),
        );
      } catch {
        return normalizeReferences(line);
      }
    });
    return normalized.join("\n");
  }
  return normalizeReferences(content);
}

function redactJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => redactJson(item));
  if (!value || typeof value !== "object") return value;
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (redactedJsonKeys.has(key)) continue;
    output[key] = redactJson(item);
  }
  return output;
}

function normalizePathSegment(segment: string) {
  return normalizeReferences(segment);
}

function normalizeRelativePath(relativePath: string) {
  return relativePath
    .split(path.sep)
    .map((segment) => normalizePathSegment(segment))
    .join("/");
}

function normalizeReferences(value: string) {
  let next = value.replaceAll(repoRoot, ".");
  for (const [oldName, newName] of pathNameMap) {
    next = next.replaceAll(oldName, newName);
  }
  return next;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
