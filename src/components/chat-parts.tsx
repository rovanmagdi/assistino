import { useEffect, useRef, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
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

export interface ChatBodyProps {
  /**
   * What to show before the first message — a welcome, a logo, your own
   * prompt buttons. Nothing renders by default. Call `useChat().send` from
   * inside it to fire a prompt:
   *
   * ```tsx
   * <ChatBody>
   *   <Welcome />
   * </ChatBody>
   * ```
   */
  children?: ReactNode;
}

/** The scrolling transcript, or `children` before the first message. */
export function ChatBody({ children }: ChatBodyProps) {
  const { messages, isEmpty } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto">
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
