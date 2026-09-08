export type Role = "user" | "assistant";

/** One node in the ReAct vertical-rail timeline. */
export type TimelineStep =
  /** 1. Reasoning — the model's stated rationale before acting. */
  | { id: string; kind: "reasoning"; text: string }
  /** 2. Determine tool — which tool the model picked. */
  | { id: string; kind: "tool_selected"; tool: string; revealDelayMs?: number }
  /** 3. Tool call — the call itself (args + live progress while running). */
  | {
      id: string;
      kind: "tool";
      callId: string;
      tool: string;
      args: Record<string, unknown>;
      status: "running" | "done" | "error";
      /** Real-time progress lines emitted while the tool runs. */
      progress: { text: string; time: string }[];
      revealDelayMs?: number;
    }
  /** 4. Observation — the tool's result, fed back to the model. */
  | { id: string; kind: "observation"; tool: string; result: string; isError: boolean }
  /**
   * Content the model streamed in a turn that also called a tool — not yet
   * known to be the final answer. Promoted to "answer" if the loop ends here.
   */
  | { id: string; kind: "explaining"; text: string }
  /** 5. Final answer. */
  | { id: string; kind: "answer"; text: string };

export interface ChatMessage {
  id: string;
  role: Role;
  /** User text, or the assistant's final answer (mirrors the last answer step). */
  content: string;
  /** Assistant-only: the full ReAct loop. */
  steps?: TimelineStep[];
  /** Assistant-only: true while the SSE stream is active. */
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
