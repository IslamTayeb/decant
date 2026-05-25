import { z } from "zod";

export const topicFidelitySchema = z.enum([
  "full",
  "summary",
  "compressed",
  "placeholder",
  "hidden",
]);
export type TopicFidelity = z.infer<typeof topicFidelitySchema>;

export const messageFidelitySchema = z.enum(["inherit", "full", "summary"]);
export type MessageFidelity = z.infer<typeof messageFidelitySchema>;

export const controlSourceSchema = z.enum([
  "default",
  "user",
  "agent",
  "system",
]);
export type ControlSource = z.infer<typeof controlSourceSchema>;

export const annotationSchema = z.object({
  topic: z.string().min(1),
  is_new_topic: z.boolean().optional().default(false),
  message_summary: z.string().min(1),
  topic_summary: z.string().min(1),
  placeholder: z.string().min(1),
  key_facts: z.array(z.string().min(1)).optional().default([]),
});
export type AnnotationPayload = z.infer<typeof annotationSchema>;

export const retroactiveAnnotationItemSchema = z.object({
  message_id: z.string().min(1),
  topic: z.string().min(1),
  message_summary: z.string().min(1),
  key_facts: z.array(z.string().min(1)).optional().default([]),
  topic_summary: z.string().min(1).optional(),
  placeholder: z.string().min(1).optional(),
});
export type RetroactiveAnnotationItem = z.infer<
  typeof retroactiveAnnotationItemSchema
>;

export const annotationEnvelopeSchema = z.object({
  current: annotationSchema,
  retroactive: z.array(retroactiveAnnotationItemSchema).optional().default([]),
});
export type AnnotationEnvelope = z.infer<typeof annotationEnvelopeSchema>;

export type TopicEntry = {
  id: string;
  label: string;
  summary: string;
  placeholder: string;
  keyFacts: string[];
  fidelity: TopicFidelity;
  fidelitySource: ControlSource;
  messageIDs: string[];
  tokenEstimate: number;
  createdAt: number;
  lastActiveAt: number;
  commitHashes: string[];
};

export type MessageEntry = {
  id: string;
  role: "user" | "assistant";
  topicID?: string;
  summary: string;
  keyFacts: string[];
  hidden: boolean;
  hiddenSource: ControlSource;
  fidelityOverride: MessageFidelity;
  fidelitySource: ControlSource;
  tokenEstimate: number;
  createdAt: number;
  updatedAt: number;
  source: "annotation" | "derived";
  partTypes: string[];
  toolNames: string[];
};

export type ContextMapSettings = {
  placeholderIncludesKeyFacts: boolean;
  placeholderIncludesKeyFactsSource: ControlSource;
  toolHistoryCleanup: boolean;
  stablePlaceholders: boolean;
  stablePlaceholdersSource: ControlSource;
  stableAnchors: boolean;
  stableAnchorsSource: ControlSource;
};

export type PendingRetroactiveMessage = {
  messageID: string;
  summary: string;
  toolNames: string[];
  tokenEstimate: number;
  createdAt: number;
  suggestedTopicID?: string;
  suggestedTopicLabel?: string;
};

export type ContextMapCompactionState = {
  compactedAt: number;
  summaryMessageID: string;
  summaryTopicID: string;
  includeMessageID?: string;
  archivePath?: string;
};

export type ContextMapFile = {
  version: 1;
  sessionID: string;
  directory?: string;
  worktree?: string;
  createdAt: number;
  updatedAt: number;
  totalTokenEstimate: number;
  lastAnnotatedMessageID?: string;
  lastActiveTopicID?: string;
  settings: ContextMapSettings;
  topicOrder: string[];
  topics: Record<string, TopicEntry>;
  messages: Record<string, MessageEntry>;
  pendingRetroactive: Record<string, PendingRetroactiveMessage>;
  compaction?: ContextMapCompactionState;
};

export type CommitMapEntry = {
  commitHash: string;
  sessionID: string;
  timestamp: number;
  directory?: string;
  worktree?: string;
  activeTopicID?: string;
  activeTopicLabel?: string;
  activeTopicIDs?: string[];
  activeTopicLabels?: string[];
  commitSubject?: string;
  changedFiles?: string[];
};

export type CommitMapFile = {
  version: 1;
  updatedAt: number;
  entries: Record<string, CommitMapEntry>;
};

export type GitAiDecantState =
  | "raw_only"
  | "decanted"
  | "stale"
  | "unavailable";

export type GitAiDecantIndexEntry = {
  key: string;
  promptID: string;
  transcriptHash?: string;
  state: GitAiDecantState;
  updatedAt: number;
  schemaVersion: 1;
  mapSessionID?: string;
  summaryVersion?: string;
  sourceCommitHashes?: string[];
  tool?: string;
  model?: string;
  conversationID?: string;
  messagesURL?: string;
};

export type GitAiDecantIndexFile = {
  version: 1;
  updatedAt: number;
  entries: Record<string, GitAiDecantIndexEntry>;
};

export type SessionLike = {
  id: string;
  title?: string;
  parentID?: string;
  directory?: string;
  time?: {
    created?: number;
    updated?: number;
  };
};

export type MessageLike = {
  info: {
    id: string;
    role: "user" | "assistant";
    time?: {
      created?: number;
      updated?: number;
    };
    metadata?: {
      time?: {
        created?: number;
      };
    };
    summary?: boolean;
  };
  parts: Array<{
    id: string;
    sessionID?: string;
    messageID?: string;
    type: string;
    callID?: string;
    text?: string;
    filename?: string;
    url?: string;
    tool?: string;
    metadata?: Record<string, unknown>;
    state?: {
      status?: string;
      title?: string;
      output?: string;
      input?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    };
  }>;
};

export type HistoricalSessionOverview = {
  sessionID: string;
  title: string;
  updatedAt?: number;
  matchedTopicIDs: string[];
  topics: Array<{
    id: string;
    label: string;
    summary: string;
    compressedSummary: string;
    placeholder: string;
    tokenEstimate: number;
    messageCount: number;
    fidelity: TopicFidelity;
    keyFacts: string[];
    activeForCommit: boolean;
  }>;
};

export type ContextPreviewTopic = {
  id: string;
  label: string;
  fidelity: TopicFidelity;
  rawTokens: number;
  effectiveTokens: number;
  messageCount: number;
  effectiveLabel: string;
};

export type ContextPreview = {
  topics: ContextPreviewTopic[];
  totalRaw: number;
  totalEffective: number;
};
