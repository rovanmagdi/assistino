import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { ChatRoot, useChat, type ChatRootProps } from "./chat-root";
import { ChatBody, ChatHeader, ChatInput, type ComposerRenderApi } from "./chat-parts";
import type { ComposerOptions } from "./composer";
import { cn } from "../lib/utils";

export const DEFAULT_SUGGESTIONS = [
  "Search the web for the latest news on AI agents",
  "Find LinkedIn candidates for a senior backend role",
  "What HR positions are open in my company?",
];

/** Class hooks for the default empty state — see {@link AssistinoChatProps.bodyClassNames}. */
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

/** The welcome screen <AssistinoChat /> shows before the first message. */
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

export type { ComposerRenderApi } from "./chat-parts";

/** Props of the packaged widget — every one of them optional. */
export interface AssistinoChatProps extends Omit<ChatRootProps, "children"> {
  /** Prompts offered on the empty state. Pass [] for none. */
  suggestions?: string[];
  /** Empty-state heading. Defaults to "What can I help you with?". */
  emptyStateTitle?: ReactNode;
  /** Line under the empty-state heading. Pass `null` for none. */
  emptyStateDescription?: ReactNode;
  /** Restyle the empty state — see {@link ChatBodyClassNames}. */
  bodyClassNames?: ChatBodyClassNames;
  /** Icon shown above the empty-state heading. Pass `null` for none. */
  emptyStateIcon?: ReactNode;
  /** Header title. Defaults to "ReAct Agent". */
  title?: string;
  /** Header subtitle. Defaults to "Reasoning · Tools · Observation". */
  subtitle?: string;
  /** Hide the header strip (title, clear button, theme toggle, settings). */
  showHeader?: boolean;
  /** Show the light/dark switch inside the header. Defaults to `false`. */
  showThemeToggle?: boolean;
  /**
   * Show the settings (gear) menu in the header: appearance, brand presets,
   * custom colors, and the timeline node style. Defaults to `false`.
   */
  showSettings?: boolean;
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
}

/**
 * The full chat experience: header, streamed transcript with the ReAct
 * timeline, and the composer — the default composition of the three parts.
 *
 * Renders a single flex column that fills its parent, so the host controls
 * placement and size:
 *
 * ```tsx
 * <div style={{ height: "70vh" }}>
 *   <AssistinoChat apiBaseUrl="https://engine.example.com" />
 * </div>
 * ```
 *
 * To arrange the parts yourself, use <ChatRoot /> with <ChatHeader />,
 * <ChatBody />, and <ChatInput /> (also available as `AssistinoChat.Root`,
 * `.Header`, `.Body`, `.Input`).
 */
export function ChatPage({
  title = "ReAct Agent",
  subtitle = "Reasoning · Tools · Observation",
  showHeader = true,
  showThemeToggle,
  showSettings,
  suggestions,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateIcon,
  bodyClassNames,
  placeholder,
  composer,
  renderComposer,
  ...root
}: AssistinoChatProps = {}) {
  return (
    <ChatRoot {...root}>
      {showHeader && (
        <ChatHeader
          icon={
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
          }
          title={title}
          subtitle={subtitle}
          showThemeToggle={showThemeToggle}
          showSettings={showSettings}
        />
      )}
      <ChatBody>
        <DefaultEmptyState
          suggestions={suggestions}
          title={emptyStateTitle}
          description={emptyStateDescription}
          icon={emptyStateIcon}
          classNames={bodyClassNames}
        />
      </ChatBody>
      <ChatInput
        {...composer}
        placeholder={composer?.placeholder ?? placeholder}
        render={renderComposer}
      />
    </ChatRoot>
  );
}

/**
 * Public name for the widget. `ChatPage` stays exported under its old name so
 * the demo app and existing imports keep working. The parts hang off it for
 * the compound-component style:
 *
 * ```tsx
 * <AssistinoChat.Root apiBaseUrl="…">
 *   <AssistinoChat.Header title="Support" />
 *   <AssistinoChat.Body />
 *   <AssistinoChat.Input placeholder="Ask anything…" />
 * </AssistinoChat.Root>
 * ```
 */
export const AssistinoChat = Object.assign(ChatPage, {
  Root: ChatRoot,
  Header: ChatHeader,
  Body: ChatBody,
  Input: ChatInput,
});
