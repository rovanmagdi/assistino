export type Role = "user" | "assistant";

/** One node in the ReAct vertical-rail timeline. */
export type TimelineStep =
  | { id: string; kind: "reasoning"; text: string }
  | { id: string; kind: "tool_selected"; tool: string; revealDelayMs?: number }
  /** Tool call — the outer agent's own, or a sub-agent's inner call promoted to a peer node. */
  | {
      id: string;
      kind: "tool";
      callId: string;
      tool: string;
      args: Record<string, unknown>;
      status: "running" | "done" | "error";
      progress: { text: string; time: string }[];
      /** Only for a promoted inner call — its result, rendered inline. */
      observation?: string;
      revealDelayMs?: number;
      /** Date.now() when the call started; drives the elapsed-time badge. */
      startedAt: number;
    }
  | { id: string; kind: "observation"; tool: string; result: string; isError: boolean }
  /** Streamed text not yet known to be final; promoted to "answer" on done. */
  | { id: string; kind: "explaining"; text: string }
  | { id: string; kind: "answer"; text: string }
  /** Human-in-the-loop question; the run is paused server-side until answered. */
  | {
      id: string;
      kind: "human_question";
      questionId: string;
      question: string;
      options: string[];
      context?: string;
      /** Parallel to `options`; present when the server previewed each reading. */
      previews?: OptionPreview[];
      answered: boolean;
      answer?: string;
    };

/** What one previewed reading of an ambiguous question returned. Mirrors the engine payload. */
export interface OptionPreview {
  label: string;
  summary: string;
  count: number | null;
  samples: string[];
  error: string;
}

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

/** Payload of a `tool_sub_event` — a sub-agent's own step. */
export type SubEventDetail =
  | { kind: "sub_thought"; text: string }
  | { kind: "sub_tool_start"; tool: string; args: Record<string, unknown> }
  | { kind: "sub_tool_result"; tool: string; observation: string }
  | {
      kind: "human_question";
      question_id: string;
      question: string;
      options: string[];
      context?: string;
      previews?: OptionPreview[];
    };

/** Normalized events produced by the SSE client. */
export type AgentEvent =
  | { kind: "thought"; content: string }
  | { kind: "tool_start"; callId: string; tool: string; args: Record<string, unknown> }
  | { kind: "tool_progress"; callId: string; tool: string; message: string }
  | { kind: "tool_sub_event"; callId: string; tool: string; detail: SubEventDetail }
  | { kind: "tool_end"; callId: string; tool: string; result: string }
  | { kind: "text"; content: string }
  | { kind: "error"; message: string }
  | { kind: "done" };
