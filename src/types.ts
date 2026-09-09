export type Role = "user" | "assistant";

/** One node in the ReAct vertical-rail timeline. */
export type TimelineStep =
  | { id: string; kind: "reasoning"; text: string }
  | { id: string; kind: "tool_selected"; tool: string; revealDelayMs?: number }
  | {
      id: string;
      kind: "tool";
      callId: string;
      tool: string;
      args: Record<string, unknown>;
      status: "running" | "done" | "error";
      progress: { text: string; time: string }[];
      revealDelayMs?: number;
    }
  | { id: string; kind: "observation"; tool: string; result: string; isError: boolean }
  /** Streamed text not yet known to be final; promoted to "answer" on done. */
  | { id: string; kind: "explaining"; text: string }
  | { id: string; kind: "answer"; text: string };

export interface ChatMessage {
  id: string;
  role: Role;
  /** User text, or the assistant's final answer. */
  content: string;
  /** Assistant-only: the full ReAct loop. */
  steps?: TimelineStep[];
  /** Assistant-only: true while streaming. */
  streaming?: boolean;
  error?: string;
}

/** Normalized events produced by the SSE client. */
export type AgentEvent =
  | { kind: "thought"; content: string }
  | { kind: "tool_start"; callId: string; tool: string; args: Record<string, unknown> }
  | { kind: "tool_progress"; callId: string; tool: string; message: string }
  | { kind: "tool_end"; callId: string; tool: string; result: string }
  | { kind: "text"; content: string }
  | { kind: "error"; message: string }
  | { kind: "done" };
