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
  /**
   * The header's content — whatever you like, laid out in the space before
   * the built-in buttons:
   *
   * ```tsx
   * <ChatHeader>
   *   <span className="text-lg font-bold">Welcome to Tendrix AI Chat</span>
   * </ChatHeader>
   * ```
   *
   * Nothing renders there by default. The `icon`, `title`, and `subtitle`
   * props are a shortcut for the badge + two-line layout; `children` wins
   * when both are given.
   */
  children?: ReactNode;
  /** Title text for the two-line layout. No default. */
  title?: ReactNode;
  /** Subtitle under the title. No default. */
  subtitle?: ReactNode;
  /** Badge before the title. No default. */
  icon?: ReactNode;
  /** Extra controls rendered beside the built-in buttons. */
  actions?: ReactNode;
  /** Show the Clear button once there are messages. Defaults to `true`. */
  showClear?: boolean;
  /** Show the light/dark switch. Defaults to `false`. */
  showThemeToggle?: boolean;
  /** Show the settings (gear) menu. Defaults to `false`. */
  showSettings?: boolean;
  className?: string;
}

/** Title strip with the clear, theme, and settings controls. */
export function ChatHeader({
  children,
  title,
  subtitle,
  icon,
  actions,
  showClear = true,
  showThemeToggle = false,
  showSettings = false,
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

  const content =
    children !== undefined ? (
      children
    ) : (
      <>
        {icon}
        {(title || subtitle) && (
          <div className="min-w-0">
            {title && <h1 className="text-sm font-semibold leading-none">{title}</h1>}
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        )}
      </>
    );

  return (
    <header
      className={cn("flex items-center gap-3 border-b border-border px-4 py-3", className)}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">{content}</div>
      {actions}
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
  /**
   * Replace the sparkle badge above the empty-state heading — any node, e.g.
   * `<img src={logo} />` or a lucide icon. Pass `null` for none.
   */
  icon?: ReactNode;
  /** Replace the whole empty state. Gets `send` so custom prompts can fire. */
  renderEmptyState?: (api: { send: (text: string) => void }) => ReactNode;
  /**
   * Restyle pieces of the empty state. Classes are merged onto the defaults
   * (conflicting Tailwind utilities are resolved in your favor):
   *
   * ```tsx
   * <ChatBody classNames={{ title: "text-2xl text-primary", description: "hidden" }} />
   * ```
   */
  classNames?: ChatBodyClassNames;
  className?: string;
}

export interface ChatBodyClassNames {
  /** The empty-state container (a flex column). */
  emptyState?: string;
  /** The heading. */
  title?: string;
  /** The line under the heading. */
  description?: string;
  /** The list wrapping the suggestion buttons. */
  suggestions?: string;
  /** Each suggestion button. */
  suggestion?: string;
  /** The transcript container once there are messages. */
  transcript?: string;
}

/** The scrolling transcript, or the empty state before the first message. */
export function ChatBody({
  suggestions = DEFAULT_SUGGESTIONS,
  emptyStateTitle = "What can I help you with?",
  emptyStateDescription = "Watch the agent reason, call tools, and observe results in real time.",
  icon,
  renderEmptyState,
  classNames,
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
          <div className={cn("flex h-full w-full flex-col gap-6 px-4", classNames?.emptyState)}>
            {icon === undefined ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles className="h-7 w-7" />
              </div>
            ) : (
              icon
            )}
            <div>
              <h2 className={cn("font-heading text-xl font-semibold", classNames?.title)}>
                {emptyStateTitle}
              </h2>
              {emptyStateDescription && (
                <p className={cn("mt-1 text-sm text-muted-foreground", classNames?.description)}>
                  {emptyStateDescription}
                </p>
              )}
            </div>
            {suggestions.length > 0 && (
              <div className={cn("flex w-full flex-col gap-2", classNames?.suggestions)}>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className={cn(
                      "rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground/90 transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary",
                      classNames?.suggestion,
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      ) : (
        <div className={cn("w-full space-y-6 px-4 py-6", classNames?.transcript)}>
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
