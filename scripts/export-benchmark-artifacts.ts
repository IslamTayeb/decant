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

const repoRoot = path.resolve(process.cwd());
const artifactRoot = path.join(repoRoot, "artifacts", "benchmark-runs");
const benchmarkRuns = [
  path.join("benchmarks", "context-canaries", "runs"),
  path.join("benchmarks", "provenance-qa", "runs"),
  path.join("benchmarks", "swebench-context", "runs"),
];

const conditionNameMap = new Map([
  ["searchable-transcript", "rlm-transcript-search"],
  ["subagent-searchable-transcript", "subagent-rlm-transcript-search"],
  ["memmould-rlm-hybrid", "memmould-guided-rlm"],
  ["subagent-memmould-rlm-hybrid", "subagent-memmould-guided-rlm"],
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
  const manifest: Manifest = {
    generatedAt: new Date().toISOString(),
    sourceRoot: ".",
    artifactRoot: path.relative(repoRoot, artifactRoot),
    copiedFiles: 0,
    skippedFiles: [],
    runs: [],
  };

  await fs.rm(artifactRoot, { recursive: true, force: true });
  await fs.mkdir(artifactRoot, { recursive: true });

  for (const relativeRunsDir of benchmarkRuns) {
    const runsDir = path.join(repoRoot, relativeRunsDir);
    const benchmark = path.basename(path.dirname(runsDir));
    const runNames = await directoryNames(runsDir);
    for (const run of runNames) {
      const source = path.join(runsDir, run);
      const destination = path.join(
        artifactRoot,
        benchmark,
        normalizePathSegment(run),
      );
      const before = manifest.copiedFiles;
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
      return `${normalizeConditionNames(JSON.stringify(redactJson(JSON.parse(content)), null, 2))}\n`;
    } catch {
      return normalizeConditionNames(content);
    }
  }
  if (ext === ".jsonl") {
    const lines = content.split("\n");
    const normalized = lines.map((line) => {
      if (line.trim() === "") return line;
      try {
        return normalizeConditionNames(
          JSON.stringify(redactJson(JSON.parse(line))),
        );
      } catch {
        return normalizeConditionNames(line);
      }
    });
    return normalized.join("\n");
  }
  return normalizeConditionNames(content);
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
  return conditionNameMap.get(segment) ?? normalizeConditionNames(segment);
}

function normalizeRelativePath(relativePath: string) {
  return relativePath
    .split(path.sep)
    .map((segment) => normalizePathSegment(segment))
    .join("/");
}

function normalizeConditionNames(value: string) {
  let next = value;
  for (const [oldName, newName] of conditionNameMap) {
    next = next.replaceAll(oldName, newName);
  }
  return next;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
