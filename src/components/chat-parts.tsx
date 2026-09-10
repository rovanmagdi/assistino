import { useEffect, useRef, type ReactNode } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Composer, type ComposerOptions } from "./composer";
import { ThemeToggle } from "./theme-toggle";
import { SettingsMenu } from "./settings-menu";
import { AssistantMessage, UserMessage } from "./message";
import { cn } from "../lib/utils";
import type { NodeStyle } from "../lib/color-themes";
import { useChat } from "./chat-root";

export interface ChatHeaderProps {
  /** Header content before the built-in buttons. Wins over `icon`/`title`/`subtitle`. */
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
        <Button
          size="sm"
          variant="ghost"
          onClick={clear}
          className="hover:bg-primary/10 hover:text-primary"
        >
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
          colorThemeOptions={settings.themeOptions}
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

export interface ChatBodyProps {
  /** Shown before the first message, e.g. {@link DefaultEmptyState}. Nothing by default. */
  children?: ReactNode;
  /** Pin the rail markers to `"icons"` or `"dots"`, overriding the settings menu. */
  nodeStyle?: NodeStyle;
  className?: string;
}

/** The scrolling transcript, or `children` before the first message. */
export function ChatBody({ children, nodeStyle, className }: ChatBodyProps) {
  const { messages, isEmpty, settings } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const effectiveNodeStyle = nodeStyle ?? settings.nodeStyle;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div
      className={cn(
        "scrollbar-thin flex-1 overflow-y-auto",
        effectiveNodeStyle === "dots" && "node-style-dots",
        className,
      )}
    >
      {isEmpty ? (
        children
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

export const DEFAULT_SUGGESTIONS = [
  "Search the web for the latest news on AI agents",
  "Find LinkedIn candidates for a senior backend role",
  "What HR positions are open in my company?",
];

/** Class hooks for {@link DefaultEmptyState}. */
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
}

/** Ready-made welcome screen for `<ChatBody />` with suggestion buttons that send their text. */
export function DefaultEmptyState({
  suggestions = DEFAULT_SUGGESTIONS,
  title = "What can I help you with?",
  description = "Watch the agent reason, call tools, and observe results in real time.",
  icon,
  classNames,
}: {
  suggestions?: string[];
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  classNames?: ChatBodyClassNames;
}) {
  const { send } = useChat();
  return (
    <div className={cn("flex h-full w-full flex-col gap-6 px-4", classNames?.emptyState)}>
      {icon === undefined ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Sparkles className="h-7 w-7" />
        </div>
      ) : (
        icon
      )}
      <div>
        <h2 className={cn("font-heading text-xl font-semibold", classNames?.title)}>{title}</h2>
        {description && (
          <p className={cn("mt-1 text-sm text-muted-foreground", classNames?.description)}>
            {description}
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
  );
}

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
  /** Replace the input area entirely; call `send` / `stop` from your own UI. */
  render?: (api: ComposerRenderApi) => ReactNode;
}

/** The composer, wired to the conversation. All {@link ComposerOptions} apply. */
export function ChatInput({ render, ...composer }: ChatInputProps) {
  const { send, stop, streaming } = useChat();
  if (render) return <>{render({ send, stop, streaming })}</>;
  return <Composer {...composer} onSend={send} onStop={stop} streaming={streaming} />;
}
