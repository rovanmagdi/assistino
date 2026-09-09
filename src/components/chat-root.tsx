import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { streamChat, type ChatRequestMessage, type StreamChatOptions } from "../lib/sse";
import { REASONING_TYPE_SPEED_MS } from "./timeline-node";
import { cn, newSessionId, nowTime, uid } from "../lib/utils";
import { useTheme, type ThemePreference } from "../lib/use-theme";
import { themeTokensToVars, type ThemeTokens } from "../lib/theme-tokens";
import { useChatSettings } from "../lib/use-chat-settings";
import {
  readSetting,
  writeSetting,
  type ColorTheme,
  type CustomColorKey,
  type NodeStyle,
} from "../lib/color-themes";
import type { ChatMessage, TimelineStep } from "../types";

// A ceiling, not a normal-case limit — only kicks in for pathologically long
// thoughts. Set well above what REASONING_TYPE_SPEED_MS needs for a normal
// 2-3 sentence thought, so the tool node never reveals before the reasoning
// typewriter (timeline-node.tsx) actually finishes typing it out.
const MAX_REASONING_REVEAL_DELAY_MS = 3000;

/**
 * Everything a chat part needs from the widget: the transcript, the actions
 * that drive it, and the theme/settings state. Read it with {@link useChat}
 * from any component under <ChatRoot />.
 */
export interface ChatContextValue {
  messages: ChatMessage[];
  /** A turn is in flight. */
  streaming: boolean;
  /** No messages yet — the empty state shows. */
  isEmpty: boolean;
  /** Send a turn. Ignored while one is already streaming, or if text is blank. */
  send: (text: string) => void;
  /** Abort the streaming turn. */
  stop: () => void;
  /** Drop the transcript and start a new conversation. */
  clear: () => void;
  /** Resolved appearance of the widget. */
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (dark: boolean) => void;
  /** Settings-menu state (brand preset, custom colors, node style). */
  settings: ReturnType<typeof useChatSettings>;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  /** Effective values of the customizable colors, for the pickers. */
  customColorValues: Record<CustomColorKey, string>;
  /** The widget's root element — for measuring or reading resolved CSS. */
  rootRef: React.RefObject<HTMLDivElement | null>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

/** Access the chat state from a part rendered inside <ChatRoot />. */
export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error(
      "useChat() must be used inside <ChatRoot />.",
    );
  }
  return ctx;
}

/** Props of the root — transport, session, theme, and where to render. */
export interface ChatRootProps {
  /**
   * Origin of the ReAct backend, e.g. "https://engine.example.com". Omit it to
   * call same-origin paths, which is what the bundled demo app relies on (Vite
   * proxies /v1 to :8000 in dev).
   */
  apiBaseUrl?: string;
  /** Path of the SSE chat endpoint. Defaults to "/v1/chat/completions". */
  apiPath?: string;
  /** Model id sent with each turn; the server treats it as a label. */
  model?: string;
  /** Extra request headers — an Authorization bearer, a tenant id, … */
  headers?: Record<string, string>;
  /** Sends cookies cross-origin. Pass "include" when the API is on another host. */
  credentials?: RequestCredentials;
  /** Swap in a custom fetch (auth refresh, instrumentation, tests). */
  fetch?: typeof fetch;
  /**
   * Pin the conversation to an id you control — resuming a saved thread, or
   * tying it to your own user session. Left out, one is generated per mount
   * and rotated on "Clear".
   */
  sessionId?: string;
  /** Light/dark handling — see {@link ThemePreference}. Defaults to "inherit". */
  theme?: ThemePreference;
  /**
   * Repaint the widget in your own colors — see {@link ThemeTokens}. A partial
   * set is fine; anything you leave out keeps its default:
   *
   * ```tsx
   * <ChatRoot tokens={{ primary: "#7C3AED", radius: "0.5rem" }}>…</ChatRoot>
   * ```
   */
  tokens?: ThemeTokens;
  /**
   * Overrides applied on top of `tokens` only while the widget is dark. Skip
   * it and the light values are used in both themes.
   */
  darkTokens?: ThemeTokens;
  /** Brand preset to start from — "default", "pmk", "tendrix", or "talentino AI". */
  colorTheme?: ColorTheme;
  /**
   * Timeline rail markers: "icons" (default) or plain "dots". The starting
   * value for the settings menu; `<ChatBody nodeStyle />` overrides both.
   */
  nodeStyle?: NodeStyle;
  /**
   * Remember the user's settings-menu choices in localStorage (keys are
   * namespaced `assistino-chat:*`). Defaults to `true`; pass `false` for
   * per-session settings only.
   */
  persistSettings?: boolean;
  /** Inline styles on the root element. Merged after the token variables. */
  style?: CSSProperties;
  /**
   * Take over the viewport (h-screen) instead of filling the parent box. The
   * default, `false`, is what you want when embedding: give the container a
   * height and the widget fills it.
   */
  fullScreen?: boolean;
  /** Extra classes on the root element — sizing, borders, rounding. */
  className?: string;
  /** Called after each completed (or failed) turn, with the full transcript. */
  onMessagesChange?: (messages: ChatMessage[]) => void;
  /** The parts: <ChatHeader />, <ChatBody />, <ChatInput />, or your own. */
  children?: ReactNode;
}

/**
 * The stateful shell: owns the transcript and the SSE stream, resolves the
 * theme and settings, and renders the `.assistino-chat` root element the
 * stylesheet is scoped to. Lay out the parts inside it however you like:
 *
 * ```tsx
 * <ChatRoot apiBaseUrl="https://engine.example.com">
 *   <ChatHeader title="Support" />
 *   <ChatBody />
 *   <ChatInput placeholder="Ask anything…" />
 * </ChatRoot>
 * ```
 */
export function ChatRoot({
  apiBaseUrl,
  apiPath,
  model,
  headers,
  credentials,
  fetch: fetchImpl,
  sessionId,
  theme = "inherit",
  tokens,
  darkTokens,
  colorTheme: defaultColorTheme = "default",
  nodeStyle: defaultNodeStyle = "icons",
  persistSettings = true,
  style,
  fullScreen = false,
  className,
  onMessagesChange,
  children,
}: ChatRootProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // A light/dark choice made in the settings menu outlives the reload.
  const [storedMode] = useState<"light" | "dark" | null>(() => {
    const m = persistSettings ? readSetting("mode") : null;
    return m === "light" || m === "dark" ? m : null;
  });
  const {
    resolved: resolvedTheme,
    isDark,
    toggle: toggleTheme,
    set: setThemeMode,
  } = useTheme(theme, rootRef, storedMode);
  const settings = useChatSettings(isDark ? "dark" : "light", {
    defaultColorTheme,
    defaultNodeStyle,
    persist: persistSettings,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const setDark = useCallback(
    (dark: boolean) => {
      setThemeMode(dark ? "dark" : "light");
      if (persistSettings) writeSetting("mode", dark ? "dark" : "light");
    },
    [setThemeMode, persistSettings],
  );
  // Sent with every turn so the server can keep this conversation's query
  // results (see tools/query_store.py) and chart them on a follow-up instead of
  // re-running the query. Reset by "clear", which starts a new conversation.
  const sessionIdRef = useRef<string>(sessionId ?? newSessionId());
  if (sessionId && sessionIdRef.current !== sessionId) sessionIdRef.current = sessionId;

  const onMessagesChangeRef = useRef(onMessagesChange);
  onMessagesChangeRef.current = onMessagesChange;

  // Token overrides ride as inline custom properties on the root, so they beat
  // the stylesheet without the host having to out-specify a selector. The dark
  // set is applied by resolved appearance rather than a media query, which is
  // what lets it follow a `.dark` the host toggles at runtime. Choices the
  // user makes in the settings menu (brand preset, custom colors) layer on top
  // of the host's tokens — an explicit pick in the UI beats a default.
  const rootStyle = useMemo<CSSProperties>(
    () => ({
      ...themeTokensToVars(tokens, isDark ? darkTokens : undefined),
      ...settings.vars,
      ...style,
    }),
    [tokens, darkTokens, isDark, settings.vars, style],
  );

  // Values shown by the custom-color pickers. For the "default" preset there
  // is no literal to show, so read the resolved variable off the root element.
  // Only while the menu is open — getComputedStyle forces a style flush.
  const customColorValues = settings.customColorValues((v) =>
    settingsOpen && rootRef.current
      ? getComputedStyle(rootRef.current).getPropertyValue(v).trim()
      : "",
  );

  useEffect(() => {
    onMessagesChangeRef.current?.(messages);
  }, [messages]);

  const transport = useMemo<StreamChatOptions>(
    () => ({
      baseUrl: apiBaseUrl,
      path: apiPath,
      model,
      headers,
      credentials,
      fetch: fetchImpl,
    }),
    // `headers` is spread into a fresh object per render by most callers, so
    // key on its contents rather than its identity to avoid re-creating the
    // options (and thus handleSend) on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiBaseUrl, apiPath, model, JSON.stringify(headers ?? null), credentials, fetchImpl],
  );

  const patch = useCallback(
    (id: string, fn: (m: ChatMessage) => ChatMessage) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)));
    },
    [],
  );

  const handleSend = useCallback(
    async (text: string) => {
      const history: ChatRequestMessage[] = messages
        .filter((m) => m.content.trim())
        .map((m) => ({ role: m.role, content: m.content }));
      history.push({ role: "user", content: text });

      const userMsg: ChatMessage = { id: uid("u"), role: "user", content: text };
      const assistantId = uid("a");
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        steps: [],
        streaming: true,
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      // Set on "thought", read on "tool_start" — never awaited, so the
      // stream keeps being read live; it only decides how long the tool
      // node's own fade-in transition should be delayed by (timeline-node.tsx),
      // so events are never held back waiting on it.
      let reasoningRevealDeadline = 0;

      try {
        const stream = streamChat(history, {
          ...transport,
          signal: controller.signal,
          sessionId: sessionIdRef.current,
        });
        for await (const evt of stream) {
          if (evt.kind === "thought") {
            // 1. Reasoning
            const revealMs = Math.min(
              evt.content.length * REASONING_TYPE_SPEED_MS + 200,
              MAX_REASONING_REVEAL_DELAY_MS,
            );
            reasoningRevealDeadline = performance.now() + revealMs;
            patch(assistantId, (m) => ({
              ...m,
              steps: [
                ...(m.steps ?? []),
                { id: uid("reason"), kind: "reasoning", text: evt.content } as TimelineStep,
              ],
            }));
          } else if (evt.kind === "tool_start") {
            // 2. Determine tool, then 3. Tool call (as two separate nodes).
            // Both land in state immediately; only their visual reveal is
            // delayed (via revealDelayMs → transition delay in TimelineNode).
            const revealDelayMs = Math.max(0, reasoningRevealDeadline - performance.now());
            patch(assistantId, (m) => ({
              ...m,
              steps: [
                ...(m.steps ?? []),
                { id: uid("sel"), kind: "tool_selected", tool: evt.tool, revealDelayMs } as TimelineStep,
                {
                  id: uid("tool"),
                  kind: "tool",
                  callId: evt.callId,
                  tool: evt.tool,
                  args: evt.args,
                  status: "running",
                  progress: [],
                  revealDelayMs,
                } as TimelineStep,
              ],
            }));
          } else if (evt.kind === "tool_progress") {
            patch(assistantId, (m) => ({
              ...m,
              steps: (m.steps ?? []).map((s) =>
                s.kind === "tool" && s.callId === evt.callId
                  ? { ...s, progress: [...s.progress, { text: evt.message, time: nowTime() }] }
                  : s,
              ),
            }));
          } else if (evt.kind === "tool_end") {
            // Mark the tool call done/error, then append 4. Observation as its own node.
            const isError = evt.result.trimStart().startsWith("[Error]");
            const status: "done" | "error" = isError ? "error" : "done";
            patch(assistantId, (m) => ({
              ...m,
              steps: [
                ...(m.steps ?? []).map((s) =>
                  s.kind === "tool" && s.callId === evt.callId ? { ...s, status } : s,
                ),
                {
                  id: uid("obs"),
                  kind: "observation",
                  tool: evt.tool,
                  result: evt.result,
                  isError,
                } as TimelineStep,
              ],
            }));
          } else if (evt.kind === "text") {
            // Streamed as "explaining" by default — we don't yet know if this
            // turn will call another tool or is the genuine final answer.
            // Promoted to "answer" on "done" below, once we know it's final.
            patch(assistantId, (m) => {
              const steps = [...(m.steps ?? [])];
              const last = steps[steps.length - 1];
              if (last && last.kind === "explaining") {
                steps[steps.length - 1] = { ...last, text: last.text + evt.content };
              } else {
                steps.push({ id: uid("exp"), kind: "explaining", text: evt.content });
              }
              return { ...m, steps, content: m.content + evt.content };
            });
          } else if (evt.kind === "done") {
            // The loop truly ended here (no further tool call follows) —
            // promote the trailing "explaining" text to the final answer.
            patch(assistantId, (m) => {
              const steps = [...(m.steps ?? [])];
              const last = steps[steps.length - 1];
              if (last && last.kind === "explaining") {
                steps[steps.length - 1] = { id: last.id, kind: "answer", text: last.text };
              }
              return { ...m, steps };
            });
          } else if (evt.kind === "error") {
            patch(assistantId, (m) => ({ ...m, error: evt.message }));
          }
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          patch(assistantId, (m) => ({
            ...m,
            error: err instanceof Error ? err.message : "Stream failed",
          }));
        }
      } finally {
        patch(assistantId, (m) => ({ ...m, streaming: false }));
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, patch, transport],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleClear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    // A new conversation gets a new store, so a chart request cannot reach back
    // to data fetched before the clear. A caller-supplied id is left alone —
    // it belongs to the host, which decides when the thread is really new.
    if (!sessionId) sessionIdRef.current = newSessionId();
  }, [sessionId]);


  const isEmpty = messages.length === 0;

  const value = useMemo<ChatContextValue>(
    () => ({
      messages,
      streaming,
      isEmpty,
      send: handleSend,
      stop: handleStop,
      clear: handleClear,
      isDark,
      toggleTheme,
      setDark,
      settings,
      settingsOpen,
      setSettingsOpen,
      customColorValues,
      rootRef,
    }),
    [
      messages,
      streaming,
      isEmpty,
      handleSend,
      handleStop,
      handleClear,
      isDark,
      toggleTheme,
      setDark,
      settings,
      settingsOpen,
      customColorValues,
    ],
  );

  return (
    <ChatContext.Provider value={value}>
      <div
        ref={rootRef}
        data-theme={resolvedTheme ?? undefined}
        style={rootStyle}
        className={cn(
          "assistino-chat relative flex min-h-0 flex-col bg-background text-foreground",
          fullScreen ? "h-screen" : "h-full",
          className,
        )}
      >
        {children}
      </div>
    </ChatContext.Provider>
  );
}
