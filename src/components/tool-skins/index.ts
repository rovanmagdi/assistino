import type { ComponentType } from "react";
import type { ToolSkin } from "../../lib/agent-view";
import type { ToolBodyProps } from "./types";
import { FlatToolBody } from "./flat-tool-body";
import { TerminalToolBody } from "./terminal-tool-body";

export type { ToolBodyProps } from "./types";
export { FlatToolBody, TerminalToolBody };

/** Every `ToolSkin` must have a body here or this fails to typecheck. */
export const TOOL_SKIN_BODIES: Record<ToolSkin, ComponentType<ToolBodyProps>> = {
  flat: FlatToolBody,
  terminal: TerminalToolBody,
};
