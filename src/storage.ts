import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type {
  CommitMapEntry,
  CommitMapFile,
  ContextMapCompactionState,
  ContextMapFile,
  ContextPreview,
  GitAiDecantIndexEntry,
  GitAiDecantIndexFile,
  MessageEntry,
  PendingRetroactiveMessage,
  TopicEntry,
} from "./types";
import { computeEffectiveTreatment } from "./core";

const MAP_VERSION = 1 as const;

function homeDir() {
  return process.env.HOME || os.homedir();
}

export function contextMapRoot() {
  return path.join(homeDir(), ".opencode", "context-maps");
}

export function sessionMapPath(sessionID: string) {
  return path.join(contextMapRoot(), `${sessionID}.json`);
}

export function commitMapPath() {
  return path.join(contextMapRoot(), "_commits.json");
}

export function gitAiDecantIndexPath() {
  return path.join(contextMapRoot(), "_git_ai_decants.json");
}

export function compactionArchivePath(sessionID: string, compactedAt: number) {
  return path.join(
    contextMapRoot(),
    "archive",
    sessionID,
    `${compactedAt}.json`,
  );
}

export async function ensureContextMapRoot() {
  await fs.mkdir(contextMapRoot(), { recursive: true });
}

export function createEmptyContextMap(input: {
  sessionID: string;
  directory?: string;
  worktree?: string;
  now?: number;
}): ContextMapFile {
  const now = input.now ?? Date.now();
  return {
    version: MAP_VERSION,
    sessionID: input.sessionID,
    directory: input.directory,
    worktree: input.worktree,
    createdAt: now,
    updatedAt: now,
    totalTokenEstimate: 0,
    settings: {
      placeholderIncludesKeyFacts: true,
      placeholderIncludesKeyFactsSource: "default",
      toolHistoryCleanup: true,
      stablePlaceholders: false,
      stablePlaceholdersSource: "default",
      stableAnchors: false,
      stableAnchorsSource: "default",
    },
    topicOrder: [],
    topics: {},
    messages: {},
    pendingRetroactive: {},
  };
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function stringArrayValue(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
}

// Legacy blob->topic migration for local context maps written before the
// rename. New writes only use topic* fields; these fallbacks are read-only.
function normalizeLegacyMessageEntry(value: unknown): MessageEntry {
  const record = recordValue(value) ?? {};
  const normalized: Record<string, unknown> = {
    ...record,
    topicID: stringValue(record.topicID) ?? stringValue(record.blobID),
  };
  delete normalized.blobID;
  return normalized as MessageEntry;
}

function normalizeLegacyTopicEntry(value: unknown): TopicEntry {
  const record = recordValue(value) ?? {};
  const normalized: Record<string, unknown> = {
    ...record,
    fidelity: record.fidelity === "drop" ? "hidden" : record.fidelity,
  };
  return normalized as TopicEntry;
}

function normalizeLegacyPendingRetroactiveMessage(
  value: unknown,
): PendingRetroactiveMessage {
  const record = recordValue(value) ?? {};
  const normalized: Record<string, unknown> = {
    ...record,
    suggestedTopicID:
      stringValue(record.suggestedTopicID) ??
      stringValue(record.suggestedBlobID),
    suggestedTopicLabel:
      stringValue(record.suggestedTopicLabel) ??
      stringValue(record.suggestedBlobLabel),
  };
  delete normalized.suggestedBlobID;
  delete normalized.suggestedBlobLabel;
  return normalized as PendingRetroactiveMessage;
}

function normalizeLegacyCompactionState(
  value: unknown,
): ContextMapCompactionState | undefined {
  const record = recordValue(value);
  if (!record) return undefined;
  const normalized: Record<string, unknown> = {
    ...record,
    summaryTopicID:
      stringValue(record.summaryTopicID) ?? stringValue(record.summaryBlobID),
  };
  delete normalized.summaryBlobID;
  return normalized as ContextMapCompactionState;
}

function normalizeLegacyCommitMapEntry(value: unknown): CommitMapEntry {
  const record = recordValue(value) ?? {};
  const normalized: Record<string, unknown> = {
    ...record,
    activeTopicID:
      stringValue(record.activeTopicID) ?? stringValue(record.activeBlobID),
    activeTopicLabel:
      stringValue(record.activeTopicLabel) ??
      stringValue(record.activeBlobLabel),
    activeTopicIDs:
      stringArrayValue(record.activeTopicIDs) ??
      stringArrayValue(record.activeBlobIDs),
    activeTopicLabels:
      stringArrayValue(record.activeTopicLabels) ??
      stringArrayValue(record.activeBlobLabels),
  };
  delete normalized.activeBlobID;
  delete normalized.activeBlobLabel;
  delete normalized.activeBlobIDs;
  delete normalized.activeBlobLabels;
  return normalized as CommitMapEntry;
}

export async function readContextMap(input: {
  sessionID: string;
  directory?: string;
  worktree?: string;
}): Promise<ContextMapFile> {
  try {
    const raw = await fs.readFile(sessionMapPath(input.sessionID), "utf8");
    const parsed = JSON.parse(raw) as Partial<ContextMapFile>;
    const parsedRecord = parsed as Record<string, unknown>;
    const fallback = createEmptyContextMap(input);
    const topicOrder = Array.isArray(parsed.topicOrder)
      ? parsed.topicOrder
      : (stringArrayValue(parsedRecord.blobOrder) ?? []);
    const rawTopics =
      recordValue(parsed.topics) ?? recordValue(parsedRecord.blobs) ?? {};
    const topics = Object.fromEntries(
      Object.entries(rawTopics).map(([id, topic]) => [
        id,
        normalizeLegacyTopicEntry(topic),
      ]),
    ) as Record<string, TopicEntry>;
    const rawMessages = recordValue(parsed.messages) ?? {};
    const messages = Object.fromEntries(
      Object.entries(rawMessages).map(([id, message]) => [
        id,
        normalizeLegacyMessageEntry(message),
      ]),
    ) as Record<string, MessageEntry>;
    const rawPending = recordValue(parsed.pendingRetroactive) ?? {};
    const pendingRetroactive = Object.fromEntries(
      Object.entries(rawPending).map(([id, message]) => [
        id,
        normalizeLegacyPendingRetroactiveMessage(message),
      ]),
    ) as Record<string, PendingRetroactiveMessage>;
    const normalized: ContextMapFile = {
      ...fallback,
      ...parsed,
      settings: {
        ...fallback.settings,
        ...(parsed.settings ?? {}),
      },
      lastActiveTopicID:
        parsed.lastActiveTopicID ?? stringValue(parsedRecord.lastActiveBlobID),
      topicOrder,
      topics,
      messages,
      pendingRetroactive,
      compaction: normalizeLegacyCompactionState(parsed.compaction),
    };
    delete (normalized as unknown as Record<string, unknown>).blobOrder;
    delete (normalized as unknown as Record<string, unknown>).blobs;
    delete (normalized as unknown as Record<string, unknown>).lastActiveBlobID;
    return normalized;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return createEmptyContextMap(input);
  }
}

export async function writeContextMap(map: ContextMapFile) {
  await ensureContextMapRoot();
  await writeJsonAtomic(sessionMapPath(map.sessionID), map);
}

export async function archiveContextMapForCompaction(input: {
  map: ContextMapFile;
  compactedAt: number;
  summaryMessageID: string;
  summaryText: string;
  includeMessageID?: string;
}) {
  await ensureContextMapRoot();
  const archivePath = compactionArchivePath(
    input.map.sessionID,
    input.compactedAt,
  );
  await fs.mkdir(path.dirname(archivePath), { recursive: true });
  await writeJsonAtomic(archivePath, {
    version: 1,
    reason: "compaction",
    archivedAt: Date.now(),
    sessionID: input.map.sessionID,
    compaction: {
      compactedAt: input.compactedAt,
      summaryMessageID: input.summaryMessageID,
      summaryText: input.summaryText,
      includeMessageID: input.includeMessageID,
    },
    map: input.map,
  });
  return archivePath;
}

export async function readCommitMap(): Promise<CommitMapFile> {
  try {
    const raw = await fs.readFile(commitMapPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<CommitMapFile>;
    return {
      version: MAP_VERSION,
      updatedAt:
        typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
      entries: Object.fromEntries(
        Object.entries(recordValue(parsed.entries) ?? {}).map(
          ([hash, entry]) => [hash, normalizeLegacyCommitMapEntry(entry)],
        ),
      ),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return {
      version: MAP_VERSION,
      updatedAt: Date.now(),
      entries: {},
    };
  }
}

export async function writeCommitMap(file: CommitMapFile) {
  await ensureContextMapRoot();
  await writeJsonAtomic(commitMapPath(), file);
}

export async function recordCommitMapEntry(entry: CommitMapEntry) {
  const file = await readCommitMap();
  file.entries[entry.commitHash] = entry;
  file.updatedAt = Date.now();
  await writeCommitMap(file);
}

export async function readGitAiDecantIndex(): Promise<GitAiDecantIndexFile> {
  try {
    const raw = await fs.readFile(gitAiDecantIndexPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<GitAiDecantIndexFile>;
    return {
      version: MAP_VERSION,
      updatedAt:
        typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
      entries:
        parsed.entries && typeof parsed.entries === "object"
          ? parsed.entries
          : {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return {
      version: MAP_VERSION,
      updatedAt: Date.now(),
      entries: {},
    };
  }
}

export async function writeGitAiDecantIndex(file: GitAiDecantIndexFile) {
  await ensureContextMapRoot();
  await writeJsonAtomic(gitAiDecantIndexPath(), file);
}

export async function recordGitAiDecantIndexEntry(
  entry: GitAiDecantIndexEntry,
) {
  const file = await readGitAiDecantIndex();
  file.entries[entry.key] = entry;
  file.updatedAt = Date.now();
  await writeGitAiDecantIndex(file);
}

export async function removeContextMap(sessionID: string) {
  await fs.rm(sessionMapPath(sessionID), { force: true });
}

async function writeJsonAtomic(filePath: string, value: unknown) {
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmpPath, JSON.stringify(value, null, 2));
  await fs.rename(tmpPath, filePath);
}

export function debugLogPath(sessionID: string) {
  return path.join(contextMapRoot(), `${sessionID}.debug.json`);
}

export async function writeDebugLog(
  map: ContextMapFile,
  preview: ContextPreview,
) {
  await ensureContextMapRoot();
  const logPath = debugLogPath(map.sessionID);

  const messages = Object.values(map.messages)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((m) => {
      const topic = m.topicID ? map.topics[m.topicID] : undefined;
      return {
        id: m.id,
        role: m.role,
        topic_id: m.topicID,
        topic_label: topic?.label,
        topic_fidelity: topic?.fidelity,
        summary: m.summary,
        hidden: m.hidden,
        hidden_source: m.hiddenSource,
        fidelity_override: m.fidelityOverride,
        fidelity_source: m.fidelitySource,
        token_estimate: m.tokenEstimate,
        source: m.source,
        effective_treatment: computeEffectiveTreatment(m, topic),
      };
    });

  const log = {
    timestamp: new Date().toISOString(),
    session_id: map.sessionID,
    topics: preview.topics.map((b) => ({
      id: b.id,
      label: b.label,
      fidelity: b.fidelity,
      raw_tokens: b.rawTokens,
      effective_tokens: b.effectiveTokens,
      message_count: b.messageCount,
      effective_label: b.effectiveLabel,
    })),
    messages,
    totals: {
      raw_tokens: preview.totalRaw,
      effective_tokens: preview.totalEffective,
    },
  };

  await writeJsonAtomic(logPath, log);
}

export function traceLogPath(sessionID: string) {
  return path.join(contextMapRoot(), `${sessionID}.trace.jsonl`);
}

export async function appendTrace(
  sessionID: string,
  event: string,
  data: Record<string, unknown>,
) {
  try {
    await ensureContextMapRoot();
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      event,
      sessionID,
      ...data,
    });
    await fs.appendFile(traceLogPath(sessionID), `${line}\n`);
  } catch {}
}
