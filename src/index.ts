/**
 * Public entry point of @assistino/react-agent-chat.
 *
 * The one import most consumers need is <AssistinoChat />; everything below it
 * is exported so the widget can be taken apart and rebuilt — a custom shell
 * around the timeline, a headless client, your own tool renderers.
 *
 * Styles are a separate file (no CSS is imported here, so a consumer bundling
 * for SSR doesn't trip over it):
 *
 *     import "@assistino/react-agent-chat/style.css";
 */

// ── the widget ────────────────────────────────────────────────────────────────
export { AssistinoChat, ChatPage } from "./components/chat-page";
export type { AssistinoChatProps, ComposerRenderApi } from "./components/chat-page";

// ── transport: talk to the ReAct backend without the UI ───────────────────────
export { streamChat, DEFAULT_CHAT_PATH } from "./lib/sse";
export type { ChatRequestMessage, StreamChatOptions } from "./lib/sse";

// ── parts, for building a different shell ─────────────────────────────────────
export { AgentTimeline } from "./components/agent-timeline";
export { TimelineNode, REASONING_TYPE_SPEED_MS } from "./components/timeline-node";
export { AssistantMessage, UserMessage } from "./components/message";
export { Composer } from "./components/composer";
export type { ComposerOptions, ComposerActions } from "./components/composer";
export { Markdown } from "./components/markdown";
export { ThemeToggle } from "./components/theme-toggle";
export { SettingsMenu } from "./components/settings-menu";
export type { SettingsMenuProps } from "./components/settings-menu";
export { CustomColorPicker } from "./components/color-picker";
export { ToolResult } from "./components/tools/tool-result";
export { Button } from "./components/ui/button";
export type { ButtonProps } from "./components/ui/button";

// ── helpers ───────────────────────────────────────────────────────────────────
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
export { themeTokensToVars } from "./lib/theme-tokens";
export type { ThemeTokens } from "./lib/theme-tokens";
export { COLOR_THEMES, COLOR_THEME_OPTIONS, colorThemeVars } from "./lib/color-themes";
export type { ColorTheme, CustomColorKey, Mode, NodeStyle } from "./lib/color-themes";
export { useChatSettings } from "./lib/use-chat-settings";
export type { ChatSettingsOptions } from "./lib/use-chat-settings";

// ── domain types ──────────────────────────────────────────────────────────────
export type { AgentEvent, ChatMessage, Role, TimelineStep } from "./types";
