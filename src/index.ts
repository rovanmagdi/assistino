export { ChatRoot, useChat } from "./components/chat-root";
export type { ChatRootProps, ChatContextValue } from "./components/chat-root";
export {
  ChatHeader,
  ChatBody,
  ChatInput,
  DefaultEmptyState,
  DEFAULT_SUGGESTIONS,
} from "./components/chat-parts";
export type {
  ChatHeaderProps,
  ChatBodyProps,
  ChatBodyClassNames,
  ChatInputProps,
  ComposerRenderApi,
} from "./components/chat-parts";

export { streamChat, DEFAULT_CHAT_PATH } from "./lib/sse";
export type { ChatRequestMessage, StreamChatOptions } from "./lib/sse";

export { AgentTimeline } from "./components/agent-timeline";
export { TimelineNode, REASONING_TYPE_SPEED_MS } from "./components/timeline-node";
export { AssistantMessage, UserMessage } from "./components/message";
export { Composer } from "./components/composer";
export type { ComposerOptions, ComposerClassNames, ComposerActions } from "./components/composer";
export { Markdown } from "./components/markdown";
export { ThemeToggle } from "./components/theme-toggle";
export { SettingsMenu } from "./components/settings-menu";
export type { SettingsMenuProps } from "./components/settings-menu";
export { CustomColorPicker } from "./components/color-picker";
export { ToolResult } from "./components/tools/tool-result";
export { Button } from "./components/ui/button";
export type { ButtonProps } from "./components/ui/button";

export { normalizeResult } from "./lib/tool-results";
export type {
  ActionAttr,
  ChartRef,
  LinkedInProfile,
  NormalizedResult,
} from "./lib/tool-results";
export { cn, newSessionId, nowTime, uid } from "./lib/utils";
export { useTheme } from "./lib/use-theme";
export type { ThemePreference, ResolvedTheme } from "./lib/use-theme";
export { COLOR_THEMES, COLOR_THEME_OPTIONS, colorThemeVars } from "./lib/color-themes";
export type { ColorTheme, CustomColorKey, Mode, NodeStyle } from "./lib/color-themes";
export { useChatSettings } from "./lib/use-chat-settings";
export type { ChatSettingsOptions } from "./lib/use-chat-settings";

export type { AgentEvent, ChatMessage, Role, TimelineStep } from "./types";
