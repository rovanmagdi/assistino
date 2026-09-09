import { useEffect, useRef, type ReactNode } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Composer, type ComposerOptions } from "./composer";
import { ThemeToggle } from "./theme-toggle";
import { SettingsMenu } from "./settings-menu";
import { AssistantMessage, UserMessage } from "./message";
import { cn } from "../lib/utils";
import { useChat } from "./chat-root";

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatHeaderProps {
  /** Title text. Defaults to "ReAct Agent". */
  title?: ReactNode;
  /** Subtitle under the title. Pass `null` for none. */
  subtitle?: ReactNode;
  /** Replace the sparkle badge. Pass `null` for none. */
  icon?: ReactNode;
  /** Show the Clear button once there are messages. Defaults to `true`. */
  showClear?: boolean;
  /** Show the light/dark switch. Defaults to `true`. */
  showThemeToggle?: boolean;
  /** Show the settings (gear) menu. Defaults to `true`. */
  showSettings?: boolean;
  /** Extra controls rendered before the built-in buttons. */
  children?: ReactNode;
  className?: string;
}

/** Title strip with the clear, theme, and settings controls. */
export function ChatHeader({
  title = "ReAct Agent",
  subtitle = "Reasoning · Tools · Observation",
  icon,
  showClear = true,
  showThemeToggle = true,
  showSettings = true,
  children,
  className,
}: ChatHeaderProps) {
  const {
    isEmpty,
    clear,
    isDark,
    toggleTheme,
    setDark,
    settings,
    settingsOpen,
    setSettingsOpen,
    customColorValues,
  } = useChat();

  return (
    <header
      className={cn("flex items-center gap-3 border-b border-border px-4 py-3", className)}
    >
      {icon === undefined ? (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
      ) : (
        icon
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-sm font-semibold leading-none">{title}</h1>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
      {showClear && !isEmpty && (
        <Button size="sm" variant="ghost" onClick={clear}>
          <Trash2 className="h-4 w-4" />
          Clear
        </Button>
      )}
      {showThemeToggle && <ThemeToggle dark={isDark} onToggle={toggleTheme} />}
      {showSettings && (
        <SettingsMenu
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          dark={isDark}
          onDarkChange={setDark}
          colorTheme={settings.colorTheme}
          onColorThemeChange={settings.setColorTheme}
          customColors={customColorValues}
          onCustomColorChange={settings.setCustomColor}
          onResetCustomColors={settings.resetCustomColors}
          nodeStyle={settings.nodeStyle}
          onNodeStyleChange={settings.setNodeStyle}
        />
      )}
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Body
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SUGGESTIONS = [
  "Search the web for the latest news on AI agents",
  "Find LinkedIn candidates for a senior backend role",
  "What HR positions are open in my company?",
];

export interface ChatBodyProps {
  /** Prompts offered on the empty state. Pass [] for none. */
  suggestions?: string[];
  /** Empty-state heading. Defaults to "What can I help you with?". */
  emptyStateTitle?: ReactNode;
  /** Line under the empty-state heading. Pass `null` for none. */
  emptyStateDescription?: ReactNode;
  /** Replace the whole empty state. Gets `send` so custom prompts can fire. */
  renderEmptyState?: (api: { send: (text: string) => void }) => ReactNode;
  className?: string;
}

/** The scrolling transcript, or the empty state before the first message. */
export function ChatBody({
  suggestions = DEFAULT_SUGGESTIONS,
  emptyStateTitle = "What can I help you with?",
  emptyStateDescription = "Watch the agent reason, call tools, and observe results in real time.",
  renderEmptyState,
  className,
}: ChatBodyProps) {
  const { messages, isEmpty, send } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className={cn("scrollbar-thin flex-1 overflow-y-auto", className)}>
      {isEmpty ? (
        renderEmptyState ? (
          renderEmptyState({ send })
        ) : (
          <div className="flex h-full w-full flex-col gap-6 px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold">{emptyStateTitle}</h2>
              {emptyStateDescription && (
                <p className="mt-1 text-sm text-muted-foreground">{emptyStateDescription}</p>
              )}
            </div>
            {suggestions.length > 0 && (
              <div className="flex w-full flex-col gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground/90 transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
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
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────────────────────

/** Handed to `render` so a custom input can drive the conversation. */
export interface ComposerRenderApi {
  /** Send a turn. Ignored while one is already streaming, or if text is blank. */
  send: (text: string) => void;
  /** Abort the streaming turn. */
  stop: () => void;
  /** A turn is in flight. */
  streaming: boolean;
}

export interface ChatInputProps extends ComposerOptions {
  /**
   * Replace the input area outright. You render whatever UI you like and call
   * `send` / `stop` from it.
   */
  render?: (api: ComposerRenderApi) => ReactNode;
}

/** The composer, wired to the conversation. All {@link ComposerOptions} apply. */
export function ChatInput({ render, ...composer }: ChatInputProps) {
  const { send, stop, streaming } = useChat();
  if (render) return <>{render({ send, stop, streaming })}</>;
  return <Composer {...composer} onSend={send} onStop={stop} streaming={streaming} />;
}
