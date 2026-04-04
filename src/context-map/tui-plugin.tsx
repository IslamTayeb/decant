/** @jsxImportSource @opentui/solid */

import { useKeyboard } from "@opentui/solid";
import type {
  TuiKeybindSet,
  TuiPlugin,
  TuiPluginApi,
  TuiPluginModule,
} from "@opencode-ai/plugin/tui";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";

import {
  buildHistoricalOverview,
  buildPlaceholderText,
  buildSessionZoomText,
  buildFallbackMapFromMessages,
  updateBlobFidelity,
  updateMessageControls,
} from "./core";
import {
  readCommitMap,
  readContextMap,
  sessionMapPath,
  writeContextMap,
} from "./storage";
import type {
  BlobEntry,
  BlobFidelity,
  ContextMapFile,
  HistoricalSessionOverview,
  MessageEntry,
  MessageLike,
} from "./types";

const PLUGIN_ID = "mem-mould.context-map-tui";
const execFileAsync = promisify(execFile);

const palette = [
  "primary",
  "secondary",
  "accent",
  "info",
  "success",
  "warning",
  "error",
] as const;

type Tab = "blobs" | "messages";

type HistoryState = {
  file: string;
  line: number;
  commitHash?: string;
  sessionID: string;
  overview: HistoricalSessionOverview;
};

function blobColor(api: TuiPluginApi, index: number) {
  return api.theme.current[palette[index % palette.length]];
}

function orderedBlobs(map?: ContextMapFile) {
  if (!map) return [] as BlobEntry[];
  return map.blobOrder.map((blobID) => map.blobs[blobID]).filter(Boolean);
}

function orderedMessages(map?: ContextMapFile) {
  if (!map) return [] as MessageEntry[];
  return Object.values(map.messages).sort((a, b) => a.createdAt - b.createdAt);
}

async function ensureHistoricalMap(api: TuiPluginApi, sessionID: string) {
  let map = await readContextMap({
    sessionID,
    directory: api.state.path.directory,
    worktree: api.state.path.worktree,
  });
  if (map.blobOrder.length > 0 || Object.keys(map.messages).length > 0)
    return map;
  const messages =
    (
      (await api.client.session.messages({
        sessionID,
        directory: api.state.path.directory,
        limit: 5000,
      })) as any
    )?.data ?? [];
  if (!Array.isArray(messages) || messages.length === 0) return map;
  map = buildFallbackMapFromMessages({
    sessionID,
    directory: api.state.path.directory,
    worktree: api.state.path.worktree,
    messages: messages as MessageLike[],
  });
  await writeContextMap(map);
  return map;
}

async function loadCurrentMap(api: TuiPluginApi, sessionID: string) {
  return readContextMap({
    sessionID,
    directory: api.state.path.directory,
    worktree: api.state.path.worktree,
  });
}

async function runBlameLookup(api: TuiPluginApi, input: string) {
  const [file, lineText] = input.split(":");
  const line = Number.parseInt(lineText ?? "", 10);
  if (!file || !Number.isFinite(line) || line < 1) {
    throw new Error("Use file:line, for example src/auth.ts:42");
  }

  const { stdout } = await execFileAsync(
    "git",
    ["blame", "-L", `${line},${line}`, "--", file],
    {
      cwd: api.state.path.worktree,
    },
  );
  const commitHash = stdout.trim().split(/\s+/)[0];
  if (!commitHash) throw new Error(`Could not resolve git blame for ${input}`);

  const commitMap = await readCommitMap();
  const entry = commitMap.entries[commitHash];
  if (!entry)
    throw new Error(`No session mapping found for commit ${commitHash}`);

  const map = await ensureHistoricalMap(api, entry.sessionID);
  const session =
    (
      (await api.client.session.get({
        sessionID: entry.sessionID,
        directory: api.state.path.directory,
      })) as any
    )?.data ?? {};
  return {
    file,
    line,
    commitHash,
    sessionID: entry.sessionID,
    overview: buildHistoricalOverview({
      map,
      session: session as any,
      commitEntry: entry,
      matchedBlobIDs: entry.activeBlobID ? [entry.activeBlobID] : [],
    }),
  } satisfies HistoryState;
}

function ContextBar(props: { api: TuiPluginApi; map?: ContextMapFile }) {
  const blobs = createMemo(() => orderedBlobs(props.map));
  const total = createMemo(() => {
    const sum = blobs().reduce((value, blob) => value + blob.tokenEstimate, 0);
    return Math.max(sum, 1);
  });
  const cells = 24;
  return (
    <box flexDirection="column" gap={1}>
      <box flexDirection="row">
        <For each={blobs()}>
          {(blob, index) => {
            const count = Math.max(
              1,
              Math.round((blob.tokenEstimate / total()) * cells),
            );
            return (
              <text fg={blobColor(props.api, index())}>
                {"█".repeat(count)}
              </text>
            );
          }}
        </For>
      </box>
      <For each={blobs()}>
        {(blob, index) => {
          const percent = Math.round((blob.tokenEstimate / total()) * 100);
          return (
            <box flexDirection="row" gap={1}>
              <text fg={blobColor(props.api, index())}>■</text>
              <text fg={props.api.theme.current.textMuted}>{blob.label}</text>
              <text fg={props.api.theme.current.textMuted}>{percent}%</text>
              <text fg={props.api.theme.current.textMuted}>
                [{blob.fidelity}]
              </text>
            </box>
          );
        }}
      </For>
    </box>
  );
}

function SidebarView(props: { api: TuiPluginApi; sessionID: string }) {
  const [map, setMap] = createSignal<ContextMapFile>();
  const messageCount = createMemo(
    () => props.api.state.session.messages(props.sessionID).length,
  );
  createEffect(() => {
    messageCount();
    void loadCurrentMap(props.api, props.sessionID).then(setMap);
  });

  return (
    <Show when={map() && orderedBlobs(map()).length > 0}>
      <box flexDirection="column" gap={1}>
        <text fg={props.api.theme.current.text}>
          <b>Mem Map</b>
        </text>
        <ContextBar api={props.api} map={map()} />
        <text fg={props.api.theme.current.textMuted}>
          {props.api.keybind.print("plugin.mem_map_open")} open
        </text>
      </box>
    </Show>
  );
}

function BlobRow(props: {
  api: TuiPluginApi;
  blob: BlobEntry;
  selected: boolean;
  index: number;
  onSelect: () => void;
  onFidelity: (fidelity: BlobFidelity) => void;
}) {
  const theme = () => props.api.theme.current;
  const bg = () =>
    props.selected ? theme().backgroundElement : theme().backgroundPanel;
  const options: BlobFidelity[] = [
    "full",
    "summary",
    "compressed",
    "placeholder",
    "drop",
  ];
  return (
    <box
      flexDirection="column"
      border
      borderColor={props.selected ? theme().borderActive : theme().border}
      backgroundColor={bg()}
      paddingLeft={1}
      paddingRight={1}
      paddingTop={1}
      paddingBottom={1}
      onMouseUp={props.onSelect}
      gap={1}
    >
      <box flexDirection="row" justifyContent="space-between">
        <box flexDirection="row" gap={1}>
          <text fg={blobColor(props.api, props.index)}>■</text>
          <text fg={theme().text}>{props.blob.label}</text>
        </box>
        <text fg={theme().textMuted}>
          ~{props.blob.tokenEstimate.toLocaleString()} tok
        </text>
      </box>
      <text fg={theme().textMuted}>{props.blob.placeholder}</text>
      <box flexDirection="row" gap={1}>
        <For each={options}>
          {(fidelity) => (
            <box
              backgroundColor={
                props.blob.fidelity === fidelity
                  ? theme().accent
                  : theme().border
              }
              paddingLeft={1}
              paddingRight={1}
              onMouseUp={() => props.onFidelity(fidelity)}
            >
              <text
                fg={
                  props.blob.fidelity === fidelity
                    ? theme().selectedListItemText
                    : theme().text
                }
              >
                {fidelity[0]}
              </text>
            </box>
          )}
        </For>
        <text fg={theme().textMuted}>{props.blob.fidelitySource}</text>
      </box>
    </box>
  );
}

function MessageRow(props: {
  api: TuiPluginApi;
  message: MessageEntry;
  selected: boolean;
  onSelect: () => void;
  onToggleHidden: () => void;
  onSummary: () => void;
  onFull: () => void;
  onInherit: () => void;
}) {
  const theme = () => props.api.theme.current;
  return (
    <box
      flexDirection="column"
      border
      borderColor={props.selected ? theme().borderActive : theme().border}
      backgroundColor={
        props.selected ? theme().backgroundElement : theme().backgroundPanel
      }
      paddingLeft={1}
      paddingRight={1}
      paddingTop={1}
      paddingBottom={1}
      gap={1}
      onMouseUp={props.onSelect}
    >
      <box flexDirection="row" justifyContent="space-between">
        <text fg={theme().text}>
          {props.message.id.slice(0, 10)} [{props.message.role}]
        </text>
        <text fg={theme().textMuted}>
          {props.message.hidden ? "hidden" : props.message.fidelityOverride}
        </text>
      </box>
      <text fg={theme().textMuted}>{props.message.summary}</text>
      <box flexDirection="row" gap={1}>
        <box
          backgroundColor={theme().border}
          paddingLeft={1}
          paddingRight={1}
          onMouseUp={props.onToggleHidden}
        >
          <text fg={theme().text}>
            {props.message.hidden ? "show" : "hide"}
          </text>
        </box>
        <box
          backgroundColor={theme().border}
          paddingLeft={1}
          paddingRight={1}
          onMouseUp={props.onInherit}
        >
          <text fg={theme().text}>i</text>
        </box>
        <box
          backgroundColor={theme().border}
          paddingLeft={1}
          paddingRight={1}
          onMouseUp={props.onFull}
        >
          <text fg={theme().text}>f</text>
        </box>
        <box
          backgroundColor={theme().border}
          paddingLeft={1}
          paddingRight={1}
          onMouseUp={props.onSummary}
        >
          <text fg={theme().text}>s</text>
        </box>
      </box>
    </box>
  );
}

function MemMapDialog(props: { api: TuiPluginApi; sessionID: string }) {
  const [map, setMap] = createSignal<ContextMapFile>();
  const [tab, setTab] = createSignal<Tab>("blobs");
  const [blobIndex, setBlobIndex] = createSignal(0);
  const [messageIndex, setMessageIndex] = createSignal(0);
  const messageCount = createMemo(
    () => props.api.state.session.messages(props.sessionID).length,
  );

  const blobs = createMemo(() => orderedBlobs(map()));
  const messages = createMemo(() => orderedMessages(map()));
  const currentBlob = createMemo(
    () => blobs()[Math.min(blobIndex(), Math.max(0, blobs().length - 1))],
  );
  const currentMessage = createMemo(
    () =>
      messages()[Math.min(messageIndex(), Math.max(0, messages().length - 1))],
  );

  const reload = async () => {
    setMap(await loadCurrentMap(props.api, props.sessionID));
  };

  const setFidelity = async (fidelity: BlobFidelity) => {
    const blob = currentBlob();
    if (!blob || !map()) return;
    const next = structuredClone(map()!);
    updateBlobFidelity({
      map: next,
      blobID: blob.id,
      fidelity,
      source: "user",
      force: true,
    });
    await writeContextMap(next);
    setMap(next);
  };

  const patchMessage = async (
    kind: "toggle_hidden" | "summary" | "full" | "inherit",
  ) => {
    const message = currentMessage();
    if (!message || !map()) return;
    const next = structuredClone(map()!);
    if (kind === "toggle_hidden") {
      updateMessageControls({
        map: next,
        messageID: message.id,
        hidden: !message.hidden,
        source: "user",
      });
    }
    if (kind === "summary") {
      updateMessageControls({
        map: next,
        messageID: message.id,
        fidelityOverride: "summary",
        source: "user",
      });
    }
    if (kind === "full") {
      updateMessageControls({
        map: next,
        messageID: message.id,
        fidelityOverride: "full",
        source: "user",
      });
    }
    if (kind === "inherit") {
      updateMessageControls({
        map: next,
        messageID: message.id,
        fidelityOverride: "inherit",
        source: "user",
      });
    }
    await writeContextMap(next);
    setMap(next);
  };

  const toggleFacts = async () => {
    if (!map()) return;
    const next = structuredClone(map()!);
    next.settings.placeholderIncludesKeyFacts =
      !next.settings.placeholderIncludesKeyFacts;
    next.settings.placeholderIncludesKeyFactsSource = "user";
    next.updatedAt = Date.now();
    await writeContextMap(next);
    setMap(next);
  };

  createEffect(() => {
    messageCount();
    void reload();
  });

  useKeyboard((evt) => {
    if (!props.api.ui.dialog.open) return;
    if (evt.name === "escape" || evt.name === "q") {
      evt.preventDefault();
      evt.stopPropagation();
      props.api.ui.dialog.clear();
      return;
    }
    if (evt.name === "left" || evt.name === "h") {
      evt.preventDefault();
      evt.stopPropagation();
      setTab("blobs");
      return;
    }
    if (evt.name === "right" || evt.name === "l") {
      evt.preventDefault();
      evt.stopPropagation();
      setTab("messages");
      return;
    }
    if (evt.name === "up" || evt.name === "k") {
      evt.preventDefault();
      evt.stopPropagation();
      if (tab() === "blobs") setBlobIndex((value) => Math.max(0, value - 1));
      if (tab() === "messages")
        setMessageIndex((value) => Math.max(0, value - 1));
      return;
    }
    if (evt.name === "down" || evt.name === "j") {
      evt.preventDefault();
      evt.stopPropagation();
      if (tab() === "blobs")
        setBlobIndex((value) =>
          Math.min(Math.max(0, blobs().length - 1), value + 1),
        );
      if (tab() === "messages")
        setMessageIndex((value) =>
          Math.min(Math.max(0, messages().length - 1), value + 1),
        );
      return;
    }
    if (tab() === "blobs") {
      if (evt.name === "1") void setFidelity("full");
      if (evt.name === "2") void setFidelity("summary");
      if (evt.name === "3") void setFidelity("compressed");
      if (evt.name === "4") void setFidelity("placeholder");
      if (evt.name === "5") void setFidelity("drop");
      if (evt.name === "f") void toggleFacts();
      return;
    }
    if (tab() === "messages") {
      if (evt.name === "x") void patchMessage("toggle_hidden");
      if (evt.name === "s") void patchMessage("summary");
      if (evt.name === "f") void patchMessage("full");
      if (evt.name === "i") void patchMessage("inherit");
    }
  });

  return (
    <box flexDirection="column" gap={1} paddingLeft={1} paddingRight={1}>
      <text fg={props.api.theme.current.text}>
        <b>Mem Map</b>
        <span style={{ fg: props.api.theme.current.textMuted }}>
          {" "}
          {props.sessionID.slice(0, 12)}
        </span>
      </text>
      <ContextBar api={props.api} map={map()} />
      <box flexDirection="row" gap={1}>
        <box
          backgroundColor={
            tab() === "blobs"
              ? props.api.theme.current.accent
              : props.api.theme.current.border
          }
          paddingLeft={1}
          paddingRight={1}
        >
          <text
            fg={
              tab() === "blobs"
                ? props.api.theme.current.selectedListItemText
                : props.api.theme.current.text
            }
          >
            Blobs
          </text>
        </box>
        <box
          backgroundColor={
            tab() === "messages"
              ? props.api.theme.current.accent
              : props.api.theme.current.border
          }
          paddingLeft={1}
          paddingRight={1}
        >
          <text
            fg={
              tab() === "messages"
                ? props.api.theme.current.selectedListItemText
                : props.api.theme.current.text
            }
          >
            Messages
          </text>
        </box>
        <text fg={props.api.theme.current.textMuted}>
          f toggle placeholder facts
        </text>
      </box>
      <Show when={tab() === "blobs"}>
        <box flexDirection="column" gap={1}>
          <For each={blobs()}>
            {(blob, index) => (
              <BlobRow
                api={props.api}
                blob={blob}
                index={index()}
                selected={index() === blobIndex()}
                onSelect={() => setBlobIndex(index())}
                onFidelity={(fidelity) => {
                  setBlobIndex(index());
                  void setFidelity(fidelity);
                }}
              />
            )}
          </For>
        </box>
      </Show>
      <Show when={tab() === "messages"}>
        <box flexDirection="column" gap={1}>
          <For each={messages()}>
            {(message, index) => (
              <MessageRow
                api={props.api}
                message={message}
                selected={index() === messageIndex()}
                onSelect={() => setMessageIndex(index())}
                onToggleHidden={() => {
                  setMessageIndex(index());
                  void patchMessage("toggle_hidden");
                }}
                onSummary={() => {
                  setMessageIndex(index());
                  void patchMessage("summary");
                }}
                onFull={() => {
                  setMessageIndex(index());
                  void patchMessage("full");
                }}
                onInherit={() => {
                  setMessageIndex(index());
                  void patchMessage("inherit");
                }}
              />
            )}
          </For>
        </box>
      </Show>
      <text fg={props.api.theme.current.textMuted}>
        Arrows or hjkl move, 1-5 set blob fidelity, x hide, s summary, f full, i
        inherit, q close.
      </text>
    </box>
  );
}

function HistoryDialog(props: { api: TuiPluginApi; history: HistoryState }) {
  const [blobIndex, setBlobIndex] = createSignal(0);
  const [zoom, setZoom] = createSignal<"placeholder" | "compressed" | "full">(
    "placeholder",
  );
  const [content, setContent] = createSignal("");
  const [map, setMap] = createSignal<ContextMapFile>();

  const blobs = createMemo(() => props.history.overview.blobs);

  const loadContent = async (
    nextZoom: "placeholder" | "compressed" | "full",
  ) => {
    const selected =
      blobs()[Math.min(blobIndex(), Math.max(0, blobs().length - 1))];
    if (!selected) return;
    setZoom(nextZoom);
    const historicalMap = await ensureHistoricalMap(
      props.api,
      props.history.sessionID,
    );
    setMap(historicalMap);
    if (nextZoom === "placeholder") {
      setContent(
        buildPlaceholderText(historicalMap, historicalMap.blobs[selected.id]!),
      );
      return;
    }
    if (nextZoom === "compressed") {
      setContent(
        buildSessionZoomText({
          map: historicalMap,
          blobID: selected.id,
          fidelity: "compressed",
        }),
      );
      return;
    }
    const messages =
      (
        (await props.api.client.session.messages({
          sessionID: props.history.sessionID,
          directory: props.api.state.path.directory,
          limit: 5000,
        })) as any
      )?.data ?? [];
    setContent(
      buildSessionZoomText({
        map: historicalMap,
        blobID: selected.id,
        fidelity: "full",
        messages: messages as MessageLike[],
      }),
    );
  };

  createEffect(() => {
    void ensureHistoricalMap(props.api, props.history.sessionID).then(setMap);
  });

  createEffect(() => {
    blobIndex();
    zoom();
    void loadContent(zoom());
  });

  useKeyboard((evt) => {
    if (!props.api.ui.dialog.open) return;
    if (evt.name === "escape" || evt.name === "q") {
      evt.preventDefault();
      evt.stopPropagation();
      props.api.ui.dialog.clear();
      return;
    }
    if (evt.name === "up" || evt.name === "k") {
      evt.preventDefault();
      evt.stopPropagation();
      setBlobIndex((value) => Math.max(0, value - 1));
      return;
    }
    if (evt.name === "down" || evt.name === "j") {
      evt.preventDefault();
      evt.stopPropagation();
      setBlobIndex((value) =>
        Math.min(Math.max(0, blobs().length - 1), value + 1),
      );
      return;
    }
    if (evt.name === "3") void loadContent("compressed");
    if (evt.name === "f") void loadContent("full");
    if (evt.name === "p") void loadContent("placeholder");
  });

  return (
    <box flexDirection="column" gap={1} paddingLeft={1} paddingRight={1}>
      <text fg={props.api.theme.current.text}>
        <b>Historical Map</b>
        <span style={{ fg: props.api.theme.current.textMuted }}>
          {" "}
          {props.history.file}:{props.history.line}
        </span>
      </text>
      <Show when={map()}>
        <ContextBar api={props.api} map={map()} />
      </Show>
      <text fg={props.api.theme.current.textMuted}>
        Commit {props.history.commitHash}
      </text>
      <box flexDirection="row" gap={2}>
        <box flexDirection="column" gap={1} width="45%">
          <For each={blobs()}>
            {(blob, index) => (
              <box
                flexDirection="column"
                border
                borderColor={
                  index() === blobIndex()
                    ? props.api.theme.current.borderActive
                    : props.api.theme.current.border
                }
                backgroundColor={
                  index() === blobIndex()
                    ? props.api.theme.current.backgroundElement
                    : props.api.theme.current.backgroundPanel
                }
                paddingLeft={1}
                paddingRight={1}
                paddingTop={1}
                paddingBottom={1}
                onMouseUp={() => setBlobIndex(index())}
              >
                <box flexDirection="row" gap={1}>
                  <text fg={blobColor(props.api, index())}>■</text>
                  <text fg={props.api.theme.current.text}>{blob.label}</text>
                </box>
                <text fg={props.api.theme.current.textMuted}>
                  {blob.placeholder}
                </text>
                <Show when={blob.activeForCommit}>
                  <text fg={props.api.theme.current.warning}>
                    commit-linked
                  </text>
                </Show>
              </box>
            )}
          </For>
        </box>
        <box flexDirection="column" gap={1} width="55%">
          <box flexDirection="row" gap={1}>
            <text fg={props.api.theme.current.textMuted}>Zoom:</text>
            <text fg={props.api.theme.current.textMuted}>{zoom()}</text>
          </box>
          <box
            border
            borderColor={props.api.theme.current.border}
            paddingLeft={1}
            paddingRight={1}
            paddingTop={1}
            paddingBottom={1}
          >
            <text fg={props.api.theme.current.text}>{content()}</text>
          </box>
        </box>
      </box>
      <text fg={props.api.theme.current.textMuted}>
        j/k move, p placeholder, 3 compressed, f full, q close.
      </text>
    </box>
  );
}

const tui: TuiPlugin = async (api) => {
  const keys: TuiKeybindSet = api.keybind.create({
    plugin_mem_map_open: "<leader>'",
  });

  const openCurrentMap = (sessionID?: string) => {
    const activeSessionID = sessionID ?? currentSessionID(api);
    if (!activeSessionID) {
      api.ui.toast({ variant: "error", message: "No active session selected" });
      return;
    }
    api.ui.dialog.setSize("xlarge");
    api.ui.dialog.replace(() => (
      <MemMapDialog api={api} sessionID={activeSessionID} />
    ));
  };

  const openBlamePrompt = () => {
    const DialogPrompt = api.ui.DialogPrompt;
    api.ui.dialog.setSize("medium");
    api.ui.dialog.replace(() => (
      <DialogPrompt
        title="Open Historical Map"
        placeholder="src/auth.ts:42"
        onConfirm={(value) => {
          api.ui.dialog.clear();
          void runBlameLookup(api, value)
            .then((history) => {
              api.ui.dialog.setSize("xlarge");
              api.ui.dialog.replace(() => (
                <HistoryDialog api={api} history={history} />
              ));
            })
            .catch((error) => {
              api.ui.toast({
                variant: "error",
                message: error instanceof Error ? error.message : String(error),
              });
            });
        }}
        onCancel={() => {
          api.ui.dialog.clear();
        }}
      />
    ));
  };

  api.command.register(() => [
    {
      title: "Open context map",
      value: "context-map.open",
      category: "Plugin",
      keybind: keys.get("plugin_mem_map_open"),
      slash: { name: "mem-map" },
      onSelect: () => openCurrentMap(),
    },
    {
      title: "Open blame map",
      value: "context-map.blame",
      category: "Plugin",
      slash: { name: "blame" },
      onSelect: () => openBlamePrompt(),
    },
  ]);

  api.slots.register({
    order: 110,
    slots: {
      sidebar_content(_ctx, value) {
        return <SidebarView api={api} sessionID={value.session_id} />;
      },
    },
  });

  api.lifecycle.onDispose(() => {});
};

function currentSessionID(api: TuiPluginApi) {
  const current = api.route.current;
  if (current.name !== "session") return undefined;
  return typeof current.params?.sessionID === "string"
    ? current.params.sessionID
    : undefined;
}

const plugin: TuiPluginModule = {
  id: PLUGIN_ID,
  tui,
};

export default plugin;
