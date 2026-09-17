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

export { streamChat, answerQuestion, DEFAULT_CHAT_PATH, DEFAULT_ANSWER_PATH } from "./lib/sse";
export type { ChatRequestMessage, StreamChatOptions, AnswerQuestionOptions } from "./lib/sse";

export { AgentTimeline } from "./components/agent-timeline";
export type { AgentTimelineProps } from "./components/agent-timeline";
export { TimelineNode, REASONING_TYPE_SPEED_MS } from "./components/timeline-node";
export type { TimelineNodeProps } from "./components/timeline-node";
export { AssistantMessage, UserMessage } from "./components/message";
export type { AssistantMessageProps } from "./components/message";
export { TOOL_SKIN_BODIES, FlatToolBody, TerminalToolBody } from "./components/tool-skins";
export type { ToolBodyProps } from "./components/tool-skins";
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
export {
  COLOR_THEMES,
  COLOR_THEME_OPTIONS,
  BRAND_THEMES,
  colorThemeOptions,
  colorThemeVars,
  mergeColorThemes,
} from "./lib/color-themes";
export type {
  BrandTheme,
  ColorTheme,
  ColorThemeMap,
  ColorThemeOption,
  ColorThemeOverrides,
  CssVars,
  CustomColorKey,
  Mode,
  NodeStyle,
  ThemeDefinition,
} from "./lib/color-themes";
export { useChatSettings } from "./lib/use-chat-settings";
export type { ChatSettingsOptions } from "./lib/use-chat-settings";
export {
  DEV_ONLY_TOOLS,
  PROSE_LEVELS,
  RESPONSE_LENGTHS,
  TOOL_SKINS,
  VIEW_MODES,
  effectiveToolSkin,
  isDevOnlyTool,
  isStepHiddenFor,
  nl2sqlStyleFor,
} from "./lib/agent-view";
export type { Prose, ResponseLength, ToolSkin, ViewMode } from "./lib/agent-view";
export { summarizeObservation } from "./lib/summarize-observation";
export type { SummarizedObservation } from "./lib/summarize-observation";

export type {
  AgentEvent,
  ChatMessage,
  OptionPreview,
  Role,
  SubEventDetail,
  TimelineStep,
} from "./types";
