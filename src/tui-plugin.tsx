/** @jsxImportSource @opentui/solid */

import { createTextAttributes, type ScrollBoxRenderable } from "@opentui/core";
import { useKeyboard, useTerminalDimensions } from "@opentui/solid";
import type {
  TuiPlugin,
  TuiPluginApi,
  TuiPluginModule,
} from "@opencode-ai/plugin/tui";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";

import {
  buildSessionZoomText,
  computeContextPreview,
  formatTokens,
  updateTopicFidelity,
  updateMessageControls,
} from "./core";
import { writeContextMap } from "./storage";
import { askAgentAboutBlame, runBlame, type HistoryState } from "./tui-blame";
import {
  TOPIC_FIDELITY_LABEL,
  USER_SELECTABLE_TOPIC_FIDELITIES,
  color,
  currentSession,
  ensureHistorical,
  flatMessages,
  groupedSections,
  loadMap,
  orderedTopics,
  sectionColor,
  toMessageLikes,
  trim,
} from "./tui-helpers";
import type { TopicEntry, TopicFidelity, ContextMapFile } from "./types";

const PLUGIN_ID = "decant.context-map-tui";
const XLARGE_DIALOG_WIDTH = 116;
const DIALOG_MARGIN_WIDTH = 2;
const DIALOG_CONTENT_HORIZONTAL_PADDING = 4;
const SIDEBAR_WIDTH = 42;
const SIDEBAR_HORIZONTAL_PADDING = 4;
const SIDEBAR_CONTENT_WIDTH = SIDEBAR_WIDTH - SIDEBAR_HORIZONTAL_PADDING;
const HIDDEN_LEGEND_ATTRIBUTES = createTextAttributes({ italic: true });

type Tab = "topics" | "messages";

type KeymapLayer = {
  commands: Array<{
    name: string;
    title: string;
    category: string;
    desc: string;
    namespace: "palette";
    slashName: string;
    run: () => void;
  }>;
  bindings: Array<{
    key: string;
    cmd: string;
    desc: string;
  }>;
};

type KeymapLayerApi = {
  registerLayer(layer: KeymapLayer): void;
};

function isKeymapLayerApi(value: unknown): value is KeymapLayerApi {
  return (
    typeof value === "object" &&
    value !== null &&
    "registerLayer" in value &&
    typeof value.registerLayer === "function"
  );
}

function keymapLayerApi(api: TuiPluginApi): KeymapLayerApi | undefined {
  if (!("keymap" in api)) return undefined;
  return isKeymapLayerApi(api.keymap) ? api.keymap : undefined;
}

function dialogContentWidth(terminalWidth: number) {
  return Math.max(
    1,
    Math.min(XLARGE_DIALOG_WIDTH, terminalWidth - DIALOG_MARGIN_WIDTH) -
      DIALOG_CONTENT_HORIZONTAL_PADDING,
  );
}

function sidebarContentWidth(terminalWidth: number) {
  return Math.max(1, Math.min(SIDEBAR_CONTENT_WIDTH, terminalWidth - 6));
}

function contextShownText(totalEffective: number) {
  return `~${formatTokens(totalEffective)} shown`;
}

function contextUsageText(totalEffective: number, contextLimit: number) {
  if (contextLimit <= 0) return contextShownText(totalEffective);
  return `~${formatTokens(totalEffective)} / ${formatTokens(contextLimit)} (${Math.round((totalEffective / contextLimit) * 100)}%)`;
}

function contextSharePercent(effectiveTokens: number, totalEffective: number) {
  return `${Math.round((effectiveTokens / Math.max(1, totalEffective)) * 100)}%`;
}

function legendColor(api: TuiPluginApi, fidelity: TopicFidelity) {
  const theme = api.theme.current;
  if (fidelity === "full") return theme.text;
  if (fidelity === "hidden") return theme.border;
  return theme.textMuted;
}

function legendAttributes(fidelity: TopicFidelity) {
  return fidelity === "hidden" ? HIDDEN_LEGEND_ATTRIBUTES : 0;
}

function contextLimitForSession(api: TuiPluginApi, sessionID: string) {
  const msgs = api.state.session.messages(sessionID);
  const last = [...msgs]
    .reverse()
    .find((m) => m.role === "assistant" && m.tokens.output > 0);
  if (last?.role !== "assistant") return 0;
  if (!last?.providerID || !last?.modelID) return 0;
  const provider = api.state.provider.find((p) => p.id === last.providerID);
  return provider?.models[last.modelID]?.limit.context ?? 0;
}

function contextBarParts(
  topics: Array<{ effectiveTokens: number }>,
  totalEffective: number,
  requestedWidth: number,
) {
  const width = Math.max(1, Math.floor(requestedWidth));
  if (totalEffective <= 0) return [];
  const positiveCount = topics.filter(
    (topic) => topic.effectiveTokens > 0,
  ).length;
  const keepPositiveTopicsVisible = positiveCount <= width;
  const parts = topics.map((topic, i) => {
    const exact = (topic.effectiveTokens / totalEffective) * width;
    return {
      colorIndex: i,
      effectiveTokens: topic.effectiveTokens,
      width:
        topic.effectiveTokens > 0
          ? Math.max(keepPositiveTopicsVisible ? 1 : 0, Math.floor(exact))
          : 0,
      fraction: exact - Math.floor(exact),
    };
  });
  let used = parts.reduce((sum, part) => sum + part.width, 0);
  while (used > width) {
    const candidate = [...parts]
      .filter(
        (part) =>
          part.width >
          (keepPositiveTopicsVisible && part.effectiveTokens > 0 ? 1 : 0),
      )
      .sort(
        (a, b) =>
          a.fraction - b.fraction || a.effectiveTokens - b.effectiveTokens,
      )[0];
    if (!candidate) break;
    candidate.width--;
    used--;
  }
  while (used < width) {
    const candidate = [...parts]
      .filter((part) => part.effectiveTokens > 0)
      .sort(
        (a, b) =>
          b.fraction - a.fraction || b.effectiveTokens - a.effectiveTokens,
      )[0];
    if (!candidate) break;
    candidate.width++;
    used++;
  }
  return parts;
}

function ContextBar(props: {
  api: TuiPluginApi;
  map?: ContextMapFile;
  width?: number;
}) {
  const preview = createMemo(() =>
    props.map ? computeContextPreview(props.map) : undefined,
  );
  const totalEffective = createMemo(() =>
    Math.max(1, preview()?.totalEffective ?? 0),
  );
  const barWidth = createMemo(() => Math.max(1, Math.floor(props.width ?? 50)));
  const barParts = createMemo(() => {
    const p = preview();
    if (!p || p.totalEffective <= 0) return [];
    return contextBarParts(p.topics, totalEffective(), barWidth());
  });
  return (
    <box flexDirection="column">
      <box flexDirection="row" width={barWidth()} overflow="hidden">
        <For each={barParts()}>
          {(part) => (
            <Show when={part.width > 0}>
              <text
                fg={color(props.api, part.colorIndex)}
                width={part.width}
                wrapMode="none"
                truncate
              >
                {"\u2588".repeat(part.width)}
              </text>
            </Show>
          )}
        </For>
        <Show when={(preview()?.totalEffective ?? 0) === 0}>
          <text fg={props.api.theme.current.textMuted}>
            {"\u2591".repeat(barWidth())}
          </text>
        </Show>
      </box>
      <For each={preview()?.topics ?? []}>
        {(b, i) => (
          <text fg={legendColor(props.api, b.fidelity)}>
            <span style={{ fg: color(props.api, i()) }}>{"\u25A0"}</span>{" "}
            <span style={{ attributes: legendAttributes(b.fidelity) }}>
              {b.label} (
              {contextSharePercent(b.effectiveTokens, totalEffective())})
            </span>
          </text>
        )}
      </For>
    </box>
  );
}

function SidebarView(props: {
  api: TuiPluginApi;
  sessionID: string;
  onOpen?: () => void;
}) {
  const dimensions = useTerminalDimensions();
  useKeyboard((evt) => {
    if (!props.onOpen) return;
    if (evt.ctrl && evt.name === "g") {
      evt.preventDefault();
      evt.stopPropagation();
      props.onOpen();
    }
  });

  const [map, setMap] = createSignal<ContextMapFile>();
  const mc = createMemo(
    () => props.api.state.session.messages(props.sessionID).length,
  );
  const dialogOpen = createMemo(() => props.api.ui.dialog.open);
  createEffect(() => {
    mc();
    dialogOpen();
    void loadMap(props.api, props.sessionID).then(setMap);
  });

  const preview = createMemo(() => {
    const m = map();
    return m ? computeContextPreview(m) : undefined;
  });

  const contextLimit = createMemo(() =>
    contextLimitForSession(props.api, props.sessionID),
  );

  const topics = createMemo(() => orderedTopics(map()));
  const sidebarBarWidth = createMemo(() =>
    sidebarContentWidth(dimensions().width),
  );
  const sidebarBarParts = createMemo(() => {
    const p = preview();
    if (!p || p.totalEffective <= 0) return [];
    return contextBarParts(p.topics, p.totalEffective, sidebarBarWidth());
  });

  return (
    <box flexDirection="column">
      <Show when={map() && topics().length > 0}>
        <Show when={preview()}>
          <box flexDirection="column">
            <box
              flexDirection="row"
              justifyContent="space-between"
              width={sidebarBarWidth()}
            >
              <text fg={props.api.theme.current.text}>
                <b>Context Map</b>
              </text>
              <text fg={props.api.theme.current.textMuted}>
                {contextUsageText(preview()!.totalEffective, contextLimit())}
              </text>
            </box>
            <box
              flexDirection="row"
              width={sidebarBarWidth()}
              overflow="hidden"
            >
              <For each={sidebarBarParts()}>
                {(part) => (
                  <Show when={part.width > 0}>
                    <text
                      fg={color(props.api, part.colorIndex)}
                      width={part.width}
                      wrapMode="none"
                      truncate
                    >
                      {"\u2588".repeat(part.width)}
                    </text>
                  </Show>
                )}
              </For>
              <Show when={preview()!.totalEffective === 0}>
                <text fg={props.api.theme.current.textMuted}>
                  {"\u2591".repeat(sidebarBarWidth())}
                </text>
              </Show>
            </box>

            <For each={preview()!.topics}>
              {(b, i) => (
                <text fg={legendColor(props.api, b.fidelity)}>
                  <span style={{ fg: color(props.api, i()) }}>{"\u25A0"}</span>{" "}
                  <span style={{ attributes: legendAttributes(b.fidelity) }}>
                    {trim(b.label, 24)} (
                    {contextSharePercent(
                      b.effectiveTokens,
                      preview()!.totalEffective,
                    )}
                    )
                  </span>
                </text>
              )}
            </For>
          </box>
        </Show>
      </Show>
    </box>
  );
}

function ContextMapDialog(props: {
  api: TuiPluginApi;
  sessionID: string;
  close: () => void;
}) {
  const dimensions = useTerminalDimensions();
  let topicScroll: ScrollBoxRenderable | undefined;
  let messageScroll: ScrollBoxRenderable | undefined;
  const [map, setMap] = createSignal<ContextMapFile>();
  const [tab, setTab] = createSignal<Tab>("topics");
  const [bi, setBi] = createSignal(0);
  const [mi, setMi] = createSignal(0);
  const mc = createMemo(
    () => props.api.state.session.messages(props.sessionID).length,
  );
  const contextLimit = createMemo(() =>
    contextLimitForSession(props.api, props.sessionID),
  );

  const topics = createMemo(() => orderedTopics(map()));
  const secs = createMemo(() => groupedSections(map()));
  const msgs = createMemo(() => flatMessages(secs()));
  const curTopic = createMemo(
    () => topics()[Math.min(bi(), Math.max(0, topics().length - 1))],
  );
  const curMsg = createMemo(
    () => msgs()[Math.min(mi(), Math.max(0, msgs().length - 1))],
  );

  const reload = () => void loadMap(props.api, props.sessionID).then(setMap);

  const jumpToTopic = (id?: string) => {
    if (!id) return;
    const idx = msgs().findIndex((m) => m.topicID === id);
    if (idx !== -1) setMi(idx);
  };

  let writing = false;

  const setFidelity = async (f: TopicFidelity) => {
    const b = curTopic();
    if (!b || !map() || writing) return;
    writing = true;
    try {
      const next = structuredClone(map()!);
      updateTopicFidelity({
        map: next,
        topicID: b.id,
        fidelity: f,
        source: "user",
        force: true,
      });
      await writeContextMap(next);
      setMap(next);
    } finally {
      writing = false;
    }
  };

  const patchMsg = async (kind: "auto" | "full" | "summary" | "hidden") => {
    const m = curMsg();
    if (!m || !map() || writing) return;
    writing = true;
    try {
      const next = structuredClone(map()!);
      if (kind === "auto")
        updateMessageControls({
          map: next,
          messageID: m.id,
          hidden: false,
          fidelityOverride: "inherit",
          source: "user",
        });
      else if (kind === "full")
        updateMessageControls({
          map: next,
          messageID: m.id,
          hidden: false,
          fidelityOverride: "full",
          source: "user",
        });
      else if (kind === "summary")
        updateMessageControls({
          map: next,
          messageID: m.id,
          hidden: false,
          fidelityOverride: "summary",
          source: "user",
        });
      else if (kind === "hidden")
        updateMessageControls({
          map: next,
          messageID: m.id,
          hidden: true,
          fidelityOverride: "inherit",
          source: "user",
        });
      await writeContextMap(next);
      setMap(next);
    } finally {
      writing = false;
    }
  };

  createEffect(() => {
    mc();
    reload();
  });
  createEffect(() => {
    if (mi() > Math.max(0, msgs().length - 1))
      setMi(Math.max(0, msgs().length - 1));
    if (bi() > Math.max(0, topics().length - 1))
      setBi(Math.max(0, topics().length - 1));
  });

  useKeyboard((evt) => {
    const stop = () => {
      evt.preventDefault();
      evt.stopPropagation();
    };
    if (evt.name === "escape" || evt.name === "q") {
      stop();
      props.close();
      return;
    }
    if (evt.name === "tab") {
      stop();
      setTab(tab() === "topics" ? "messages" : "topics");
      if (tab() === "messages") jumpToTopic(curTopic()?.id);
      return;
    }
    if (evt.name === "up" || evt.name === "k") {
      stop();
      tab() === "topics"
        ? setBi((v) => Math.max(0, v - 1))
        : setMi((v) => Math.max(0, v - 1));
      return;
    }
    if (evt.name === "down" || evt.name === "j") {
      stop();
      tab() === "topics"
        ? setBi((v) => Math.min(topics().length - 1, v + 1))
        : setMi((v) => Math.min(msgs().length - 1, v + 1));
      return;
    }
    if (tab() === "topics") {
      if (evt.name === "1") {
        stop();
        void setFidelity("full");
        return;
      }
      if (evt.name === "2") {
        stop();
        void setFidelity("summary");
        return;
      }
      if (evt.name === "3") {
        stop();
        void setFidelity("hidden");
        return;
      }
    }
    if (tab() === "messages") {
      const curTopicEntry = curMsg()?.topicID
        ? map()?.topics[curMsg()!.topicID!]
        : undefined;
      if (curTopicEntry?.fidelity !== "placeholder") {
        if (evt.name === "h" || evt.name === "x") {
          stop();
          void patchMsg("hidden");
          return;
        }
        if (evt.name === "a") {
          stop();
          void patchMsg("auto");
          return;
        }
        if (evt.name === "f") {
          stop();
          void patchMsg("full");
          return;
        }
        if (evt.name === "s") {
          stop();
          void patchMsg("summary");
          return;
        }
      }
    }
  });

  const t = () => props.api.theme.current;

  const preview = createMemo(() => {
    const m = map();
    return m ? computeContextPreview(m) : undefined;
  });
  const effectiveTok = (topicID: string) => {
    const p = preview();
    if (!p) return 0;
    return p.topics.find((b) => b.id === topicID)?.effectiveTokens ?? 0;
  };

  const topicFidelityTag = (topic: TopicEntry) => {
    const m = map();
    if (!m) return `[${TOPIC_FIDELITY_LABEL[topic.fidelity]}]`;
    const overrides: Record<string, number> = {};
    for (const msgID of topic.messageIDs) {
      const msg = m.messages[msgID];
      if (!msg) continue;
      if (msg.hidden) overrides.hidden = (overrides.hidden ?? 0) + 1;
      else if (msg.fidelityOverride !== "inherit")
        overrides[msg.fidelityOverride] =
          (overrides[msg.fidelityOverride] ?? 0) + 1;
    }
    const parts = Object.entries(overrides).map(([k, v]) => `+${v} ${k}`);
    const base = TOPIC_FIDELITY_LABEL[topic.fidelity];
    return parts.length > 0 ? `[${base} ${parts.join(" ")}]` : `[${base}]`;
  };

  const topicIsCollapsed = (topic?: TopicEntry) =>
    topic?.fidelity === "placeholder";

  const maxListRows = createMemo(() =>
    Math.max(4, Math.floor(dimensions().height / 2) - 8),
  );
  const topicListRows = createMemo(() => {
    const rows = topics().length * 2 + (topics().length > 0 ? 1 : 0);
    return Math.max(1, Math.min(rows, maxListRows()));
  });
  const messageListRows = createMemo(() => {
    const rows = secs().length + msgs().length + (msgs().length > 0 ? 1 : 0);
    return Math.max(1, Math.min(rows, maxListRows()));
  });
  const contentWidth = createMemo(() => dialogContentWidth(dimensions().width));

  const topicRowID = (id: string) => `decant-topic:${id}`;
  const messageRowID = (id: string) => `decant-message:${id}`;
  createEffect(() => {
    const activeTab = tab();
    const selectedID = activeTab === "topics" ? curTopic()?.id : curMsg()?.id;
    const rowID = selectedID
      ? activeTab === "topics"
        ? topicRowID(selectedID)
        : messageRowID(selectedID)
      : undefined;
    if (!rowID) return;

    setTimeout(() => {
      const scroll = activeTab === "topics" ? topicScroll : messageScroll;
      if (!scroll || scroll.isDestroyed) return;
      scroll.scrollChildIntoView(rowID);
    }, 0);
  });

  return (
    <box
      flexDirection="column"
      paddingLeft={2}
      paddingRight={2}
      paddingBottom={1}
    >
      <box
        flexDirection="row"
        justifyContent="space-between"
        width={contentWidth()}
      >
        <text fg={t().text}>
          <b>Context Map</b>
        </text>
        <Show when={preview()}>
          <text fg={t().textMuted}>
            {contextUsageText(preview()!.totalEffective, contextLimit())}
          </text>
        </Show>
      </box>
      <ContextBar api={props.api} map={map()} width={contentWidth()} />

      <box flexDirection="row" gap={2} paddingTop={1}>
        <box
          backgroundColor={tab() === "topics" ? t().accent : t().border}
          paddingLeft={1}
          paddingRight={1}
          onMouseUp={() => setTab("topics")}
        >
          <text fg={tab() === "topics" ? t().selectedListItemText : t().text}>
            Topics
          </text>
        </box>
        <box
          backgroundColor={tab() === "messages" ? t().accent : t().border}
          paddingLeft={1}
          paddingRight={1}
          onMouseUp={() => {
            setTab("messages");
            jumpToTopic(curTopic()?.id);
          }}
        >
          <text fg={tab() === "messages" ? t().selectedListItemText : t().text}>
            Messages
          </text>
        </box>
        <text fg={t().textMuted}>tab to switch</text>
      </box>

      <Show when={tab() === "topics"}>
        <box flexDirection="column" paddingTop={1} paddingBottom={1}>
          <Show
            when={topics().length > 0}
            fallback={
              <text fg={t().textMuted}>
                No topics yet. Chat for a few turns first.
              </text>
            }
          >
            <scrollbox
              ref={(r: ScrollBoxRenderable) => (topicScroll = r)}
              maxHeight={topicListRows()}
              verticalScrollbarOptions={{
                trackOptions: {
                  backgroundColor: t().backgroundElement,
                  foregroundColor: t().border,
                },
              }}
              viewportOptions={{ paddingRight: 1 }}
            >
              <box flexDirection="column">
                <For each={topics()}>
                  {(topic, idx) => {
                    const sel = () => idx() === bi();
                    return (
                      <box
                        id={topicRowID(topic.id)}
                        flexDirection="column"
                        backgroundColor={
                          sel() ? t().backgroundElement : undefined
                        }
                        paddingLeft={1}
                        paddingRight={1}
                        onMouseUp={() => setBi(idx())}
                      >
                        <text fg={t().text}>
                          <span
                            style={{
                              fg: color(props.api, idx()),
                            }}
                          >
                            {"\u25A0"}
                          </span>{" "}
                          <span
                            style={{
                              fg: legendColor(props.api, topic.fidelity),
                              attributes: legendAttributes(topic.fidelity),
                            }}
                          >
                            {topic.label}
                          </span>{" "}
                          <span
                            style={{
                              fg:
                                topic.fidelity === "full"
                                  ? t().textMuted
                                  : legendColor(props.api, topic.fidelity),
                              attributes: legendAttributes(topic.fidelity),
                            }}
                          >
                            ~{formatTokens(effectiveTok(topic.id))} tok{" "}
                            {topic.fidelity !== "full"
                              ? `(${formatTokens(topic.tokenEstimate)} raw) `
                              : ""}
                          </span>
                          <span style={{ fg: t().warning }}>
                            {topicFidelityTag(topic)}
                          </span>
                        </text>
                        <text fg={legendColor(props.api, topic.fidelity)}>
                          <span
                            style={{
                              attributes: legendAttributes(topic.fidelity),
                            }}
                          >
                            {" "}
                            {topic.placeholder}
                          </span>
                        </text>
                        <Show when={sel()}>
                          <box flexDirection="row" gap={1} paddingLeft={2}>
                            <For each={USER_SELECTABLE_TOPIC_FIDELITIES}>
                              {(f, fi) => (
                                <box
                                  backgroundColor={
                                    topic.fidelity === f
                                      ? t().accent
                                      : t().border
                                  }
                                  paddingLeft={1}
                                  paddingRight={1}
                                  onMouseUp={() => void setFidelity(f)}
                                >
                                  <text
                                    fg={
                                      topic.fidelity === f
                                        ? t().selectedListItemText
                                        : t().text
                                    }
                                  >
                                    {fi() + 1}:{TOPIC_FIDELITY_LABEL[f]}
                                  </text>
                                </box>
                              )}
                            </For>
                          </box>
                        </Show>
                      </box>
                    );
                  }}
                </For>
              </box>
            </scrollbox>
          </Show>
        </box>
        <text fg={t().textMuted}>
          <i>j/k navigate 1-3 set fidelity q close</i>
        </text>
      </Show>

      <Show when={tab() === "messages"}>
        <box flexDirection="column" paddingTop={1} paddingBottom={1}>
          <Show
            when={secs().length > 0}
            fallback={<text fg={t().textMuted}>No messages mapped yet.</text>}
          >
            <scrollbox
              ref={(r: ScrollBoxRenderable) => (messageScroll = r)}
              maxHeight={messageListRows()}
              verticalScrollbarOptions={{
                trackOptions: {
                  backgroundColor: t().backgroundElement,
                  foregroundColor: t().border,
                },
              }}
              viewportOptions={{ paddingRight: 1 }}
            >
              <box flexDirection="column">
                <For each={secs()}>
                  {(sec) => {
                    const ci = sectionColor(map(), sec);
                    const sectionTopic = () =>
                      sec.topicID ? map()?.topics[sec.topicID] : undefined;
                    const sectionLegendColor = () => {
                      const topic = sectionTopic();
                      return topic
                        ? legendColor(props.api, topic.fidelity)
                        : t().text;
                    };
                    const sectionMetaColor = () => {
                      const topic = sectionTopic();
                      if (!topic || topic.fidelity === "full")
                        return t().textMuted;
                      return legendColor(props.api, topic.fidelity);
                    };
                    const sectionAttributes = () => {
                      const topic = sectionTopic();
                      return topic ? legendAttributes(topic.fidelity) : 0;
                    };
                    return (
                      <box flexDirection="column">
                        <text fg={t().text}>
                          <span style={{ fg: color(props.api, ci) }}>
                            {"\u25A0"}
                          </span>{" "}
                          <span
                            style={{
                              fg: sectionLegendColor(),
                              attributes: sectionAttributes(),
                            }}
                          >
                            <b>{sec.label}</b>
                          </span>{" "}
                          <span
                            style={{
                              fg: sectionMetaColor(),
                              attributes: sectionAttributes(),
                            }}
                          >
                            {sec.count} msgs ~
                            {formatTokens(
                              sec.topicID
                                ? effectiveTok(sec.topicID)
                                : sec.tokens,
                            )}{" "}
                            tok
                          </span>
                          {sec.topicID && map()?.topics[sec.topicID] ? (
                            <span style={{ fg: t().warning }}>
                              {"  "}
                              {topicFidelityTag(map()!.topics[sec.topicID]!)}
                            </span>
                          ) : (
                            ""
                          )}
                        </text>
                        <For each={sec.messages}>
                          {(msg) => {
                            const idx = createMemo(() =>
                              msgs().findIndex((m) => m.id === msg.id),
                            );
                            const sel = () => curMsg()?.id === msg.id;
                            const collapsed = () =>
                              topicIsCollapsed(
                                sec.topicID
                                  ? map()?.topics[sec.topicID]
                                  : undefined,
                              );
                            const badge = () => {
                              if (msg.hidden) return " [hidden]";
                              if (collapsed()) return "";
                              if (msg.fidelityOverride === "full")
                                return " [full lock]";
                              if (msg.fidelityOverride === "summary")
                                return " [summary lock]";
                              return "";
                            };
                            return (
                              <box
                                id={messageRowID(msg.id)}
                                flexDirection="column"
                                backgroundColor={
                                  sel() ? t().backgroundElement : undefined
                                }
                                paddingLeft={2}
                                onMouseUp={() => {
                                  if (idx() !== -1) setMi(idx());
                                }}
                              >
                                <text
                                  wrapMode="none"
                                  truncate
                                  fg={
                                    collapsed()
                                      ? t().border
                                      : sel()
                                        ? t().text
                                        : t().textMuted
                                  }
                                >
                                  {sel() ? ">" : " "}{" "}
                                  {msg.role === "user" ? "U" : "A"}{" "}
                                  {trim(msg.summary, 80)}
                                  <span
                                    style={{
                                      fg: msg.hidden ? t().error : t().warning,
                                    }}
                                  >
                                    {badge()}
                                  </span>
                                </text>
                                <Show when={sel() && !collapsed()}>
                                  <box flexDirection="column" paddingLeft={3}>
                                    <box flexDirection="row" gap={1}>
                                      <box
                                        backgroundColor={
                                          !msg.hidden &&
                                          msg.fidelityOverride === "inherit"
                                            ? t().accent
                                            : t().border
                                        }
                                        paddingLeft={1}
                                        paddingRight={1}
                                        onMouseUp={() => void patchMsg("auto")}
                                      >
                                        <text
                                          fg={
                                            !msg.hidden &&
                                            msg.fidelityOverride === "inherit"
                                              ? t().selectedListItemText
                                              : t().text
                                          }
                                        >
                                          a:Auto
                                        </text>
                                      </box>
                                      <box
                                        backgroundColor={
                                          !msg.hidden &&
                                          msg.fidelityOverride === "full"
                                            ? t().accent
                                            : t().border
                                        }
                                        paddingLeft={1}
                                        paddingRight={1}
                                        onMouseUp={() => void patchMsg("full")}
                                      >
                                        <text
                                          fg={
                                            !msg.hidden &&
                                            msg.fidelityOverride === "full"
                                              ? t().selectedListItemText
                                              : t().text
                                          }
                                        >
                                          f:Full
                                        </text>
                                      </box>
                                      <box
                                        backgroundColor={
                                          !msg.hidden &&
                                          msg.fidelityOverride === "summary"
                                            ? t().accent
                                            : t().border
                                        }
                                        paddingLeft={1}
                                        paddingRight={1}
                                        onMouseUp={() =>
                                          void patchMsg("summary")
                                        }
                                      >
                                        <text
                                          fg={
                                            !msg.hidden &&
                                            msg.fidelityOverride === "summary"
                                              ? t().selectedListItemText
                                              : t().text
                                          }
                                        >
                                          s:Summary
                                        </text>
                                      </box>
                                      <box
                                        backgroundColor={
                                          msg.hidden ? t().accent : t().border
                                        }
                                        paddingLeft={1}
                                        paddingRight={1}
                                        onMouseUp={() =>
                                          void patchMsg("hidden")
                                        }
                                      >
                                        <text
                                          fg={
                                            msg.hidden
                                              ? t().selectedListItemText
                                              : t().text
                                          }
                                        >
                                          h:Hidden
                                        </text>
                                      </box>
                                    </box>
                                    <text fg={t().textMuted}>
                                      Auto follows topic. Full/Summary/Hidden
                                      override it.
                                    </text>
                                  </box>
                                </Show>
                                <Show when={sel() && collapsed()}>
                                  <text fg={t().border} paddingLeft={3}>
                                    topic is {sec.fidelity} -- set topic to Full
                                    or Summary first
                                  </text>
                                </Show>
                              </box>
                            );
                          }}
                        </For>
                      </box>
                    );
                  }}
                </For>
              </box>
            </scrollbox>
          </Show>
        </box>
        <text fg={t().textMuted}>
          j/k navigate a auto f full s summary h hidden q close
        </text>
      </Show>
    </box>
  );
}

function HistoryDialog(props: {
  api: TuiPluginApi;
  history: HistoryState;
  currentSessionID?: string;
  close: () => void;
}) {
  const dimensions = useTerminalDimensions();
  const [bi, setBi] = createSignal(0);
  const [zoom, setZoom] = createSignal<"summary" | "full">("summary");
  const [content, setContent] = createSignal("");
  const [map, setMap] = createSignal<ContextMapFile>();
  const [askStatus, setAskStatus] = createSignal<string>("");

  const topics = createMemo(() => props.history.overview.topics);

  const load = async (z: "summary" | "full") => {
    const b = topics()[Math.min(bi(), Math.max(0, topics().length - 1))];
    if (!b) return;
    setZoom(z);
    const m = await ensureHistorical(props.api, props.history.sessionID);
    setMap(m);
    if (z === "summary") {
      setContent(
        buildSessionZoomText({ map: m, topicID: b.id, fidelity: "compressed" }),
      );
      return;
    }
    const raw =
      (
        await props.api.client.session.messages({
          sessionID: props.history.sessionID,
          directory: props.api.state.path.directory,
          limit: 5000,
        })
      )?.data ?? [];
    setContent(
      buildSessionZoomText({
        map: m,
        topicID: b.id,
        fidelity: "full",
        messages: toMessageLikes(raw),
      }),
    );
  };

  createEffect(() => {
    void ensureHistorical(props.api, props.history.sessionID).then(setMap);
  });
  createEffect(() => {
    bi();
    zoom();
    void load(zoom());
  });

  useKeyboard((evt) => {
    if (!props.api.ui.dialog.open) return;
    const stop = () => {
      evt.preventDefault();
      evt.stopPropagation();
    };
    if (evt.name === "escape" || evt.name === "q") {
      stop();
      props.close();
      return;
    }
    if (evt.name === "up" || evt.name === "k") {
      stop();
      setBi((v) => Math.max(0, v - 1));
      return;
    }
    if (evt.name === "down" || evt.name === "j") {
      stop();
      setBi((v) => Math.min(topics().length - 1, v + 1));
      return;
    }
    if (evt.name === "1") {
      stop();
      void load("summary");
      return;
    }
    if (evt.name === "2") {
      stop();
      void load("full");
      return;
    }
    if (evt.name === "a") {
      stop();
      void askAgentAboutBlame(props.api, props.currentSessionID, props.history)
        .then(() => {
          setAskStatus("Queued agent investigation in chat.");
          props.api.ui.toast({
            variant: "info",
            message: "Queued blame investigation in the current chat.",
          });
          props.close();
        })
        .catch((error) => {
          const message =
            error instanceof Error ? error.message : String(error);
          setAskStatus(message);
          props.api.ui.toast({
            variant: "error",
            message,
          });
        });
      return;
    }
  });

  const t = () => props.api.theme.current;
  const contentWidth = createMemo(() => dialogContentWidth(dimensions().width));
  return (
    <box
      flexDirection="column"
      paddingLeft={2}
      paddingRight={2}
      paddingBottom={1}
    >
      <text fg={t().text}>
        <b>Blame</b>{" "}
        <span style={{ fg: t().textMuted }}>
          {props.history.file}:{props.history.line} commit{" "}
          {props.history.commitHash?.slice(0, 8)}
        </span>
      </text>
      <Show when={map()}>
        <ContextBar api={props.api} map={map()} width={contentWidth()} />
      </Show>
      <box flexDirection="row" gap={2} paddingTop={1}>
        <box flexDirection="column" width="40%">
          <scrollbox
            maxHeight={14}
            verticalScrollbarOptions={{
              trackOptions: {
                backgroundColor: t().backgroundElement,
                foregroundColor: t().border,
              },
            }}
            viewportOptions={{ paddingRight: 1 }}
          >
            <box flexDirection="column">
              <For each={topics()}>
                {(b, idx) => {
                  const sel = () => idx() === bi();
                  return (
                    <box
                      flexDirection="column"
                      backgroundColor={
                        sel() ? t().backgroundElement : undefined
                      }
                      paddingLeft={1}
                      paddingRight={1}
                      onMouseUp={() => setBi(idx())}
                    >
                      <text fg={t().text}>
                        <span
                          style={{
                            fg: sel() ? t().text : color(props.api, idx()),
                          }}
                        >
                          {sel() ? ">" : "\u25A0"}
                        </span>{" "}
                        {b.label}
                      </text>
                      <text fg={t().textMuted}> {b.placeholder}</text>
                      <Show when={b.activeForCommit}>
                        <text fg={t().warning}> commit-linked</text>
                      </Show>
                    </box>
                  );
                }}
              </For>
            </box>
          </scrollbox>
        </box>
        <box flexDirection="column" width="60%">
          <text fg={t().textMuted}>Zoom: {zoom()} (1 summary 2 full)</text>
          <scrollbox
            maxHeight={12}
            verticalScrollbarOptions={{
              trackOptions: {
                backgroundColor: t().backgroundElement,
                foregroundColor: t().border,
              },
            }}
            viewportOptions={{ paddingRight: 1 }}
          >
            <box
              border
              borderColor={t().border}
              paddingLeft={1}
              paddingRight={1}
            >
              <text fg={t().text}>{content()}</text>
            </box>
          </scrollbox>
        </box>
      </box>
      <Show when={askStatus()}>
        <text fg={t().textMuted}>{askStatus()}</text>
      </Show>
      <text fg={t().textMuted}>
        j/k navigate 1 summary 2 full a ask agent q close
      </text>
    </box>
  );
}

const tui: TuiPlugin = async (api) => {
  const keys = api.keybind?.create?.({
    plugin_context_open: "<leader>'",
  });

  const openMap = (sessionID?: string) => {
    const id = sessionID ?? currentSession(api);
    if (!id) {
      api.ui.toast({
        variant: "error",
        message: "No active session",
      });
      return;
    }
    const dialog = api.ui.dialog;
    dialog.setSize("xlarge");
    dialog.replace(
      () => (
        <ContextMapDialog
          api={api}
          sessionID={id}
          close={() => dialog.clear()}
        />
      ),
      () => {},
    );
    queueMicrotask(() => dialog.setSize("xlarge"));
  };

  const openBlame = () => {
    const current = currentSession(api);
    const P = api.ui.DialogPrompt;
    const dialog = api.ui.dialog;
    dialog.replace(() => (
      <P
        title="Blame lookup"
        placeholder="src/auth.ts:42"
        onConfirm={(v: string) => {
          dialog.clear();
          void runBlame(api, v)
            .then((h) => {
              dialog.setSize("xlarge");
              dialog.replace(
                () => (
                  <HistoryDialog
                    api={api}
                    history={h}
                    currentSessionID={current}
                    close={() => dialog.clear()}
                  />
                ),
                () => {},
              );
              queueMicrotask(() => dialog.setSize("xlarge"));
            })
            .catch((e) =>
              api.ui.toast({
                variant: "error",
                message: e instanceof Error ? e.message : String(e),
              }),
            );
        }}
        onCancel={() => dialog.clear()}
      />
    ));
  };

  const keymap = keymapLayerApi(api);
  if (keymap?.registerLayer) {
    keymap.registerLayer({
      commands: [
        {
          name: "context-map.open",
          title: "Open context map",
          category: "Plugin",
          desc: "Inspect and control context map fidelity",
          namespace: "palette",
          slashName: "context",
          run: () => openMap(),
        },
        {
          name: "context-map.blame",
          title: "Blame lookup",
          category: "Plugin",
          desc: "Open context from the session that touched a file line",
          namespace: "palette",
          slashName: "blame",
          run: () => openBlame(),
        },
      ],
      bindings: [
        {
          key: "ctrl+g",
          cmd: "context-map.open",
          desc: "Open context map",
        },
      ],
    });
  } else {
    api.command.register(() => [
      {
        title: "Open context map",
        value: "context-map.open",
        category: "Plugin",
        keybind: keys?.get("plugin_context_open"),
        slash: { name: "context" },
        onSelect: () => openMap(),
      },
      {
        title: "Blame lookup",
        value: "context-map.blame",
        category: "Plugin",
        slash: { name: "blame" },
        onSelect: () => openBlame(),
      },
    ]);
  }

  api.slots.register({
    order: 110,
    slots: {
      sidebar_content(_ctx, value) {
        return (
          <SidebarView
            api={api}
            sessionID={value.session_id}
            onOpen={() => openMap(value.session_id)}
          />
        );
      },
    },
  });

  api.lifecycle.onDispose(() => {});
};

const plugin: TuiPluginModule = { id: PLUGIN_ID, tui };
export default plugin;
