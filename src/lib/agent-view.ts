import type { TimelineStep } from "../types";

/** Who is viewing: "client" hides internal steps, "developer" shows everything. */
export type ViewMode = "client" | "developer";

/** How a tool node is drawn. Register new skins in tool-skins/index.ts. */
export type ToolSkin = "flat" | "terminal";

/** Narration density: "plain" drops reasoning and progress lines for an elapsed-time badge. */
export type Prose = "explained" | "plain";

/** Length of the final answer, sent to the backend as `nl2sql_length`. */
export type ResponseLength = "short" | "medium" | "long";

export const VIEW_MODES: readonly ViewMode[] = ["client", "developer"];
export const TOOL_SKINS: readonly ToolSkin[] = ["flat", "terminal"];
export const PROSE_LEVELS: readonly Prose[] = ["explained", "plain"];
export const RESPONSE_LENGTHS: readonly ResponseLength[] = ["short", "medium", "long"];

export const isViewMode = (v: unknown): v is ViewMode => VIEW_MODES.includes(v as ViewMode);
export const isToolSkin = (v: unknown): v is ToolSkin => TOOL_SKINS.includes(v as ToolSkin);
export const isProse = (v: unknown): v is Prose => PROSE_LEVELS.includes(v as Prose);
export const isResponseLength = (v: unknown): v is ResponseLength =>
  RESPONSE_LENGTHS.includes(v as ResponseLength);

/** Tools a client never sees — removed from the DOM, not relabeled. */
export const DEV_ONLY_TOOLS = new Set<string>(["store_learning", "check_lessons"]);

export function isDevOnlyTool(tool: string): boolean {
  return DEV_ONLY_TOOLS.has(tool);
}

/** True when `step` must not render for this view mode / prose. */
export function isStepHiddenFor(step: TimelineStep, viewMode: ViewMode, prose: Prose): boolean {
  if (prose === "plain" && (step.kind === "reasoning" || step.kind === "tool_selected")) return true;
  if (viewMode !== "client") return false;
  if (step.kind === "tool_selected") return true;
  if (step.kind === "tool") return isDevOnlyTool(step.tool);
  return false;
}

/** Client always gets the flat skin. */
export function effectiveToolSkin(viewMode: ViewMode, skin: ToolSkin): ToolSkin {
  return viewMode === "client" ? "flat" : skin;
}

/** Answer tone requested from the backend; follows the view mode. */
export function nl2sqlStyleFor(viewMode: ViewMode): "client" | "technical" {
  return viewMode === "client" ? "client" : "technical";
}
