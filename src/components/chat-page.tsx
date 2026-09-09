import type { ReactNode } from "react";
import { ChatRoot, type ChatRootProps } from "./chat-root";
import {
  ChatBody,
  ChatHeader,
  ChatInput,
  type ChatBodyClassNames,
  type ChatBodyProps,
  type ComposerRenderApi,
} from "./chat-parts";
import type { ComposerOptions } from "./composer";

export type { ComposerRenderApi } from "./chat-parts";

/** Props of the packaged widget — every one of them optional. */
export interface AssistinoChatProps
  extends Omit<ChatRootProps, "children">,
    Pick<ChatBodyProps, "suggestions" | "emptyStateTitle" | "emptyStateDescription"> {
  /** Restyle the empty state and transcript — see {@link ChatBodyClassNames}. */
  bodyClassNames?: ChatBodyClassNames;
  /** Icon shown above the empty-state heading. Pass `null` for none. */
  emptyStateIcon?: ReactNode;
  /** Header title. Defaults to "ReAct Agent". */
  title?: string;
  /** Header subtitle. Defaults to "Reasoning · Tools · Observation". */
  subtitle?: string;
  /** Hide the header strip (title, clear button, theme toggle, settings). */
  showHeader?: boolean;
  /** Hide the light/dark switch inside the header. */
  showThemeToggle?: boolean;
  /**
   * Show the settings (gear) menu in the header: appearance, brand presets,
   * custom colors, and the timeline node style. Defaults to `true`.
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
  title,
  subtitle,
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
          title={title}
          subtitle={subtitle}
          showThemeToggle={showThemeToggle}
          showSettings={showSettings}
        />
      )}
      <ChatBody
        suggestions={suggestions}
        emptyStateTitle={emptyStateTitle}
        emptyStateDescription={emptyStateDescription}
        icon={emptyStateIcon}
        classNames={bodyClassNames}
      />
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
