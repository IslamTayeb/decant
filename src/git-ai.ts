import crypto from "node:crypto";

export const GIT_AI_DECANT_SCHEMA_VERSION = 1 as const;

export type GitAiAgentID = {
  tool?: string;
  id?: string;
  model?: string;
  [key: string]: unknown;
};

export type GitAiPromptRecord = {
  agent_id?: GitAiAgentID;
  human_author?: string;
  messages?: unknown[];
  messages_url?: string;
  summary?: string;
  total_additions?: number;
  total_deletions?: number;
  accepted_lines?: number;
  overriden_lines?: number;
  [key: string]: unknown;
};

export type GitAiMetadata = {
  schema_version?: string;
  git_ai_version?: string;
  base_commit_sha?: string;
  prompts?: Record<string, GitAiPromptRecord>;
  [key: string]: unknown;
};

export type GitAiLineRange = {
  start: number;
  end: number;
};

export type GitAiAttestationEntry = {
  file: string;
  promptID: string;
  lineSpec: string;
  ranges: GitAiLineRange[];
};

export type GitAiAuthorshipLog = {
  entries: GitAiAttestationEntry[];
  metadata: GitAiMetadata;
};

export type GitAiLineAttribution = {
  file: string;
  line: number;
  prompt_id: string;
  line_spec: string;
  prompt?: GitAiPromptRecord;
};

export function parseGitAiAuthorshipLog(raw: string): GitAiAuthorshipLog {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const separatorIndex = lines.findIndex((line) => line.trim() === "---");
  if (separatorIndex === -1) {
    throw new Error("Git AI authorship log is missing metadata separator.");
  }

  const attestationLines = lines.slice(0, separatorIndex);
  const metadataText = lines.slice(separatorIndex + 1).join("\n").trim();
  const metadata = metadataText
    ? (JSON.parse(metadataText) as GitAiMetadata)
    : {};

  return {
    entries: parseAttestationSection(attestationLines),
    metadata,
  };
}

export function findGitAiLineAttributions(input: {
  log: GitAiAuthorshipLog;
  file: string;
  line: number;
}): GitAiLineAttribution[] {
  const wantedFile = normalizeGitAiPath(input.file);
  return input.log.entries
    .filter(
      (entry) =>
        normalizeGitAiPath(entry.file) === wantedFile &&
        entry.ranges.some((range) =>
          lineRangeContains(range, input.line),
        ),
    )
    .map((entry) => ({
      file: entry.file,
      line: input.line,
      prompt_id: entry.promptID,
      line_spec: entry.lineSpec,
      prompt: input.log.metadata.prompts?.[entry.promptID],
    }));
}

export function gitAiPromptTranscriptHash(
  prompt: GitAiPromptRecord | undefined,
) {
  if (!prompt) return undefined;
  return crypto
    .createHash("sha256")
    .update(
      stableStringify({
        agent_id: prompt.agent_id,
        messages: prompt.messages,
        messages_url: prompt.messages_url,
        summary: prompt.summary,
      }),
    )
    .digest("hex");
}

export function gitAiPromptDecantKey(input: {
  promptID: string;
  transcriptHash?: string;
}) {
  return `${input.promptID}:${input.transcriptHash ?? "no-transcript"}`;
}

function parseAttestationSection(lines: string[]) {
  const entries: GitAiAttestationEntry[] = [];
  let currentFile: string | undefined;

  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.startsWith("  ")) {
      if (!currentFile) {
        throw new Error("Git AI attestation entry appeared before a file path.");
      }
      const match = line.match(/^ {2}([0-9a-fA-F]{7,64})\s+(\S+)$/);
      if (!match) {
        throw new Error(`Invalid Git AI attestation entry: ${line}`);
      }
      const [, promptID, lineSpec] = match;
      entries.push({
        file: currentFile,
        promptID,
        lineSpec,
        ranges: parseLineSpec(lineSpec),
      });
      continue;
    }

    currentFile = parseFilePathLine(line);
  }

  return entries;
}

function parseFilePathLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('"')) return trimmed;
  try {
    return JSON.parse(trimmed) as string;
  } catch {
    return trimmed.slice(1, trimmed.endsWith('"') ? -1 : undefined);
  }
}

function parseLineSpec(lineSpec: string) {
  return lineSpec.split(",").map((part) => {
    const [startText, endText] = part.split("-");
    const start = Number(startText);
    const end = endText ? Number(endText) : start;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1) {
      throw new Error(`Invalid Git AI line range: ${part}`);
    }
    if (end < start) {
      throw new Error(`Invalid Git AI descending line range: ${part}`);
    }
    return { start, end };
  });
}

function lineRangeContains(range: GitAiLineRange, line: number) {
  return line >= range.start && line <= range.end;
}

function normalizeGitAiPath(file: string) {
  return file.replace(/^\.\//, "").replace(/^\/+/, "");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
