import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Composer, type ComposerOptions } from "./composer";
import { ThemeToggle } from "./theme-toggle";
import { AssistantMessage, UserMessage } from "./message";
import { streamChat, type ChatRequestMessage, type StreamChatOptions } from "../lib/sse";
import { REASONING_TYPE_SPEED_MS } from "./timeline-node";
import { cn, newSessionId, nowTime, uid } from "../lib/utils";
import { useTheme, type ThemePreference } from "../lib/use-theme";
import { themeTokensToVars, type ThemeTokens } from "../lib/theme-tokens";
import type { ChatMessage, TimelineStep } from "../types";

// A ceiling, not a normal-case limit — only kicks in for pathologically long
// thoughts. Set well above what REASONING_TYPE_SPEED_MS needs for a normal
// 2-3 sentence thought, so the tool node never reveals before the reasoning
// typewriter (timeline-node.tsx) actually finishes typing it out.
const MAX_REASONING_REVEAL_DELAY_MS = 3000;

const DEFAULT_SUGGESTIONS = [
  "Search the web for the latest news on AI agents",
  "Find LinkedIn candidates for a senior backend role",
  "What HR positions are open in my company?",
];

/** Handed to `renderComposer` so a custom input can drive the conversation. */
export interface ComposerRenderApi {
  /** Send a turn. Ignored while one is already streaming, or if text is blank. */
  send: (text: string) => void;
  /** Abort the streaming turn. */
  stop: () => void;
  /** A turn is in flight. */
  streaming: boolean;
}

/** Props of the packaged widget — every one of them optional. */
export interface AssistinoChatProps {
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
  /** Header title. Defaults to "ReAct Agent". */
  title?: string;
  /** Header subtitle. Defaults to "Reasoning · Tools · Observation". */
  subtitle?: string;
  /** Hide the header strip (title, clear button, theme toggle). */
  showHeader?: boolean;
  /** Hide the light/dark switch inside the header. */
  showThemeToggle?: boolean;
  /** Prompts offered on the empty state. Pass [] for none. */
  suggestions?: string[];
  /** Empty-state heading. Defaults to "What can I help you with?". */
  emptyStateTitle?: string;
  /** Placeholder shown in the composer input. Shorthand for `composer.placeholder`. */
  placeholder?: string;
  /**
   * Restyle and reconfigure the input area — see {@link ComposerOptions}:
   *
   * ```tsx
   * <AssistinoChat
   *   composer={{
   *     placeholder: "Ask about your pipeline…",
   *     hint: false,
   *     boxClassName: "rounded-md border-2",
   *     textareaProps: { maxLength: 2000 },
   *   }}
   * />
   * ```
   */
  composer?: ComposerOptions;
  /**
   * Replace the input area outright. You render whatever UI you like and call
   * `send` / `stop` from it; the transcript above is untouched.
   *
   * ```tsx
   * <AssistinoChat
   *   renderComposer={({ send, streaming }) => (
   *     <MyComposer onSubmit={send} busy={streaming} />
   *   )}
   * />
   * ```
   */
  renderComposer?: (api: ComposerRenderApi) => ReactNode;
  /** Light/dark handling — see {@link ThemePreference}. Defaults to "inherit". */
  theme?: ThemePreference;
  /**
   * Repaint the widget in your own colors — see {@link ThemeTokens}. A partial
   * set is fine; anything you leave out keeps its default:
   *
   * ```tsx
   * <AssistinoChat tokens={{ primary: "#7C3AED", radius: "0.5rem" }} />
   * ```
   */
  tokens?: ThemeTokens;
  /**
   * Overrides applied on top of `tokens` only while the widget is dark. Skip
   * it and the light values are used in both themes.
   */
  darkTokens?: ThemeTokens;
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
}

/**
 * The full chat experience: composer, streamed answers, and the ReAct timeline
 * of every thought, tool call, and observation behind them.
 *
 * Renders a single flex column that fills its parent, so the host controls
 * placement and size:
 *
 * ```tsx
 * <div style={{ height: "70vh" }}>
 *   <AssistinoChat apiBaseUrl="https://engine.example.com" />
 * </div>
 * ```
 */
export function ChatPage({
  apiBaseUrl,
  apiPath,
  model,
  headers,
  credentials,
  fetch: fetchImpl,
  sessionId,
  title = "ReAct Agent",
  subtitle = "Reasoning · Tools · Observation",
  showHeader = true,
  showThemeToggle = true,
  suggestions = DEFAULT_SUGGESTIONS,
  emptyStateTitle = "What can I help you with?",
  placeholder,
  composer,
  renderComposer,
  theme = "inherit",
  tokens,
  darkTokens,
  style,
  fullScreen = false,
  className,
  onMessagesChange,
}: AssistinoChatProps = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const { resolved: resolvedTheme, isDark, toggle: toggleTheme } = useTheme(theme, rootRef);
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
  // what lets it follow a `.dark` the host toggles at runtime.
  const rootStyle = useMemo<CSSProperties>(
    () => ({ ...themeTokensToVars(tokens, isDark ? darkTokens : undefined), ...style }),
    [tokens, darkTokens, isDark, style],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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

  return (
    <div
      ref={rootRef}
      data-theme={resolvedTheme ?? undefined}
      style={rootStyle}
      className={cn(
        "assistino-chat flex min-h-0 flex-col bg-background text-foreground",
        fullScreen ? "h-screen" : "h-full",
        className,
      )}
    >
      {/* header */}
      {showHeader && (
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-semibold leading-none">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {!isEmpty && (
            <Button size="sm" variant="ghost" onClick={handleClear}>
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          )}
          {showThemeToggle && <ThemeToggle dark={isDark} onToggle={toggleTheme} />}
        </header>
      )}

      {/* messages */}
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold">{emptyStateTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Watch the agent reason, call tools, and observe results in real time.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground/90 transition-colors hover:border-ring hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full space-y-6 px-4 py-6">
            {messages.map((m) =>
              m.role === "user" ? (
                <UserMessage key={m.id} message={m} />
              ) : (
                <AssistantMessage key={m.id} message={m} />
              ),
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* composer */}
      {renderComposer ? (
        renderComposer({ send: handleSend, stop: handleStop, streaming })
      ) : (
        <Composer
          {...composer}
          onSend={handleSend}
          onStop={handleStop}
          streaming={streaming}
          placeholder={composer?.placeholder ?? placeholder}
        />
      )}
    </div>
  );
}

/**
 * Public name for the widget. `ChatPage` stays exported under its old name so
 * the demo app and existing imports keep working.
 */
export const AssistinoChat = ChatPage;
