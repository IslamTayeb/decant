import type { Part } from "@opencode-ai/sdk";

import {
  annotationEnvelopeSchema,
  annotationSchema,
  topicFidelitySchema,
  type AnnotationEnvelope,
  type AnnotationPayload,
  type TopicEntry,
  type TopicFidelity,
  type CommitMapEntry,
  type ContextMapFile,
  type ContextMapCompactionState,
  type ContextPreview,
  type ContextPreviewTopic,
  type ControlSource,
  type HistoricalSessionOverview,
  type MessageEntry,
  type MessageLike,
  type MessageFidelity,
  type RetroactiveAnnotationItem,
  type SessionLike,
} from "./types";

export const COMPACTION_SUMMARY_TOPIC_ID = "session_summary";

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "because",
  "before",
  "being",
  "between",
  "called",
  "check",
  "could",
  "does",
  "each",
  "explain",
  "find",
  "from",
  "have",
  "into",
  "just",
  "look",
  "make",
  "more",
  "now",
  "only",
  "over",
  "read",
  "same",
  "search",
  "should",
  "show",
  "some",
  "switch",
  "tell",
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

export function slugifyTopicLabel(value: string) {
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

export function filterMessagesForActiveContext(
  map: ContextMapFile,
  messages: MessageLike[],
  input?: { includeSummary?: boolean },
) {
  const compaction = map.compaction;
  if (!compaction) return messages;
  const includeSummary = input?.includeSummary ?? true;
  return messages.filter((message) => {
    if (message.info.id === compaction.summaryMessageID) return includeSummary;
    return getMessageCreatedAt(message) > compaction.compactedAt;
  });
}

export function resetMapAfterCompaction(input: {
  map: ContextMapFile;
  summaryText: string;
  summaryMessageID: string;
  compactedAt?: number;
  includeMessageID?: string;
  archivePath?: string;
  summaryFidelity?: TopicFidelity;
}): ContextMapFile {
  const compactedAt = input.compactedAt ?? Date.now();
  const summaryText = input.summaryText.trim() || "Conversation compacted.";
  const summaryTopicID = COMPACTION_SUMMARY_TOPIC_ID;
  const summaryFidelity =
    input.summaryFidelity ?? defaultCompactionSummaryFidelity(input.map);
  const topic = createTopicEntry({
    id: summaryTopicID,
    label: summaryTopicID,
    summary: summaryText,
    placeholder:
      summaryFidelity === "placeholder"
        ? "Historical context compacted"
        : trimText(summaryText, 80),
    fidelity: summaryFidelity,
    fidelitySource: "system",
    createdAt: compactedAt,
    lastActiveAt: compactedAt,
  });
  const message = createMessageEntry({
    id: input.summaryMessageID,
    role: "assistant",
    topicID: summaryTopicID,
    summary: summaryText,
    tokenEstimate: estimateTokensFromText(summaryText),
    createdAt: compactedAt,
    updatedAt: compactedAt,
    source: "derived",
    partTypes: ["text"],
    toolNames: [],
  });
  topic.messageIDs.push(message.id);

  const compaction: ContextMapCompactionState = {
    compactedAt,
    summaryMessageID: input.summaryMessageID,
    summaryTopicID,
    includeMessageID: input.includeMessageID,
    archivePath: input.archivePath,
  };
  const next: ContextMapFile = {
    ...input.map,
    updatedAt: compactedAt,
    lastAnnotatedMessageID: input.summaryMessageID,
    lastActiveTopicID: summaryTopicID,
    topicOrder: [summaryTopicID],
    topics: { [summaryTopicID]: topic },
    messages: { [message.id]: message },
    pendingRetroactive: {},
    compaction,
  };
  rebuildTotals(next);
  return next;
}

function defaultCompactionSummaryFidelity(_map: ContextMapFile): TopicFidelity {
  return "summary";
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
  topicID?: string;
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
    topicID: input.topicID,
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

export function createTopicEntry(input: {
  id: string;
  label: string;
  summary: string;
  placeholder: string;
  keyFacts?: string[];
  fidelity?: TopicFidelity;
  fidelitySource?: ControlSource;
  createdAt: number;
  lastActiveAt?: number;
}): TopicEntry {
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
  for (const topic of Object.values(map.topics)) {
    topic.tokenEstimate = topic.messageIDs.reduce(
      (sum, messageID) => sum + (map.messages[messageID]?.tokenEstimate ?? 0),
      0,
    );
  }
}

function assignMessageToTopic(
  map: ContextMapFile,
  topicID: string,
  message: MessageEntry,
) {
  const previous = map.messages[message.id];
  if (previous?.topicID && previous.topicID !== topicID) {
    const previousTopic = map.topics[previous.topicID];
    if (previousTopic) {
      previousTopic.messageIDs = previousTopic.messageIDs.filter(
        (messageID) => messageID !== message.id,
      );
    }
  }
  map.messages[message.id] = message;
  const topic = map.topics[topicID];
  if (!topic.messageIDs.includes(message.id)) topic.messageIDs.push(message.id);
  topic.lastActiveAt = Math.max(topic.lastActiveAt, message.createdAt);
  map.lastActiveTopicID = topicID;
}

function pendingMessagesForAnnotation(
  messages: MessageLike[],
  map: ContextMapFile,
  assistantMessageID: string,
) {
  const activeMessages = filterMessagesForActiveContext(map, messages, {
    includeSummary: false,
  });
  const currentIndex = activeMessages.findIndex(
    (message) => message.info.id === assistantMessageID,
  );
  if (currentIndex === -1) return [];
  const lastAnnotatedIndex = map.lastAnnotatedMessageID
    ? activeMessages.findIndex(
        (message) => message.info.id === map.lastAnnotatedMessageID,
      )
    : -1;
  return activeMessages.slice(
    Math.max(0, lastAnnotatedIndex + 1),
    currentIndex + 1,
  );
}

function upsertTopicFromAnnotation(
  map: ContextMapFile,
  annotation: AnnotationPayload,
  createdAt: number,
) {
  const topicID = slugifyTopicLabel(annotation.topic);
  const existing = map.topics[topicID];
  if (!existing) {
    map.topics[topicID] = createTopicEntry({
      id: topicID,
      label: topicID,
      summary: annotation.topic_summary,
      placeholder: annotation.placeholder,
      keyFacts: annotation.key_facts,
      createdAt,
    });
    map.topicOrder.push(topicID);
  }
  const topic = map.topics[topicID];
  topic.label = topicID;
  topic.summary = annotation.topic_summary;
  topic.placeholder = annotation.placeholder;
  topic.keyFacts = mergeUniqueStrings([
    ...topic.keyFacts,
    ...annotation.key_facts,
  ]);
  topic.lastActiveAt = Math.max(topic.lastActiveAt, createdAt);
  return topic;
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
  const topic = upsertTopicFromAnnotation(
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
      topicID: topic.id,
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
    assignMessageToTopic(input.map, topic.id, entry);
  }

  input.map.lastAnnotatedMessageID = input.assistantMessageID;
  input.map.updatedAt = Date.now();
  rebuildTotals(input.map);
  return input.map;
}

function upsertTopicFromRetroactive(
  map: ContextMapFile,
  item: RetroactiveAnnotationItem,
  createdAt: number,
) {
  const topicID = slugifyTopicLabel(item.topic);
  const existing = map.topics[topicID];
  if (!existing) {
    map.topics[topicID] = createTopicEntry({
      id: topicID,
      label: topicID,
      summary: item.topic_summary ?? item.message_summary,
      placeholder:
        item.placeholder ??
        trimText(item.topic_summary ?? item.message_summary, 80),
      keyFacts: item.key_facts,
      createdAt,
    });
    map.topicOrder.push(topicID);
  }

  const topic = map.topics[topicID];
  if (item.topic_summary) topic.summary = item.topic_summary;
  if (item.placeholder) topic.placeholder = item.placeholder;
  topic.keyFacts = mergeUniqueStrings([...topic.keyFacts, ...item.key_facts]);
  topic.lastActiveAt = Math.max(topic.lastActiveAt, createdAt);
  return topic;
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
  const topic = upsertTopicFromRetroactive(input.map, input.item, createdAt);
  const current = input.map.messages[message.info.id];
  const entry = createMessageEntry({
    id: message.info.id,
    role: message.info.role,
    topicID: topic.id,
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
  assignMessageToTopic(input.map, topic.id, entry);
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
  suggestedTopicID?: string;
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
    suggestedTopicID: input.suggestedTopicID,
    suggestedTopicLabel: input.suggestedTopicID
      ? input.map.topics[input.suggestedTopicID]?.label
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
  const topicID =
    input.map.lastActiveTopicID ??
    slugifyTopicLabel(input.fallbackLabel ?? "working_set");
  if (!input.map.topics[topicID]) {
    input.map.topics[topicID] = createTopicEntry({
      id: topicID,
      label: topicID,
      summary,
      placeholder: trimText(summary, 80),
      createdAt: getMessageCreatedAt(assistant),
    });
    input.map.topicOrder.push(topicID);
  }

  const annotation: AnnotationPayload = {
    topic: topicID,
    is_new_topic: false,
    message_summary: summary,
    topic_summary: input.map.topics[topicID].summary || summary,
    placeholder: input.map.topics[topicID].placeholder || trimText(summary, 80),
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
  let activeTopicID = map.lastActiveTopicID;
  for (const message of messages) {
    if (map.messages[message.info.id]) {
      activeTopicID = map.messages[message.info.id]?.topicID ?? activeTopicID;
      continue;
    }

    if (!activeTopicID) {
      const seed = slugifyTopicLabel(
        labelFromSummary(
          deriveSummaryFromMessage(message),
          map.topicOrder.length + 1,
        ),
      );
      map.topics[seed] = createTopicEntry({
        id: seed,
        label: seed,
        summary: deriveSummaryFromMessage(message),
        placeholder: trimText(deriveSummaryFromMessage(message), 80),
        createdAt: getMessageCreatedAt(message),
      });
      map.topicOrder.push(seed);
      activeTopicID = seed;
    }

    const entry = createMessageEntry({
      id: message.info.id,
      role: message.info.role,
      topicID: activeTopicID,
      summary: deriveSummaryFromMessage(message),
      tokenEstimate: estimateTokensFromParts(message.parts),
      createdAt: getMessageCreatedAt(message),
      updatedAt: Date.now(),
      source: "derived",
      partTypes: message.parts.map((part) => part.type),
      toolNames: extractToolNames(message.parts),
    });
    assignMessageToTopic(map, activeTopicID, entry);
    map.topics[activeTopicID].summary ||= entry.summary;
    map.topics[activeTopicID].placeholder ||= trimText(entry.summary, 80);
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
    compaction: existing.compaction ?? fresh.compaction,
    settings: {
      ...fresh.settings,
      ...existing.settings,
    },
    topics: { ...fresh.topics },
    messages: { ...fresh.messages },
    pendingRetroactive: { ...existing.pendingRetroactive },
  };

  for (const topicID of existing.topicOrder) {
    const prior = existing.topics[topicID];
    if (!prior) continue;
    const next = merged.topics[topicID];
    if (!next) {
      merged.topics[topicID] = structuredClone(prior);
      if (!merged.topicOrder.includes(topicID)) merged.topicOrder.push(topicID);
      continue;
    }
    merged.topics[topicID] = {
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
      topicID:
        prior.source === "annotation" && prior.topicID
          ? prior.topicID
          : next.topicID,
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

export function updateTopicFidelity(input: {
  map: ContextMapFile;
  topicID: string;
  fidelity: TopicFidelity;
  source: ControlSource;
  force?: boolean;
}) {
  const topic = input.map.topics[input.topicID];
  if (!topic)
    return { ok: false as const, message: `Unknown topic: ${input.topicID}` };
  if (
    topic.fidelitySource === "user" &&
    input.source === "agent" &&
    !input.force
  ) {
    return {
      ok: false as const,
      message: `Topic ${input.topicID} is user-controlled; refusing to override without force.`,
    };
  }
  topic.fidelity = topicFidelitySchema.parse(input.fidelity);
  topic.fidelitySource = input.source;
  input.map.updatedAt = Date.now();
  return {
    ok: true as const,
    message: `Set ${input.topicID} to ${input.fidelity}.`,
  };
}

export function updateMessageControls(input: {
  map: ContextMapFile;
  messageID: string;
  hidden?: boolean;
  fidelityOverride?: MessageFidelity;
  source: ControlSource;
  force?: boolean;
}) {
  const message = input.map.messages[input.messageID];
  if (!message)
    return {
      ok: false as const,
      message: `Unknown message: ${input.messageID}`,
    };
  if (
    typeof input.hidden === "boolean" &&
    message.hiddenSource === "user" &&
    input.source === "agent" &&
    !input.force
  ) {
    return {
      ok: false as const,
      message: `Message ${input.messageID} hide control is user-controlled; refusing to override without force.`,
    };
  }
  if (
    input.fidelityOverride &&
    message.fidelitySource === "user" &&
    message.fidelityOverride !== "inherit" &&
    input.source === "agent" &&
    !input.force
  ) {
    return {
      ok: false as const,
      message: `Message ${input.messageID} fidelity is user-controlled; refusing to override without force.`,
    };
  }
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

export function buildPlaceholderText(map: ContextMapFile, topic: TopicEntry) {
  if (map.settings.stablePlaceholders)
    return `[Context hidden: ${topic.label}]`;
  const head = `[${topic.label} - ~${topic.tokenEstimate.toLocaleString()} tok: ${topic.placeholder}]`;
  if (!map.settings.placeholderIncludesKeyFacts || topic.keyFacts.length === 0)
    return head;
  return `${head}\nKey facts: ${topic.keyFacts.join("; ")}`;
}

export function buildTopicSummaryText(topic: TopicEntry) {
  const facts =
    topic.keyFacts.length > 0
      ? `\nKey facts: ${topic.keyFacts.join("; ")}`
      : "";
  return `[Topic summary: ${topic.label}] ${topic.summary}${facts}`;
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
        "view_context",
        "set_fidelity",
        "session_lookup",
        "session_detail",
        "message_detail",
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

function chooseTopicAnchorIndex(
  messages: MessageLike[],
  indexes: number[],
  stableAnchors: boolean,
) {
  if (stableAnchors) {
    return (
      indexes.find((index) => messages[index]?.info.role === "assistant") ??
      indexes[0]!
    );
  }
  const assistantIndex = [...indexes]
    .reverse()
    .find((index) => messages[index]?.info.role === "assistant");
  return assistantIndex ?? indexes[indexes.length - 1]!;
}

export function transformMessagesForContext(
  messages: MessageLike[],
  map: ContextMapFile,
) {
  const activeMessages = filterMessagesForActiveContext(map, messages);
  const topicIndexes = new Map<string, number[]>();
  activeMessages.forEach((message, index) => {
    const entry = map.messages[message.info.id];
    if (!entry?.topicID) return;
    const topic = map.topics[entry.topicID];
    if (!topic) return;
    if (topic.fidelity !== "compressed" && topic.fidelity !== "placeholder")
      return;
    const list = topicIndexes.get(topic.id) ?? [];
    list.push(index);
    topicIndexes.set(topic.id, list);
  });

  const anchorIndexByTopic = new Map<string, number>();
  for (const [topicID, indexes] of topicIndexes) {
    anchorIndexByTopic.set(
      topicID,
      chooseTopicAnchorIndex(
        activeMessages,
        indexes,
        map.settings.stableAnchors,
      ),
    );
  }

  const output: MessageLike[] = [];

  for (let index = 0; index < activeMessages.length; index++) {
    const message = activeMessages[index]!;
    const base: MessageLike = {
      ...message,
      parts: cleanupToolParts(map, message.parts),
    };

    const entry = map.messages[message.info.id];
    const topic = entry?.topicID ? map.topics[entry.topicID] : undefined;

    if (!entry || !topic) {
      output.push(base);
      continue;
    }

    if (topic.fidelity === "compressed") {
      if (anchorIndexByTopic.get(topic.id) !== index) continue;
      output.push(replaceMessageWithText(base, buildTopicSummaryText(topic)));
      continue;
    }

    if (topic.fidelity === "placeholder") {
      if (anchorIndexByTopic.get(topic.id) !== index) continue;
      output.push(
        replaceMessageWithText(base, buildPlaceholderText(map, topic)),
      );
      continue;
    }

    if (entry.hidden) continue;

    if (topic.fidelity === "hidden") {
      if (entry.fidelityOverride === "full") {
        output.push(base);
        continue;
      }
      if (entry.fidelityOverride === "summary") {
        output.push(
          replaceMessageWithText(base, buildMessageSummaryText(entry)),
        );
        continue;
      }
      continue;
    }

    if (topic.fidelity === "summary") {
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
  const ordered = map.topicOrder
    .map((topicID) => map.topics[topicID])
    .filter(Boolean)
    .sort((a, b) => b.lastActiveAt - a.lastActiveAt)
    .slice(0, limit);

  if (ordered.length === 0) return "No topics have been identified yet.";

  return ordered
    .map((topic) => {
      const fidelityLabel = topic.fidelity;
      const source =
        topic.fidelitySource === "user"
          ? "user-set"
          : topic.fidelitySource === "default"
            ? "auto"
            : `${topic.fidelitySource}-set`;
      return `- ${topic.label} [${fidelityLabel}, ${source}, ~${topic.tokenEstimate.toLocaleString()} tok, ${topic.messageIDs.length} messages]: ${topic.placeholder}`;
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
    "Earlier assistant messages still need retroactive labeling. Include one retroactive item for each message_id listed below, even if it belongs to the same topic as the current response.",
    ...pending.map((item) => {
      const guess =
        item.suggestedTopicLabel ?? item.suggestedTopicID ?? "unknown";
      const tools =
        item.toolNames.length > 0 ? ` tools=${item.toolNames.join(",")}` : "";
      return `- message_id=${item.messageID} suggested_topic=${guess}${tools} summary=${item.summary}`;
    }),
  ];
}

export function buildPluginGuidanceSystemPrompt(map: ContextMapFile) {
  const totalTokens = map.topicOrder.reduce((s, id) => {
    const topic = map.topics[id];
    return s + (topic ? topic.tokenEstimate : 0);
  }, 0);
  const topicCount = map.topicOrder.length;

  const lines = [
    "Context map plugin is active.",
    "User controls are authoritative: do not override user-set fidelity or hidden-message choices unless the user explicitly asks.",
    "Available tools: view_context (see topics and fidelity), set_fidelity (change detail level for a topic), session_tree (inspect parent/sub-agent lineage), session_lookup + session_detail + message_detail (progressively inspect past sessions), blame_lookup (find which session produced code).",
    "Historical investigation flow: use blame_lookup or session_lookup to find an OpenCode session; read the compressed summaries in overview.topics; call session_detail with detail='messages' for per-message summaries in a chosen topic; call message_detail for one full message only when necessary.",
    "Cache-aware context management: changing fidelity reshapes the next prompt and can reduce provider prompt-cache hits for unchanged later messages. Avoid small or frequent context edits. Use set_fidelity when an older topic is clearly stale or large enough that dropping/summarizing it is worth the one-time cache disruption.",
  ];

  if (totalTokens > 50_000 && topicCount >= 3) {
    lines.push(
      "",
      "CONTEXT MANAGEMENT: Total context is ~" +
        Math.round(totalTokens / 1000) +
        "k tokens across " +
        topicCount +
        " topics. Use set_fidelity to reduce older topics to 'summary' or 'hidden'. Prioritize topics not discussed in recent turns.",
    );
  } else if (totalTokens > 20_000 && topicCount >= 2) {
    lines.push(
      "",
      "Context is at ~" +
        Math.round(totalTokens / 1000) +
        "k tokens. No action needed yet, but keep set_fidelity in mind as the conversation grows.",
    );
  }

  lines.push("", "Current context overview:", buildCurrentContextOverview(map));

  return lines.join("\n");
}

export function buildAnnotationSystemPrompt(map: ContextMapFile) {
  const existing = map.topicOrder
    .map((topicID) => map.topics[topicID])
    .filter(Boolean);
  const labels =
    existing.length > 0
      ? existing.map((topic) => topic.label).join(", ")
      : "none yet";
  return [
    "Mandatory annotation requirement for this session:",
    "1. Write the normal user-facing response first.",
    "2. Immediately append exactly one <annotation>...</annotation> block after the response.",
    "3. The annotation must contain valid JSON with top-level keys current and retroactive.",
    "4. Do not use markdown fences around the annotation. Do not explain the annotation. Do not skip it.",
    "5. topic must be a stable snake_case label. Reuse an existing topic whenever the conversation returns to an earlier topic.",
    "6. message_summary describes only this assistant message. topic_summary describes the running state of the whole topic so far.",
    "7. placeholder is a short 5-10 word stub. key_facts contains only facts or decisions worth preserving through compression.",
    "8. current must contain the full annotation for this assistant response. retroactive must contain per-message annotations for any earlier pending assistant messages listed below.",
    "Required format:",
    '<annotation>{"current":{"topic":"auth_debugging","is_new_topic":false,"message_summary":"Explained why the mutex failed and the queue replaced it.","topic_summary":"Investigated auth rate limiter race condition and switched from mutex to async queue after tests failed.","placeholder":"Debugging auth rate limiter race condition","key_facts":["mutex failed tests","async queue on line 42"]},"retroactive":[{"message_id":"msg_tool_1","topic":"auth_debugging","message_summary":"Ran auth concurrency tests and reproduced the mutex failure.","key_facts":["mutex failed tests"]}]}</annotation>',
    `Existing topic labels: ${labels}`,
    ...buildPendingRetroactivePrompt(map),
  ].join("\n");
}

export function buildCompactionPrompt(map: ContextMapFile) {
  const topics = map.topicOrder
    .map((topicID) => map.topics[topicID])
    .filter(Boolean);
  const policy =
    topics.length === 0
      ? "- No topic map exists yet; summarize the conversation normally."
      : topics
          .map((topic) => {
            const src = topic.fidelitySource === "user" ? " (USER-SET)" : "";
            const prefix = `- ${topic.label} [${topic.fidelity}${src}]`;
            switch (topic.fidelity) {
              case "full":
                return `${prefix}: preserve detailed decisions, file-level specifics, and key code snippets.`;
              case "summary":
                return `${prefix}: compress to a chronological list of decisions and key facts. Omit code details.`;
              case "compressed":
                return `${prefix}: compress to one paragraph preserving only the most critical facts.`;
              case "placeholder":
                return `${prefix}: already stubbed in context. Include only a one-line reminder if critical.`;
              case "hidden":
                return `${prefix}: already hidden from context. Omit entirely unless needed to avoid contradiction.`;
            }
          })
          .join("\n");

  return [
    "Provide a detailed prompt for continuing this conversation.",
    "The messages you see have ALREADY been transformed by the context map:",
    "- Hidden topics are removed. Placeholder topics are stubbed. Summary topics show summaries.",
    "- Your job is to produce a continuation prompt that preserves the RIGHT level of detail per topic.",
    "- User-set fidelity choices have the HIGHEST priority. Do not add detail to topics the user chose to compress.",
    "",
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
  const topics = map.topicOrder
    .map((topicID) => map.topics[topicID])
    .filter(Boolean);
  return {
    session_id: map.sessionID,
    total_token_estimate: map.totalTokenEstimate,
    controls: {
      user_controls_are_authoritative: true,
      fidelity_levels: ["full", "summary", "hidden"],
    },
    topics: topics.map((topic) => ({
      id: topic.id,
      label: topic.label,
      summary: topic.summary,
      placeholder: topic.placeholder,
      key_facts: topic.keyFacts,
      fidelity: topic.fidelity,
      fidelity_source:
        topic.fidelitySource === "default" ? "auto" : topic.fidelitySource,
      token_estimate: topic.tokenEstimate,
      message_count: topic.messageIDs.length,
      last_active_at: topic.lastActiveAt,
    })),
    messages: Object.values(map.messages)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((message) => ({
        id: message.id,
        role: message.role,
        topic_id: message.topicID,
        summary: message.summary,
        hidden: message.hidden,
        fidelity_override: message.fidelityOverride,
        token_estimate: message.tokenEstimate,
      })),
    pending_retroactive: Object.values(map.pendingRetroactive)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((item) => ({
        message_id: item.messageID,
        summary: item.summary,
        tool_names: item.toolNames,
        suggested_topic_id: item.suggestedTopicID,
        suggested_topic_label: item.suggestedTopicLabel,
      })),
  };
}

export function buildHistoricalOverview(input: {
  map: ContextMapFile;
  session: SessionLike;
  commitEntry?: CommitMapEntry;
  matchedTopicIDs?: string[];
}): HistoricalSessionOverview {
  const activeTopicIDs = new Set(
    input.commitEntry?.activeTopicIDs?.length
      ? input.commitEntry.activeTopicIDs
      : input.commitEntry?.activeTopicID
        ? [input.commitEntry.activeTopicID]
        : [],
  );
  return {
    sessionID: input.session.id,
    title: input.session.title ?? input.session.id,
    updatedAt: input.session.time?.updated,
    matchedTopicIDs: input.matchedTopicIDs ?? [],
    topics: input.map.topicOrder
      .map((topicID) => input.map.topics[topicID])
      .filter(Boolean)
      .map((topic) => ({
        id: topic.id,
        label: topic.label,
        summary: topic.summary,
        compressedSummary: buildTopicSummaryText(topic),
        placeholder: topic.placeholder,
        tokenEstimate: topic.tokenEstimate,
        messageCount: topic.messageIDs.length,
        fidelity: topic.fidelity,
        keyFacts: topic.keyFacts,
        activeForCommit: activeTopicIDs.has(topic.id),
      })),
  };
}

export function buildTopicMessageSummaries(input: {
  map: ContextMapFile;
  topicID: string;
}) {
  const topic = input.map.topics[input.topicID];
  if (!topic)
    return { ok: false as const, error: `Unknown topic: ${input.topicID}` };
  return {
    ok: true as const,
    topic: {
      id: topic.id,
      label: topic.label,
      compressedSummary: buildTopicSummaryText(topic),
      tokenEstimate: topic.tokenEstimate,
      messageCount: topic.messageIDs.length,
    },
    messages: topic.messageIDs
      .map((messageID) => input.map.messages[messageID])
      .filter(Boolean)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((message) => ({
        id: message.id,
        role: message.role,
        summary: message.summary,
        keyFacts: message.keyFacts,
        tokenEstimate: message.tokenEstimate,
        hidden: message.hidden,
        fidelityOverride: message.fidelityOverride,
        createdAt: message.createdAt,
      })),
  };
}

export function buildMessageDetail(input: {
  map: ContextMapFile;
  messageID: string;
  messages: MessageLike[];
}) {
  const entry = input.map.messages[input.messageID];
  const message = input.messages.find(
    (item) => item.info.id === input.messageID,
  );
  if (!entry || !message) {
    return {
      ok: false as const,
      error: `Unknown message: ${input.messageID}`,
    };
  }
  const topic = entry.topicID ? input.map.topics[entry.topicID] : undefined;
  return {
    ok: true as const,
    message: {
      id: entry.id,
      role: entry.role,
      topicID: entry.topicID,
      topicLabel: topic?.label,
      summary: entry.summary,
      keyFacts: entry.keyFacts,
      tokenEstimate: entry.tokenEstimate,
      createdAt: entry.createdAt,
      parts: message.parts.map((part) => {
        if (part.type === "text" || part.type === "reasoning") {
          return {
            id: part.id,
            type: part.type,
            text: part.text ?? "",
          };
        }
        if (part.type === "tool") {
          return {
            id: part.id,
            type: part.type,
            tool: part.tool,
            callID: part.callID,
            title: part.state?.title,
            status: part.state?.status,
            input: part.state?.input,
            output: part.state?.output,
            metadata: part.state?.metadata,
          };
        }
        return {
          id: part.id,
          type: part.type,
          filename: part.filename,
          url: part.url,
          metadata: part.metadata,
        };
      }),
    },
  };
}

export function buildSessionZoomText(input: {
  map: ContextMapFile;
  topicID: string;
  fidelity: "compressed" | "full";
  messages?: MessageLike[];
}) {
  const topic = input.map.topics[input.topicID];
  if (!topic) return `Unknown topic: ${input.topicID}`;
  if (input.fidelity === "compressed") return buildTopicSummaryText(topic);
  const relevant = (input.messages ?? []).filter((message) =>
    topic.messageIDs.includes(message.info.id),
  );
  if (relevant.length === 0)
    return `No full messages found for topic ${input.topicID}.`;
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

  let currentTopicID: string | undefined;
  for (const message of input.messages) {
    const summary = deriveSummaryFromMessage(message);
    if (!currentTopicID || message.info.role === "user") {
      currentTopicID = shouldStartFreshFallbackTopic(summary)
        ? undefined
        : findBestTopicForSummary(map, summary);
      if (!currentTopicID) {
        const baseTopicID = slugifyTopicLabel(
          labelFromSummary(summary, map.topicOrder.length + 1),
        );
        currentTopicID = nextAvailableTopicID(map, baseTopicID);
        map.topics[currentTopicID] = createTopicEntry({
          id: currentTopicID,
          label: currentTopicID,
          summary,
          placeholder: trimText(summary, 80),
          createdAt: getMessageCreatedAt(message),
          fidelity: "full",
          fidelitySource: "system",
        });
        map.topicOrder.push(currentTopicID);
      }
    }

    const entry = createMessageEntry({
      id: message.info.id,
      role: message.info.role,
      topicID: currentTopicID,
      summary,
      tokenEstimate: estimateTokensFromParts(message.parts),
      createdAt: getMessageCreatedAt(message),
      updatedAt: Date.now(),
      source: "derived",
      partTypes: message.parts.map((part) => part.type),
      toolNames: extractToolNames(message.parts),
    });
    assignMessageToTopic(map, currentTopicID, entry);
    const topic = map.topics[currentTopicID];
    topic.summary = mergeTopicSummary(topic.summary, summary);
    topic.placeholder = trimText(topic.summary, 80);
  }

  rebuildTotals(map);
  return map;
}

function shouldStartFreshFallbackTopic(summary: string) {
  const lowered = summary.toLowerCase();
  if (/\b(return|back|resume|revisit)\b/.test(lowered)) return false;
  return (
    /\b(?:switch|change|shift|move)\s+(?:topics?|gears)\b/.test(lowered) ||
    /\b(?:new|different|separate|unrelated)\s+topic\b/.test(lowered)
  );
}

function nextAvailableTopicID(map: ContextMapFile, baseTopicID: string) {
  if (!map.topics[baseTopicID]) return baseTopicID;
  let index = 2;
  while (map.topics[`${baseTopicID}_${index}`]) index += 1;
  return `${baseTopicID}_${index}`;
}

export function matchTopicIDsForQuery(map: ContextMapFile, query: string) {
  const words = keywordSet(query);
  const matches = map.topicOrder
    .map((topicID) => map.topics[topicID])
    .filter(Boolean)
    .map((topic) => ({ topicID: topic.id, score: scoreTopic(topic, words) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  return matches.map((item) => item.topicID);
}

function scoreTopic(topic: TopicEntry, words: Set<string>) {
  const haystack = keywordSet(
    `${topic.label} ${topic.summary} ${topic.placeholder} ${topic.keyFacts.join(" ")}`,
  );
  let score = 0;
  for (const word of words) {
    if (haystack.has(word)) score += 1;
  }
  return score;
}

function findBestTopicForSummary(map: ContextMapFile, summary: string) {
  const words = keywordSet(summary);
  let best: { topicID: string; score: number } | undefined;
  for (const topicID of map.topicOrder) {
    const topic = map.topics[topicID];
    if (!topic) continue;
    const score = scoreTopic(topic, words);
    if (score < 2) continue;
    if (!best || score > best.score) best = { topicID, score };
  }
  return best?.topicID;
}

function labelFromSummary(summary: string, index: number) {
  const fileMatch = summary.match(
    /(?:src|tests|docs|lib|packages)\/[\w./-]+\.[\w]+/,
  );
  if (fileMatch) {
    const filePath = fileMatch[0];
    const parts = filePath.split("/");
    const filename = parts[parts.length - 1]!.replace(/\.\w+$/, "");
    const parent = parts.length > 1 ? parts[parts.length - 2] : undefined;
    const label = parent ? `${parent}_${filename}` : filename;
    return label.slice(0, 30);
  }

  const stripped = summary
    .replace(
      /^(read|write|update|check|explain|look at|search|find|create|fix|debug|trace|review|run|add|remove|show|list|compare|design|implement)\s+/i,
      "",
    )
    .replace(/^(the|a|an|all|any|if|whether|how|why|what)\s+/i, "");

  const words = [...keywordSet(stripped)].slice(0, 3);
  if (words.length === 0) return `topic_${index}`;
  return words.join("_").slice(0, 30);
}

function mergeTopicSummary(current: string, next: string) {
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

export function formatTokens(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`;
  const millions = n / 1_000_000;
  return `${Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1)}M`;
}

export function computeContextPreview(map: ContextMapFile): ContextPreview {
  const topics: ContextPreviewTopic[] = [];
  let totalRaw = 0;
  let totalEffective = 0;
  const summaryTokenEstimate = (message?: MessageEntry) =>
    Math.min(message?.tokenEstimate ?? 0, 60);

  for (const topicID of map.topicOrder) {
    const topic = map.topics[topicID];
    if (!topic || topic.messageIDs.length === 0) continue;

    const msgCount = topic.messageIDs.length;
    const raw = topic.tokenEstimate;
    totalRaw += raw;

    let effective: number;
    let effectiveLabel: string;

    switch (topic.fidelity) {
      case "full": {
        const visibleMessages = topic.messageIDs
          .map((id) => map.messages[id])
          .filter((message) => message && !message.hidden);
        effective = visibleMessages.reduce((sum, m) => {
          if (m.fidelityOverride === "summary") {
            return sum + summaryTokenEstimate(m);
          }
          return sum + m.tokenEstimate;
        }, 0);
        effectiveLabel = `${visibleMessages.length} msgs ${formatTokens(effective)}`;
        break;
      }
      case "summary": {
        const visibleMessages = topic.messageIDs
          .map((id) => map.messages[id])
          .filter((message) => message && !message.hidden);
        effective = visibleMessages.reduce((sum, m) => {
          if (m.fidelityOverride === "full") return sum + m.tokenEstimate;
          return sum + summaryTokenEstimate(m);
        }, 0);
        effectiveLabel = `${visibleMessages.length} summaries`;
        break;
      }
      case "compressed":
        effective = Math.min(raw, 150);
        effectiveLabel = "1 paragraph";
        break;
      case "placeholder":
        effective = Math.min(raw, 30);
        effectiveLabel = "stub";
        break;
      case "hidden": {
        const visibleMessages = topic.messageIDs
          .map((id) => map.messages[id])
          .filter(
            (message) =>
              message &&
              !message.hidden &&
              message.fidelityOverride !== "inherit",
          );
        effective = visibleMessages.reduce((sum, m) => {
          if (m.fidelityOverride === "full") return sum + m.tokenEstimate;
          return sum + summaryTokenEstimate(m);
        }, 0);
        effectiveLabel =
          visibleMessages.length > 0
            ? `${visibleMessages.length} overrides`
            : "hidden";
        break;
      }
    }

    totalEffective += effective;
    topics.push({
      id: topicID,
      label: topic.label,
      fidelity: topic.fidelity,
      rawTokens: raw,
      effectiveTokens: effective,
      messageCount: msgCount,
      effectiveLabel,
    });
  }

  return { topics, totalRaw, totalEffective };
}

export function computeEffectiveTreatment(
  msg: MessageEntry,
  topic?: TopicEntry,
): string {
  if (!topic) return "unassigned";
  if (topic.fidelity === "placeholder") return "placeholder-stub";
  if (topic.fidelity === "compressed") return "compressed-paragraph";
  if (msg.hidden) return "hidden-message";
  if (topic.fidelity === "hidden") {
    if (msg.fidelityOverride === "full") return "kept-full";
    if (msg.fidelityOverride === "summary") return "summarized";
    return "hidden-by-topic";
  }
  if (topic.fidelity === "summary") {
    return msg.fidelityOverride === "full" ? "kept-full" : "summarized";
  }
  if (msg.fidelityOverride === "summary") return "summarized";
  return "kept-full";
}
