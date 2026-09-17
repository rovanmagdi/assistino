import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  answerQuestion,
  streamChat,
  type ChatRequestMessage,
  type StreamChatOptions,
} from "../lib/sse";
import { REASONING_TYPE_SPEED_MS } from "./timeline-node";
import { cn, newSessionId, nowTime, uid } from "../lib/utils";
import { useTheme, type ThemePreference } from "../lib/use-theme";
import { useChatSettings } from "../lib/use-chat-settings";
import {
  nl2sqlStyleFor,
  type Prose,
  type ResponseLength,
  type ToolSkin,
  type ViewMode,
} from "../lib/agent-view";
import {
  readSetting,
  writeSetting,
  type ColorTheme,
  type ColorThemeOverrides,
  type CustomColorKey,
  type NodeStyle,
} from "../lib/color-themes";
import type { ChatMessage, TimelineStep } from "../types";

const MAX_REASONING_REVEAL_DELAY_MS = 3000;

/** Chat state and actions, read with {@link useChat} from any part under <ChatRoot />. */
export interface ChatContextValue {
  messages: ChatMessage[];
  /** A turn is in flight. */
  streaming: boolean;
  /** No messages yet. */
  isEmpty: boolean;
  /** Send a turn. Ignored while one is already streaming, or if text is blank. */
  send: (text: string) => void;
  /** Abort the streaming turn. */
  stop: () => void;
  /** Drop the transcript and start a new conversation. */
  clear: () => void;
  /** Resolve a paused human-in-the-loop question. */
  answerQuestion: (messageId: string, stepId: string, questionId: string, answer: string) => void;
  /** Resolved appearance of the widget. */
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (dark: boolean) => void;
  /** Settings-menu state (brand, custom colors, node style, view mode, prose, …). */
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
    throw new Error("useChat() must be used inside <ChatRoot />.");
  }
  return ctx;
}

/** Props of the root — transport, session, theme, and where to render. */
export interface ChatRootProps {
  /** Origin of the ReAct backend. Omit for same-origin. */
  apiBaseUrl?: string;
  /** Extra request headers. */
  headers?: Record<string, string>;
  /** Sends cookies cross-origin. Pass "include" when the API is on another host. */
  credentials?: RequestCredentials;
  /** Conversation id. Generated per mount and rotated on Clear when omitted. */
  sessionId?: string;
  /** Light/dark handling — see {@link ThemePreference}. Defaults to "inherit". */
  theme?: ThemePreference;
  /** Brand preset to start from — "default", "assistino", "pmk", "tendrix", or "talentino AI". */
  colorTheme?: ColorTheme;
  /** Per-brand CSS variables merged over the built-in presets. */
  colorThemes?: ColorThemeOverrides;
  /** Starting rail marker style: "icons" (default) or "dots". */
  nodeStyle?: NodeStyle;
  /** Starting view: "client" (default) or "developer". Also sets the answer tone sent to the backend. */
  viewMode?: ViewMode;
  /** `false` locks the widget to "client" and hides the Developer option. Defaults to true. */
  developerView?: boolean;
  /** Starting tool-node skin for the Developer view: "flat" (default) or "terminal". */
  toolSkin?: ToolSkin;
  /** Starting narration density: "explained" (default) or "plain". */
  prose?: Prose;
  /** Starting length of the final answer: "short", "medium", or "long" (default). */
  responseLength?: ResponseLength;
  /** Remember settings-menu choices in localStorage. Defaults to true. */
  persistSettings?: boolean;
  /** Take the viewport (h-screen) instead of filling the parent. */
  fullScreen?: boolean;
  /** Extra classes on the root element. */
  className?: string;
  /** Called after each completed (or failed) turn, with the full transcript. */
  onMessagesChange?: (messages: ChatMessage[]) => void;
  /** The parts: <ChatHeader />, <ChatBody />, <ChatInput />, or your own. */
  children?: ReactNode;
}

/** Owns the transcript, the SSE stream, theme, and settings. Lay the parts out inside it. */
export function ChatRoot({
  apiBaseUrl,
  headers,
  credentials,
  sessionId,
  theme = "inherit",
  colorTheme: defaultColorTheme = "default",
  colorThemes,
  nodeStyle: defaultNodeStyle = "icons",
  viewMode: defaultViewMode = "client",
  developerView = true,
  toolSkin: defaultToolSkin = "flat",
  prose: defaultProse = "explained",
  responseLength: defaultResponseLength = "long",
  persistSettings = true,
  fullScreen = false,
  className,
  onMessagesChange,
  children,
}: ChatRootProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
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
    defaultViewMode,
    developerView,
    defaultToolSkin,
    defaultProse,
    defaultResponseLength,
    persist: persistSettings,
    colorThemes,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const setDark = useCallback(
    (dark: boolean) => {
      setThemeMode(dark ? "dark" : "light");
      if (persistSettings) writeSetting("mode", dark ? "dark" : "light");
    },
    [setThemeMode, persistSettings],
  );
  const sessionIdRef = useRef<string>(sessionId ?? newSessionId());
  if (sessionId && sessionIdRef.current !== sessionId) sessionIdRef.current = sessionId;

  const onMessagesChangeRef = useRef(onMessagesChange);
  onMessagesChangeRef.current = onMessagesChange;

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
      headers,
      credentials,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiBaseUrl, JSON.stringify(headers ?? null), credentials],
  );

  const patch = useCallback(
    (id: string, fn: (m: ChatMessage) => ChatMessage) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)));
    },
    [],
  );

  const { viewMode, responseLength } = settings;

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

      let reasoningRevealDeadline = 0;

      const pushReasoning = (content: string) => {
        const revealMs = Math.min(
          content.length * REASONING_TYPE_SPEED_MS + 200,
          MAX_REASONING_REVEAL_DELAY_MS,
        );
        reasoningRevealDeadline = performance.now() + revealMs;
        patch(assistantId, (m) => ({
          ...m,
          steps: [...(m.steps ?? []), { id: uid("reason"), kind: "reasoning", text: content }],
        }));
      };

      try {
        const stream = streamChat(history, {
          ...transport,
          signal: controller.signal,
          sessionId: sessionIdRef.current,
          nl2sqlStyle: nl2sqlStyleFor(viewMode),
          nl2sqlLength: responseLength,
        });
        for await (const evt of stream) {
          if (evt.kind === "thought") {
            pushReasoning(evt.content);
          } else if (evt.kind === "tool_start") {
            const revealDelayMs = Math.max(0, reasoningRevealDeadline - performance.now());
            patch(assistantId, (m) => ({
              ...m,
              steps: [
                ...(m.steps ?? []),
                { id: uid("sel"), kind: "tool_selected", tool: evt.tool, revealDelayMs },
                {
                  id: uid("tool"),
                  kind: "tool",
                  callId: evt.callId,
                  tool: evt.tool,
                  args: evt.args,
                  status: "running",
                  progress: [],
                  revealDelayMs,
                  startedAt: Date.now(),
                },
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
          } else if (evt.kind === "tool_sub_event") {
            const { detail } = evt;
            if (detail.kind === "sub_thought") {
              pushReasoning(detail.text);
            } else if (detail.kind === "sub_tool_start") {
              const revealDelayMs = Math.max(0, reasoningRevealDeadline - performance.now());
              patch(assistantId, (m) => ({
                ...m,
                steps: [
                  ...(m.steps ?? []),
                  {
                    id: uid("tool"),
                    kind: "tool",
                    callId: uid("subcall"),
                    tool: detail.tool,
                    args: detail.args,
                    status: "running",
                    progress: [],
                    revealDelayMs,
                    startedAt: Date.now(),
                  },
                ],
              }));
            } else if (detail.kind === "sub_tool_result") {
              patch(assistantId, (m) => {
                const steps = m.steps ?? [];
                const idx = [...steps]
                  .reverse()
                  .findIndex(
                    (s) => s.kind === "tool" && s.tool === detail.tool && s.status === "running",
                  );
                if (idx === -1) return m;
                const realIdx = steps.length - 1 - idx;
                const target = steps[realIdx];
                if (target.kind !== "tool") return m;
                const isError = detail.observation.trimStart().startsWith("[Error]");
                const next = [...steps];
                next[realIdx] = {
                  ...target,
                  status: isError ? "error" : "done",
                  observation: detail.observation,
                };
                return { ...m, steps: next };
              });
            } else if (detail.kind === "human_question") {
              patch(assistantId, (m) => ({
                ...m,
                steps: [
                  ...(m.steps ?? []),
                  {
                    id: uid("ask"),
                    kind: "human_question",
                    questionId: detail.question_id,
                    question: detail.question,
                    options: detail.options,
                    context: detail.context,
                    previews: detail.previews,
                    answered: false,
                  },
                ],
              }));
            }
          } else if (evt.kind === "tool_end") {
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
                },
              ],
            }));
          } else if (evt.kind === "text") {
            patch(assistantId, (m) => {
              const steps: TimelineStep[] = [...(m.steps ?? [])];
              const last = steps[steps.length - 1];
              if (last && last.kind === "explaining") {
                steps[steps.length - 1] = { ...last, text: last.text + evt.content };
              } else {
                steps.push({ id: uid("exp"), kind: "explaining", text: evt.content });
              }
              return { ...m, steps, content: m.content + evt.content };
            });
          } else if (evt.kind === "done") {
            patch(assistantId, (m) => {
              const steps: TimelineStep[] = [...(m.steps ?? [])];
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
    [messages, patch, transport, viewMode, responseLength],
  );

  const handleAnswerQuestion = useCallback(
    async (messageId: string, stepId: string, questionId: string, answer: string) => {
      patch(messageId, (m) => ({
        ...m,
        steps: (m.steps ?? []).map((s) =>
          s.kind === "human_question" && s.id === stepId ? { ...s, answered: true, answer } : s,
        ),
      }));
      try {
        await answerQuestion(questionId, answer, transport);
      } catch (err) {
        patch(messageId, (m) => ({
          ...m,
          error: err instanceof Error ? err.message : "Could not send your answer",
        }));
      }
    },
    [patch, transport],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleClear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
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
      answerQuestion: handleAnswerQuestion,
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
      handleAnswerQuestion,
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
        style={settings.vars}
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
