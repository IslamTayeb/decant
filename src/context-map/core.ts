import type { Part } from "@opencode-ai/sdk";

import {
  annotationEnvelopeSchema,
  annotationSchema,
  blobFidelitySchema,
  type AnnotationEnvelope,
  type AnnotationPayload,
  type BlobEntry,
  type BlobFidelity,
  type CommitMapEntry,
  type ContextMapFile,
  type ContextPreview,
  type ContextPreviewBlob,
  type ControlSource,
  type HistoricalSessionOverview,
  type MessageEntry,
  type MessageLike,
  type MessageFidelity,
  type PendingRetroactiveMessage,
  type RetroactiveAnnotationItem,
  type SessionLike,
} from "./types";

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "because",
  "before",
  "being",
  "between",
  "could",
  "does",
  "each",
  "from",
  "have",
  "into",
  "just",
  "more",
  "now",
  "only",
  "over",
  "same",
  "should",
  "some",
  "switch",
  "than",
  "that",
  "their",
  "there",
  "these",
  "this",
  "those",
  "through",
  "topic",
  "under",
  "user",
  "request",
  "assistant",
  "response",
  "return",
  "what",
  "when",
  "where",
  "which",
  "with",
  "would",
  "your",
]);

export function slugifyBlobLabel(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "working_set";
}

export function estimateTokensFromText(text: string) {
  return Math.max(1, Math.ceil(text.trim().length / 4));
}

export function estimateTokensFromParts(parts: MessageLike["parts"]) {
  let total = 0;
  for (const part of parts) {
    if (part.type === "text" || part.type === "reasoning")
      total += estimateTokensFromText(part.text ?? "");
    if (part.type === "file")
      total += estimateTokensFromText(part.filename ?? part.url ?? "file");
    if (part.type === "tool") {
      total += estimateTokensFromText(part.tool ?? "tool");
      total += estimateTokensFromText(part.state?.title ?? "");
      total += estimateTokensFromText(part.state?.output ?? "");
    }
  }
  return total || 1;
}

export function parseAnnotationBlock(text: string) {
  const match = text.match(/<annotation>\s*([\s\S]*?)\s*<\/annotation>/i);
  if (!match)
    return {
      cleanText: text.trim(),
      annotation: undefined,
      error: "missing" as const,
    };
  const cleanText = text.replace(match[0], "").trim();
  try {
    const raw = JSON.parse(match[1]!);
    const parsed =
      raw && typeof raw === "object" && "current" in raw
        ? annotationEnvelopeSchema.parse(raw)
        : {
            current: annotationSchema.parse(raw),
            retroactive: [],
          };
    return { cleanText, annotation: parsed };
  } catch (error) {
    return {
      cleanText,
      annotation: undefined,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function mergeUniqueStrings(items: Iterable<string>) {
  const output: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const value = item.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    output.push(value);
  }
  return output;
}

export function getMessageCreatedAt(message: MessageLike) {
  return (
    message.info.metadata?.time?.created ??
    message.info.time?.created ??
    Date.now()
  );
}

export function extractToolNames(parts: MessageLike["parts"]) {
  return mergeUniqueStrings(
    parts
      .filter((part) => part.type === "tool")
      .map((part) => part.tool ?? "tool"),
  );
}

export function deriveSummaryFromMessage(message: MessageLike) {
  const textParts = message.parts
    .filter((part) => part.type === "text" && part.text)
    .map((part) => (part.text ?? "").trim())
    .filter(Boolean);
  if (textParts.length > 0) {
    const text = collapseWhitespace(textParts.join(" "));
    const prefix =
      message.info.role === "user" ? "User request: " : "Assistant response: ";
    return trimText(prefix + text, 240);
  }

  const toolTitles = message.parts
    .filter((part) => part.type === "tool")
    .map((part) => part.state?.title ?? part.tool ?? "tool")
    .filter(Boolean);
  if (toolTitles.length > 0) {
    return trimText(`Tool activity: ${toolTitles.join(", ")}`, 240);
  }

  const files = message.parts
    .filter((part) => part.type === "file")
    .map((part) => part.filename ?? part.url ?? "file")
    .filter(Boolean);
  if (files.length > 0) {
    return trimText(`Attached files: ${files.join(", ")}`, 240);
  }

  return message.info.role === "user"
    ? "User request without text content"
    : "Assistant step without text content";
}

export function createMessageEntry(input: {
  id: string;
  role: "user" | "assistant";
  blobID?: string;
  summary: string;
  keyFacts?: string[];
  hidden?: boolean;
  hiddenSource?: ControlSource;
  fidelityOverride?: MessageFidelity;
  fidelitySource?: ControlSource;
  tokenEstimate: number;
  createdAt: number;
  updatedAt?: number;
  source: "annotation" | "derived";
  partTypes: string[];
  toolNames?: string[];
}): MessageEntry {
  return {
    id: input.id,
    role: input.role,
    blobID: input.blobID,
    summary: input.summary,
    keyFacts: mergeUniqueStrings(input.keyFacts ?? []),
    hidden: input.hidden ?? false,
    hiddenSource: input.hiddenSource ?? "default",
    fidelityOverride: input.fidelityOverride ?? "inherit",
    fidelitySource: input.fidelitySource ?? "default",
    tokenEstimate: input.tokenEstimate,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt ?? input.createdAt,
    source: input.source,
    partTypes: input.partTypes,
    toolNames: mergeUniqueStrings(input.toolNames ?? []),
  };
}

export function createBlobEntry(input: {
  id: string;
  label: string;
  summary: string;
  placeholder: string;
  keyFacts?: string[];
  fidelity?: BlobFidelity;
  fidelitySource?: ControlSource;
  createdAt: number;
  lastActiveAt?: number;
}): BlobEntry {
  return {
    id: input.id,
    label: input.label,
    summary: input.summary,
    placeholder: input.placeholder,
    keyFacts: mergeUniqueStrings(input.keyFacts ?? []),
    fidelity: input.fidelity ?? "full",
    fidelitySource: input.fidelitySource ?? "default",
    messageIDs: [],
    tokenEstimate: 0,
    createdAt: input.createdAt,
    lastActiveAt: input.lastActiveAt ?? input.createdAt,
    commitHashes: [],
  };
}

export function rebuildTotals(map: ContextMapFile) {
  map.totalTokenEstimate = Object.values(map.messages).reduce(
    (sum, entry) => sum + entry.tokenEstimate,
    0,
  );
  for (const blob of Object.values(map.blobs)) {
    blob.tokenEstimate = blob.messageIDs.reduce(
      (sum, messageID) => sum + (map.messages[messageID]?.tokenEstimate ?? 0),
      0,
    );
  }
}

function assignMessageToBlob(
  map: ContextMapFile,
  blobID: string,
  message: MessageEntry,
) {
  const previous = map.messages[message.id];
  if (previous?.blobID && previous.blobID !== blobID) {
    const previousBlob = map.blobs[previous.blobID];
    if (previousBlob) {
      previousBlob.messageIDs = previousBlob.messageIDs.filter(
        (messageID) => messageID !== message.id,
      );
    }
  }
  map.messages[message.id] = message;
  const blob = map.blobs[blobID];
  if (!blob.messageIDs.includes(message.id)) blob.messageIDs.push(message.id);
  blob.lastActiveAt = Math.max(blob.lastActiveAt, message.createdAt);
  map.lastActiveBlobID = blobID;
}

function pendingMessagesForAnnotation(
  messages: MessageLike[],
  map: ContextMapFile,
  assistantMessageID: string,
) {
  const currentIndex = messages.findIndex(
    (message) => message.info.id === assistantMessageID,
  );
  if (currentIndex === -1) return [];
  const lastAnnotatedIndex = map.lastAnnotatedMessageID
    ? messages.findIndex(
        (message) => message.info.id === map.lastAnnotatedMessageID,
      )
    : -1;
  return messages.slice(Math.max(0, lastAnnotatedIndex + 1), currentIndex + 1);
}

function upsertBlobFromAnnotation(
  map: ContextMapFile,
  annotation: AnnotationPayload,
  createdAt: number,
) {
  const blobID = slugifyBlobLabel(annotation.blob);
  const existing = map.blobs[blobID];
  if (!existing) {
    map.blobs[blobID] = createBlobEntry({
      id: blobID,
      label: blobID,
      summary: annotation.blob_summary,
      placeholder: annotation.placeholder,
      keyFacts: annotation.key_facts,
      createdAt,
    });
    map.blobOrder.push(blobID);
  }
  const blob = map.blobs[blobID];
  blob.label = blobID;
  blob.summary = annotation.blob_summary;
  blob.placeholder = annotation.placeholder;
  blob.keyFacts = mergeUniqueStrings([
    ...blob.keyFacts,
    ...annotation.key_facts,
  ]);
  blob.lastActiveAt = Math.max(blob.lastActiveAt, createdAt);
  return blob;
}

export function applyAssistantAnnotation(input: {
  map: ContextMapFile;
  messages: MessageLike[];
  assistantMessageID: string;
  annotation: AnnotationPayload;
  excludedMessageIDs?: Set<string>;
}) {
  const pending = pendingMessagesForAnnotation(
    input.messages,
    input.map,
    input.assistantMessageID,
  );
  const assistant = input.messages.find(
    (message) => message.info.id === input.assistantMessageID,
  );
  if (!assistant) return input.map;

  const assistantCreatedAt = getMessageCreatedAt(assistant);
  const blob = upsertBlobFromAnnotation(
    input.map,
    input.annotation,
    assistantCreatedAt,
  );

  for (const message of pending) {
    if (input.excludedMessageIDs?.has(message.info.id)) continue;
    const createdAt = getMessageCreatedAt(message);
    const partTypes = message.parts.map((part) => part.type);
    const toolNames = extractToolNames(message.parts);
    const summary =
      message.info.id === input.assistantMessageID
        ? input.annotation.message_summary
        : input.map.messages[message.info.id]?.summary ||
          deriveSummaryFromMessage(message);

    const current = input.map.messages[message.info.id];
    const entry = createMessageEntry({
      id: message.info.id,
      role: message.info.role,
      blobID: blob.id,
      summary,
      keyFacts:
        message.info.id === input.assistantMessageID
          ? input.annotation.key_facts
          : current?.keyFacts,
      hidden: current?.hidden,
      hiddenSource: current?.hiddenSource,
      fidelityOverride: current?.fidelityOverride,
      fidelitySource: current?.fidelitySource,
      tokenEstimate: estimateTokensFromParts(message.parts),
      createdAt,
      updatedAt: Date.now(),
      source:
        message.info.id === input.assistantMessageID
          ? "annotation"
          : (current?.source ?? "derived"),
      partTypes,
      toolNames,
    });
    assignMessageToBlob(input.map, blob.id, entry);
  }

  input.map.lastAnnotatedMessageID = input.assistantMessageID;
  input.map.updatedAt = Date.now();
  rebuildTotals(input.map);
  return input.map;
}

function upsertBlobFromRetroactive(
  map: ContextMapFile,
  item: RetroactiveAnnotationItem,
  createdAt: number,
) {
  const blobID = slugifyBlobLabel(item.blob);
  const existing = map.blobs[blobID];
  if (!existing) {
    map.blobs[blobID] = createBlobEntry({
      id: blobID,
      label: blobID,
      summary: item.blob_summary ?? item.message_summary,
      placeholder:
        item.placeholder ??
        trimText(item.blob_summary ?? item.message_summary, 80),
      keyFacts: item.key_facts,
      createdAt,
    });
    map.blobOrder.push(blobID);
  }

  const blob = map.blobs[blobID];
  if (item.blob_summary) blob.summary = item.blob_summary;
  if (item.placeholder) blob.placeholder = item.placeholder;
  blob.keyFacts = mergeUniqueStrings([...blob.keyFacts, ...item.key_facts]);
  blob.lastActiveAt = Math.max(blob.lastActiveAt, createdAt);
  return blob;
}

function applyRetroactiveAnnotationItem(input: {
  map: ContextMapFile;
  messages: MessageLike[];
  item: RetroactiveAnnotationItem;
}) {
  const message = input.messages.find(
    (candidate) => candidate.info.id === input.item.message_id,
  );
  if (!message) return false;

  const createdAt = getMessageCreatedAt(message);
  const blob = upsertBlobFromRetroactive(input.map, input.item, createdAt);
  const current = input.map.messages[message.info.id];
  const entry = createMessageEntry({
    id: message.info.id,
    role: message.info.role,
    blobID: blob.id,
    summary: input.item.message_summary,
    keyFacts: input.item.key_facts,
    hidden: current?.hidden,
    hiddenSource: current?.hiddenSource,
    fidelityOverride: current?.fidelityOverride,
    fidelitySource: current?.fidelitySource,
    tokenEstimate: estimateTokensFromParts(message.parts),
    createdAt,
    updatedAt: Date.now(),
    source: "annotation",
    partTypes: message.parts.map((part) => part.type),
    toolNames: extractToolNames(message.parts),
  });
  assignMessageToBlob(input.map, blob.id, entry);
  delete input.map.pendingRetroactive[message.info.id];
  return true;
}

export function applyAnnotationEnvelope(input: {
  map: ContextMapFile;
  messages: MessageLike[];
  assistantMessageID: string;
  annotation: AnnotationEnvelope;
}) {
  const excluded = new Set<string>();
  for (const item of input.annotation.retroactive) {
    if (
      applyRetroactiveAnnotationItem({
        map: input.map,
        messages: input.messages,
        item,
      })
    ) {
      excluded.add(item.message_id);
    }
  }

  const pending = pendingMessagesForAnnotation(
    input.messages,
    input.map,
    input.assistantMessageID,
  );
  const next = applyAssistantAnnotation({
    map: input.map,
    messages: input.messages,
    assistantMessageID: input.assistantMessageID,
    annotation: input.annotation.current,
    excludedMessageIDs: excluded,
  });

  for (const message of pending) {
    delete next.pendingRetroactive[message.info.id];
  }

  return next;
}

export function capturePendingRetroactiveMessage(input: {
  map: ContextMapFile;
  messages: MessageLike[];
  messageID: string;
  suggestedBlobID?: string;
}) {
  const message = input.messages.find(
    (candidate) => candidate.info.id === input.messageID,
  );
  if (!message || message.info.role !== "assistant") return input.map;

  const hasVisibleText = message.parts.some(
    (part) => part.type === "text" && (part.text ?? "").trim().length > 0,
  );
  if (hasVisibleText) {
    delete input.map.pendingRetroactive[input.messageID];
    return input.map;
  }

  const createdAt = getMessageCreatedAt(message);
  const current = input.map.messages[input.messageID];
  const summary = current?.summary ?? deriveSummaryFromMessage(message);
  const toolNames = extractToolNames(message.parts);
  input.map.pendingRetroactive[input.messageID] = {
    messageID: input.messageID,
    summary,
    toolNames,
    tokenEstimate: estimateTokensFromParts(message.parts),
    createdAt,
    suggestedBlobID: input.suggestedBlobID,
    suggestedBlobLabel: input.suggestedBlobID
      ? input.map.blobs[input.suggestedBlobID]?.label
      : undefined,
  };

  if (!current) {
    input.map.messages[input.messageID] = createMessageEntry({
      id: message.info.id,
      role: message.info.role,
      summary,
      tokenEstimate: estimateTokensFromParts(message.parts),
      createdAt,
      updatedAt: Date.now(),
      source: "derived",
      partTypes: message.parts.map((part) => part.type),
      toolNames,
    });
  }

  input.map.updatedAt = Date.now();
  rebuildTotals(input.map);
  return input.map;
}

export function applyFallbackAnnotation(input: {
  map: ContextMapFile;
  messages: MessageLike[];
  assistantMessageID: string;
  fallbackLabel?: string;
}) {
  const assistant = input.messages.find(
    (message) => message.info.id === input.assistantMessageID,
  );
  if (!assistant) return input.map;

  const summary = deriveSummaryFromMessage(assistant);
  const blobID =
    input.map.lastActiveBlobID ??
    slugifyBlobLabel(input.fallbackLabel ?? "working_set");
  if (!input.map.blobs[blobID]) {
    input.map.blobs[blobID] = createBlobEntry({
      id: blobID,
      label: blobID,
      summary,
      placeholder: trimText(summary, 80),
      createdAt: getMessageCreatedAt(assistant),
    });
    input.map.blobOrder.push(blobID);
  }

  const annotation: AnnotationPayload = {
    blob: blobID,
    is_new_blob: false,
    message_summary: summary,
    blob_summary: input.map.blobs[blobID].summary || summary,
    placeholder: input.map.blobs[blobID].placeholder || trimText(summary, 80),
    key_facts: [],
  };
  return applyAssistantAnnotation({
    map: input.map,
    messages: input.messages,
    assistantMessageID: input.assistantMessageID,
    annotation,
  });
}

export function ensureMapCoverage(
  map: ContextMapFile,
  messages: MessageLike[],
) {
  let activeBlobID = map.lastActiveBlobID;
  for (const message of messages) {
    if (map.messages[message.info.id]) {
      activeBlobID = map.messages[message.info.id]?.blobID ?? activeBlobID;
      continue;
    }

    if (!activeBlobID) {
      const seed = slugifyBlobLabel(
        labelFromSummary(
          deriveSummaryFromMessage(message),
          map.blobOrder.length + 1,
        ),
      );
      map.blobs[seed] = createBlobEntry({
        id: seed,
        label: seed,
        summary: deriveSummaryFromMessage(message),
        placeholder: trimText(deriveSummaryFromMessage(message), 80),
        createdAt: getMessageCreatedAt(message),
      });
      map.blobOrder.push(seed);
      activeBlobID = seed;
    }

    const entry = createMessageEntry({
      id: message.info.id,
      role: message.info.role,
      blobID: activeBlobID,
      summary: deriveSummaryFromMessage(message),
      tokenEstimate: estimateTokensFromParts(message.parts),
      createdAt: getMessageCreatedAt(message),
      updatedAt: Date.now(),
      source: "derived",
      partTypes: message.parts.map((part) => part.type),
      toolNames: extractToolNames(message.parts),
    });
    assignMessageToBlob(map, activeBlobID, entry);
    map.blobs[activeBlobID].summary ||= entry.summary;
    map.blobs[activeBlobID].placeholder ||= trimText(entry.summary, 80);
  }

  map.updatedAt = Date.now();
  rebuildTotals(map);
  return map;
}

export function mergeContextMaps(
  existing: ContextMapFile,
  fresh: ContextMapFile,
) {
  const merged: ContextMapFile = {
    ...fresh,
    settings: {
      ...fresh.settings,
      ...existing.settings,
    },
    blobs: { ...fresh.blobs },
    messages: { ...fresh.messages },
    pendingRetroactive: { ...existing.pendingRetroactive },
  };

  for (const blobID of existing.blobOrder) {
    const prior = existing.blobs[blobID];
    if (!prior) continue;
    const next = merged.blobs[blobID];
    if (!next) {
      merged.blobs[blobID] = structuredClone(prior);
      if (!merged.blobOrder.includes(blobID)) merged.blobOrder.push(blobID);
      continue;
    }
    merged.blobs[blobID] = {
      ...next,
      fidelity: prior.fidelity,
      fidelitySource: prior.fidelitySource,
      commitHashes: mergeUniqueStrings([
        ...next.commitHashes,
        ...prior.commitHashes,
      ]),
      summary:
        prior.fidelitySource !== "system" &&
        prior.summary.length > next.summary.length
          ? prior.summary
          : next.summary,
      placeholder:
        prior.placeholder.length > next.placeholder.length
          ? prior.placeholder
          : next.placeholder,
      keyFacts: mergeUniqueStrings([...next.keyFacts, ...prior.keyFacts]),
    };
  }

  for (const [messageID, prior] of Object.entries(existing.messages)) {
    const next = merged.messages[messageID];
    if (!next) {
      merged.messages[messageID] = structuredClone(prior);
      continue;
    }
    merged.messages[messageID] = {
      ...next,
      blobID:
        prior.source === "annotation" && prior.blobID
          ? prior.blobID
          : next.blobID,
      hidden: prior.hidden,
      hiddenSource: prior.hiddenSource,
      fidelityOverride: prior.fidelityOverride,
      fidelitySource: prior.fidelitySource,
      summary: prior.source === "annotation" ? prior.summary : next.summary,
      keyFacts: mergeUniqueStrings([...next.keyFacts, ...prior.keyFacts]),
      source: prior.source === "annotation" ? "annotation" : next.source,
    };
  }

  merged.pendingRetroactive = Object.fromEntries(
    Object.entries(merged.pendingRetroactive).filter(([messageID]) => {
      const message = merged.messages[messageID];
      return Boolean(message && message.source !== "annotation");
    }),
  );

  merged.updatedAt = Date.now();
  rebuildTotals(merged);
  return merged;
}

export function updateBlobFidelity(input: {
  map: ContextMapFile;
  blobID: string;
  fidelity: BlobFidelity;
  source: ControlSource;
  force?: boolean;
}) {
  const blob = input.map.blobs[input.blobID];
  if (!blob)
    return { ok: false as const, message: `Unknown blob: ${input.blobID}` };
  if (
    blob.fidelitySource === "user" &&
    input.source === "agent" &&
    !input.force
  ) {
    return {
      ok: false as const,
      message: `Blob ${input.blobID} is user-controlled; refusing to override without force.`,
    };
  }
  blob.fidelity = blobFidelitySchema.parse(input.fidelity);
  blob.fidelitySource = input.source;
  input.map.updatedAt = Date.now();
  return {
    ok: true as const,
    message: `Set ${input.blobID} to ${input.fidelity}.`,
  };
}

export function updateMessageControls(input: {
  map: ContextMapFile;
  messageID: string;
  hidden?: boolean;
  fidelityOverride?: MessageFidelity;
  source: ControlSource;
}) {
  const message = input.map.messages[input.messageID];
  if (!message)
    return {
      ok: false as const,
      message: `Unknown message: ${input.messageID}`,
    };
  if (typeof input.hidden === "boolean") {
    message.hidden = input.hidden;
    message.hiddenSource = input.source;
  }
  if (input.fidelityOverride) {
    message.fidelityOverride = input.fidelityOverride;
    message.fidelitySource = input.source;
  }
  message.updatedAt = Date.now();
  input.map.updatedAt = Date.now();
  return { ok: true as const, message: `Updated message ${input.messageID}.` };
}

export function buildPlaceholderText(map: ContextMapFile, blob: BlobEntry) {
  const head = `[${blob.label} - ~${blob.tokenEstimate.toLocaleString()} tok: ${blob.placeholder}]`;
  if (!map.settings.placeholderIncludesKeyFacts || blob.keyFacts.length === 0)
    return head;
  return `${head}\nKey facts: ${blob.keyFacts.join("; ")}`;
}

export function buildBlobSummaryText(blob: BlobEntry) {
  const facts =
    blob.keyFacts.length > 0 ? `\nKey facts: ${blob.keyFacts.join("; ")}` : "";
  return `[Blob summary: ${blob.label}] ${blob.summary}${facts}`;
}

export function buildMessageSummaryText(message: MessageEntry) {
  const facts =
    message.keyFacts.length > 0
      ? `\nKey facts: ${message.keyFacts.join("; ")}`
      : "";
  return `[Message summary] ${message.summary}${facts}`;
}

function clonePart<Value>(value: Value): Value {
  return structuredClone(value);
}

function textPartForMessage(
  message: MessageLike,
  text: string,
): MessageLike["parts"][number] {
  const first = message.parts[0];
  return {
    id: first?.id ?? `${message.info.id}-context-map`,
    type: "text",
    text,
  };
}

function replaceMessageWithText(
  message: MessageLike,
  text: string,
): MessageLike {
  return {
    ...message,
    parts: [textPartForMessage(message, text)],
  };
}

function cleanupToolParts(map: ContextMapFile, parts: MessageLike["parts"]) {
  if (!map.settings.toolHistoryCleanup) return parts.map(clonePart);
  return parts.map((part) => {
    if (part.type !== "tool") return clonePart(part);
    if (
      ![
        "context_map",
        "compress_blob",
        "drop_blob",
        "session_lookup",
        "session_zoom",
        "blame_lookup",
      ].includes(part.tool ?? "")
    ) {
      return clonePart(part);
    }
    const next = clonePart(part);
    if (next.state?.status === "completed") {
      next.state.output = `[Context-map tool output omitted; state is persisted outside the transcript.]`;
    }
    return next;
  });
}

function chooseBlobAnchorIndex(messages: MessageLike[], indexes: number[]) {
  const assistantIndex = [...indexes]
    .reverse()
    .find((index) => messages[index]?.info.role === "assistant");
  return assistantIndex ?? indexes[indexes.length - 1]!;
}

export function transformMessagesForContext(
  messages: MessageLike[],
  map: ContextMapFile,
) {
  const blobIndexes = new Map<string, number[]>();
  messages.forEach((message, index) => {
    const entry = map.messages[message.info.id];
    if (!entry?.blobID) return;
    const blob = map.blobs[entry.blobID];
    if (!blob) return;
    if (blob.fidelity !== "compressed" && blob.fidelity !== "placeholder")
      return;
    const list = blobIndexes.get(blob.id) ?? [];
    list.push(index);
    blobIndexes.set(blob.id, list);
  });

  const anchorIndexByBlob = new Map<string, number>();
  for (const [blobID, indexes] of blobIndexes) {
    anchorIndexByBlob.set(blobID, chooseBlobAnchorIndex(messages, indexes));
  }

  const output: MessageLike[] = [];

  for (let index = 0; index < messages.length; index++) {
    const message = messages[index]!;
    const base: MessageLike = {
      ...message,
      parts: cleanupToolParts(map, message.parts),
    };

    const entry = map.messages[message.info.id];
    const blob = entry?.blobID ? map.blobs[entry.blobID] : undefined;

    if (!entry || !blob) {
      output.push(base);
      continue;
    }

    if (blob.fidelity === "drop") continue;

    if (blob.fidelity === "compressed") {
      if (anchorIndexByBlob.get(blob.id) !== index) continue;
      output.push(replaceMessageWithText(base, buildBlobSummaryText(blob)));
      continue;
    }

    if (blob.fidelity === "placeholder") {
      if (anchorIndexByBlob.get(blob.id) !== index) continue;
      output.push(
        replaceMessageWithText(base, buildPlaceholderText(map, blob)),
      );
      continue;
    }

    if (entry.hidden) continue;

    if (blob.fidelity === "summary") {
      if (entry.fidelityOverride === "full") {
        output.push(base);
        continue;
      }
      output.push(replaceMessageWithText(base, buildMessageSummaryText(entry)));
      continue;
    }

    if (entry.fidelityOverride === "summary") {
      output.push(replaceMessageWithText(base, buildMessageSummaryText(entry)));
      continue;
    }

    output.push(base);
  }

  return output;
}

export function buildCurrentContextOverview(map: ContextMapFile, limit = 12) {
  const ordered = map.blobOrder
    .map((blobID) => map.blobs[blobID])
    .filter(Boolean)
    .sort((a, b) => b.lastActiveAt - a.lastActiveAt)
    .slice(0, limit);

  if (ordered.length === 0) return "No context blobs have been annotated yet.";

  return ordered
    .map((blob) => {
      const source =
        blob.fidelitySource === "user"
          ? "user-controlled"
          : `${blob.fidelitySource}-controlled`;
      return `- ${blob.label} [${blob.fidelity}, ${source}, ~${blob.tokenEstimate.toLocaleString()} tok, ${blob.messageIDs.length} messages]: ${blob.placeholder}`;
    })
    .join("\n");
}

function buildPendingRetroactivePrompt(map: ContextMapFile, limit = 6) {
  const pending = Object.values(map.pendingRetroactive)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, limit);

  if (pending.length === 0) {
    return [
      "There are no earlier unannotated assistant messages right now, so set retroactive to [].",
    ];
  }

  return [
    "Earlier assistant messages still need retroactive labeling. Include one retroactive item for each message_id listed below, even if it belongs to the same blob as the current response.",
    ...pending.map((item) => {
      const guess =
        item.suggestedBlobLabel ?? item.suggestedBlobID ?? "unknown";
      const tools =
        item.toolNames.length > 0 ? ` tools=${item.toolNames.join(",")}` : "";
      return `- message_id=${item.messageID} guessed_blob=${guess}${tools} summary=${item.summary}`;
    }),
  ];
}

export function buildPluginGuidanceSystemPrompt(map: ContextMapFile) {
  return [
    "Context map plugin is active.",
    "User controls are authoritative: do not override user-selected blob fidelity or hidden-message choices unless the user explicitly asks or you use a justified force override.",
    "Use context_map to inspect the current map, compress_blob or drop_blob to change blob fidelity, and session_lookup / blame_lookup plus session_zoom in a sub-agent for historical investigations.",
    "Current map overview:",
    buildCurrentContextOverview(map),
  ].join("\n");
}

export function buildAnnotationSystemPrompt(map: ContextMapFile) {
  const existing = map.blobOrder
    .map((blobID) => map.blobs[blobID])
    .filter(Boolean);
  const labels =
    existing.length > 0
      ? existing.map((blob) => blob.label).join(", ")
      : "none yet";
  return [
    "Mandatory annotation requirement for this session:",
    "1. Write the normal user-facing response first.",
    "2. Immediately append exactly one <annotation>...</annotation> block after the response.",
    "3. The annotation must contain valid JSON with top-level keys current and retroactive.",
    "4. Do not use markdown fences around the annotation. Do not explain the annotation. Do not skip it.",
    "5. blob must be a stable snake_case label. Reuse an existing blob whenever the conversation returns to an earlier topic.",
    "6. message_summary describes only this assistant message. blob_summary describes the running state of the whole blob so far.",
    "7. placeholder is a short 5-10 word stub. key_facts contains only facts or decisions worth preserving through compression.",
    "8. current must contain the full annotation for this assistant response. retroactive must contain per-message annotations for any earlier pending assistant messages listed below.",
    "Required format:",
    '<annotation>{"current":{"blob":"auth_debugging","is_new_blob":false,"message_summary":"Explained why the mutex failed and the queue replaced it.","blob_summary":"Investigated auth rate limiter race condition and switched from mutex to async queue after tests failed.","placeholder":"Debugging auth rate limiter race condition","key_facts":["mutex failed tests","async queue on line 42"]},"retroactive":[{"message_id":"msg_tool_1","blob":"auth_debugging","message_summary":"Ran auth concurrency tests and reproduced the mutex failure.","key_facts":["mutex failed tests"]}]}</annotation>',
    `Existing blob labels: ${labels}`,
    ...buildPendingRetroactivePrompt(map),
  ].join("\n");
}

export function buildCompactionPrompt(map: ContextMapFile) {
  const lines = map.blobOrder
    .map((blobID) => map.blobs[blobID])
    .filter(Boolean);
  const policy =
    lines.length === 0
      ? "- No blob map exists yet; summarize the conversation normally."
      : lines
          .map((blob) => {
            const prefix = `- ${blob.label} [${blob.fidelity}, ${blob.fidelitySource}]`;
            switch (blob.fidelity) {
              case "full":
                return `${prefix}: preserve detailed decisions and file-level specifics.`;
              case "summary":
                return `${prefix}: compress to a chronological list of message-level decisions.`;
              case "compressed":
                return `${prefix}: compress to one paragraph while preserving key facts.`;
              case "placeholder":
                return `${prefix}: reduce to a short stub and only the most critical facts.`;
              case "drop":
                return `${prefix}: omit unless absolutely necessary to avoid contradiction.`;
            }
          })
          .join("\n");

  return [
    "Provide a detailed prompt for continuing this conversation.",
    "Respect the context-map policy below. User-controlled fidelity decisions have the highest priority.",
    "Use this template:",
    "## Goal",
    "## Instructions",
    "## Discoveries",
    "## Accomplished",
    "## Relevant files / directories",
    "",
    "Context-map policy:",
    policy,
  ].join("\n");
}

export function buildContextMapToolView(map: ContextMapFile) {
  const blobs = map.blobOrder
    .map((blobID) => map.blobs[blobID])
    .filter(Boolean);
  return {
    session_id: map.sessionID,
    total_token_estimate: map.totalTokenEstimate,
    settings: map.settings,
    controls: {
      user_controls_are_authoritative: true,
      blob_fidelity_options: [
        "full",
        "summary",
        "compressed",
        "placeholder",
        "drop",
      ],
      message_fidelity_options: ["inherit", "full", "summary"],
    },
    blobs: blobs.map((blob) => ({
      id: blob.id,
      label: blob.label,
      summary: blob.summary,
      placeholder: blob.placeholder,
      key_facts: blob.keyFacts,
      fidelity: blob.fidelity,
      fidelity_source: blob.fidelitySource,
      token_estimate: blob.tokenEstimate,
      message_ids: blob.messageIDs,
      message_count: blob.messageIDs.length,
      last_active_at: blob.lastActiveAt,
    })),
    messages: Object.values(map.messages)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((message) => ({
        id: message.id,
        role: message.role,
        blob_id: message.blobID,
        summary: message.summary,
        key_facts: message.keyFacts,
        hidden: message.hidden,
        hidden_source: message.hiddenSource,
        fidelity_override: message.fidelityOverride,
        fidelity_source: message.fidelitySource,
        token_estimate: message.tokenEstimate,
        source: message.source,
      })),
    pending_retroactive: Object.values(map.pendingRetroactive)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((item) => ({
        message_id: item.messageID,
        summary: item.summary,
        tool_names: item.toolNames,
        suggested_blob_id: item.suggestedBlobID,
        suggested_blob_label: item.suggestedBlobLabel,
      })),
  };
}

export function buildHistoricalOverview(input: {
  map: ContextMapFile;
  session: SessionLike;
  commitEntry?: CommitMapEntry;
  matchedBlobIDs?: string[];
}): HistoricalSessionOverview {
  const activeBlobIDs = new Set(input.commitEntry?.activeBlobIDs ?? []);
  return {
    sessionID: input.session.id,
    title: input.session.title ?? input.session.id,
    updatedAt: input.session.time?.updated,
    matchedBlobIDs: input.matchedBlobIDs ?? [],
    blobs: input.map.blobOrder
      .map((blobID) => input.map.blobs[blobID])
      .filter(Boolean)
      .map((blob) => ({
        id: blob.id,
        label: blob.label,
        placeholder: blob.placeholder,
        tokenEstimate: blob.tokenEstimate,
        fidelity: blob.fidelity,
        keyFacts: blob.keyFacts,
        activeForCommit: activeBlobIDs.has(blob.id),
      })),
  };
}

export function buildSessionZoomText(input: {
  map: ContextMapFile;
  blobID: string;
  fidelity: "compressed" | "full";
  messages?: MessageLike[];
}) {
  const blob = input.map.blobs[input.blobID];
  if (!blob) return `Unknown blob: ${input.blobID}`;
  if (input.fidelity === "compressed") return buildBlobSummaryText(blob);
  const relevant = (input.messages ?? []).filter((message) =>
    blob.messageIDs.includes(message.info.id),
  );
  if (relevant.length === 0)
    return `No full messages found for blob ${input.blobID}.`;
  return relevant
    .map((message) => {
      const summary =
        input.map.messages[message.info.id]?.summary ??
        deriveSummaryFromMessage(message);
      const text = message.parts
        .filter((part) => part.type === "text" && part.text)
        .map((part) => part.text?.trim())
        .filter(Boolean)
        .join("\n");
      return [
        `Role: ${message.info.role}`,
        `Summary: ${summary}`,
        text ? `Text:\n${text}` : undefined,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");
}

export function buildFallbackMapFromMessages(input: {
  sessionID: string;
  directory?: string;
  worktree?: string;
  messages: MessageLike[];
}): ContextMapFile {
  const map: ContextMapFile = {
    version: 1,
    sessionID: input.sessionID,
    directory: input.directory,
    worktree: input.worktree,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    totalTokenEstimate: 0,
    settings: {
      placeholderIncludesKeyFacts: true,
      placeholderIncludesKeyFactsSource: "system",
      toolHistoryCleanup: true,
    },
    blobOrder: [],
    blobs: {},
    messages: {},
    pendingRetroactive: {},
  };

  let currentBlobID: string | undefined;
  for (const message of input.messages) {
    const summary = deriveSummaryFromMessage(message);
    if (!currentBlobID || message.info.role === "user") {
      currentBlobID = findBestBlobForSummary(map, summary);
      if (!currentBlobID) {
        currentBlobID = slugifyBlobLabel(
          labelFromSummary(summary, map.blobOrder.length + 1),
        );
        map.blobs[currentBlobID] = createBlobEntry({
          id: currentBlobID,
          label: currentBlobID,
          summary,
          placeholder: trimText(summary, 80),
          createdAt: getMessageCreatedAt(message),
          fidelity: "placeholder",
          fidelitySource: "system",
        });
        map.blobOrder.push(currentBlobID);
      }
    }

    const entry = createMessageEntry({
      id: message.info.id,
      role: message.info.role,
      blobID: currentBlobID,
      summary,
      tokenEstimate: estimateTokensFromParts(message.parts),
      createdAt: getMessageCreatedAt(message),
      updatedAt: Date.now(),
      source: "derived",
      partTypes: message.parts.map((part) => part.type),
      toolNames: extractToolNames(message.parts),
    });
    assignMessageToBlob(map, currentBlobID, entry);
    const blob = map.blobs[currentBlobID];
    blob.summary = mergeBlobSummary(blob.summary, summary);
    blob.placeholder = trimText(blob.summary, 80);
  }

  rebuildTotals(map);
  return map;
}

export function matchBlobIDsForQuery(map: ContextMapFile, query: string) {
  const words = keywordSet(query);
  const matches = map.blobOrder
    .map((blobID) => map.blobs[blobID])
    .filter(Boolean)
    .map((blob) => ({ blobID: blob.id, score: scoreBlob(blob, words) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  return matches.map((item) => item.blobID);
}

function scoreBlob(blob: BlobEntry, words: Set<string>) {
  const haystack = keywordSet(
    `${blob.label} ${blob.summary} ${blob.placeholder} ${blob.keyFacts.join(" ")}`,
  );
  let score = 0;
  for (const word of words) {
    if (haystack.has(word)) score += 1;
  }
  return score;
}

function findBestBlobForSummary(map: ContextMapFile, summary: string) {
  const words = keywordSet(summary);
  let best: { blobID: string; score: number } | undefined;
  for (const blobID of map.blobOrder) {
    const blob = map.blobs[blobID];
    if (!blob) continue;
    const score = scoreBlob(blob, words);
    if (score < 2) continue;
    if (!best || score > best.score) best = { blobID, score };
  }
  return best?.blobID;
}

function labelFromSummary(summary: string, index: number) {
  const words = [...keywordSet(summary)].slice(0, 4);
  if (words.length === 0) return `topic_${index}`;
  return words.join("_");
}

function mergeBlobSummary(current: string, next: string) {
  if (!current) return next;
  if (current.includes(next)) return current;
  return trimText(`${current} ${next}`, 600);
}

function keywordSet(text: string) {
  const values = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3)
    .filter((item) => !STOP_WORDS.has(item));
  return new Set(values);
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function trimText(value: string, limit: number) {
  const text = collapseWhitespace(value);
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 3)).trim()}...`;
}

export function sortMessagesChronologically<Value extends MessageLike>(
  messages: Value[],
) {
  return [...messages].sort(
    (a, b) => getMessageCreatedAt(a) - getMessageCreatedAt(b),
  );
}

export function mapFromToolMessages(input: {
  sessionID: string;
  directory?: string;
  worktree?: string;
  messages: MessageLike[];
}) {
  const sorted = sortMessagesChronologically(input.messages);
  return buildFallbackMapFromMessages({
    sessionID: input.sessionID,
    directory: input.directory,
    worktree: input.worktree,
    messages: sorted,
  });
}

export function summarizeToolState(part: Extract<Part, { type: "tool" }>) {
  if (part.state.status === "completed") {
    return trimText(`Tool ${part.tool}: ${part.state.title ?? part.tool}`, 180);
  }
  if (part.state.status === "error") {
    return trimText(`Tool ${part.tool} failed: ${part.state.error}`, 180);
  }
  return trimText(`Tool ${part.tool}: ${part.state.status}`, 180);
}

// ── Context preview (for sidebar and debug log) ───────────────────────

export function formatTokens(n: number): string {
  if (n < 1000) return `${n}`;
  return `${(n / 1000).toFixed(1)}k`;
}

export function computeContextPreview(map: ContextMapFile): ContextPreview {
  const blobs: ContextPreviewBlob[] = [];
  let totalRaw = 0;
  let totalEffective = 0;

  for (const blobID of map.blobOrder) {
    const blob = map.blobs[blobID];
    if (!blob || blob.messageIDs.length === 0) continue;

    const msgCount = blob.messageIDs.length;
    const raw = blob.tokenEstimate;
    totalRaw += raw;

    let effective: number;
    let effectiveLabel: string;

    switch (blob.fidelity) {
      case "full": {
        const visibleCount = blob.messageIDs.filter((id) => {
          const m = map.messages[id];
          return m && !m.hidden;
        }).length;
        const visibleTokens = blob.messageIDs.reduce((sum, id) => {
          const m = map.messages[id];
          return sum + (m && !m.hidden ? m.tokenEstimate : 0);
        }, 0);
        effective = visibleTokens;
        effectiveLabel = `${visibleCount} msgs ${formatTokens(effective)}`;
        break;
      }
      case "summary":
        effective = Math.min(raw, msgCount * 60);
        effectiveLabel = `${msgCount} summaries`;
        break;
      case "compressed":
        effective = Math.min(raw, 150);
        effectiveLabel = "1 paragraph";
        break;
      case "placeholder":
        effective = Math.min(raw, 30);
        effectiveLabel = "stub";
        break;
      case "drop":
        effective = 0;
        effectiveLabel = "dropped";
        break;
    }

    totalEffective += effective;
    blobs.push({
      id: blobID,
      label: blob.label,
      fidelity: blob.fidelity,
      rawTokens: raw,
      effectiveTokens: effective,
      messageCount: msgCount,
      effectiveLabel,
    });
  }

  return { blobs, totalRaw, totalEffective };
}

export function computeEffectiveTreatment(
  msg: MessageEntry,
  blob?: BlobEntry,
): string {
  if (!blob) return "unassigned";
  if (blob.fidelity === "drop") return "dropped";
  if (blob.fidelity === "placeholder") return "placeholder-stub";
  if (blob.fidelity === "compressed") return "compressed-paragraph";
  if (msg.hidden) return "hidden";
  if (blob.fidelity === "summary") {
    return msg.fidelityOverride === "full" ? "kept-full" : "summarized";
  }
  if (msg.fidelityOverride === "summary") return "summarized";
  return "kept-full";
}
