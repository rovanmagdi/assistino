import type { AgentEvent, SubEventDetail } from "../types";
import type { ResponseLength } from "./agent-view";

/** One prior turn sent back to the model as conversation history. */
export interface ChatRequestMessage {
  role: "user" | "assistant";
  content: string;
}

/** Where and how the widget talks to the ReAct backend. */
export interface StreamChatOptions {
  /** Origin of the backend. Empty (default) means same-origin. */
  baseUrl?: string;
  /** Path of the SSE chat endpoint on that origin. */
  path?: string;
  /** Model id sent in the request body; the server treats it as a label. */
  model?: string;
  /** Extra request headers. */
  headers?: Record<string, string>;
  /** Conversation id; the server files per-conversation query results under it. */
  sessionId?: string;
  /** Aborts the stream. */
  signal?: AbortSignal;
  /** Sends cookies cross-origin. */
  credentials?: RequestCredentials;
  /** Swap in a custom fetch (auth refresh, instrumentation, tests). */
  fetch?: typeof fetch;
  /** Sent as `nl2sql_style`; omitted when unset. */
  nl2sqlStyle?: "technical" | "client";
  /** Sent as `nl2sql_length`; omitted when unset. */
  nl2sqlLength?: ResponseLength;
}

export const DEFAULT_CHAT_PATH = "/v1/chat/completions";
export const DEFAULT_ANSWER_PATH = "/api/chat/answer";

/** POST the history to the SSE endpoint and yield normalized {@link AgentEvent}s. */
export async function* streamChat(
  messages: ChatRequestMessage[],
  options: StreamChatOptions = {},
): AsyncGenerator<AgentEvent> {
  const {
    baseUrl = "",
    path = DEFAULT_CHAT_PATH,
    model = "react-agent",
    headers,
    sessionId,
    signal,
    credentials,
    // Unbound `fetch` throws "Illegal invocation" in Chrome, hence the bind.
    fetch: fetchImpl = globalThis.fetch.bind(globalThis),
    nl2sqlStyle,
    nl2sqlLength,
  } = options;

  const res = await fetchImpl(`${baseUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      session_id: sessionId,
      ...(nl2sqlStyle ? { nl2sql_style: nl2sqlStyle } : {}),
      ...(nl2sqlLength ? { nl2sql_length: nl2sqlLength } : {}),
    }),
    credentials,
    signal,
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status})${detail ? `: ${detail}` : ""}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);

        const payload = frame
          .split("\n")
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).trim())
          .join("");
        if (!payload) continue;

        if (payload === "[DONE]") {
          yield { kind: "done" };
          return;
        }

        let obj: Record<string, unknown>;
        try {
          obj = JSON.parse(payload);
        } catch {
          continue;
        }

        const evt = mapEvent(obj);
        if (evt) yield evt;
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}

function mapEvent(obj: Record<string, unknown>): AgentEvent | null {
  const type = obj.type as string | undefined;

  switch (type) {
    case "tool_status":
      return { kind: "thought", content: String(obj.content ?? "") };

    case "tool_start":
      return {
        kind: "tool_start",
        callId: String(obj.tool_call_id ?? ""),
        tool: String(obj.tool_name ?? ""),
        args: (obj.arguments as Record<string, unknown>) ?? {},
      };

    case "tool_progress":
      return {
        kind: "tool_progress",
        callId: String(obj.tool_call_id ?? ""),
        tool: String(obj.tool_name ?? ""),
        message: String(obj.message ?? ""),
      };

    case "tool_end":
      return {
        kind: "tool_end",
        callId: String(obj.tool_call_id ?? ""),
        tool: String(obj.tool_name ?? ""),
        result: String(obj.result ?? ""),
      };

    case "tool_sub_event":
      return {
        kind: "tool_sub_event",
        callId: String(obj.tool_call_id ?? ""),
        tool: String(obj.tool_name ?? ""),
        detail: obj.detail as SubEventDetail,
      };
  }

  const choices = obj.choices as
    | Array<{ delta?: { content?: string } }>
    | undefined;
  if (choices && choices.length > 0) {
    const content = choices[0]?.delta?.content;
    if (content) return { kind: "text", content };
  }

  return null;
}

/** Transport for {@link answerQuestion} — same origin and headers as the chat stream. */
export type AnswerQuestionOptions = Pick<
  StreamChatOptions,
  "baseUrl" | "headers" | "credentials" | "signal" | "fetch"
> & {
  /** Path of the answer endpoint on that origin. */
  path?: string;
};

/** Resume a run paused on a `human_question`; the open SSE stream continues on its own. */
export async function answerQuestion(
  questionId: string,
  answer: string,
  options: AnswerQuestionOptions = {},
): Promise<void> {
  const {
    baseUrl = "",
    path = DEFAULT_ANSWER_PATH,
    headers,
    credentials,
    signal,
    fetch: fetchImpl = globalThis.fetch.bind(globalThis),
  } = options;

  const res = await fetchImpl(`${baseUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ question_id: questionId, answer }),
    credentials,
    signal,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Answer failed (${res.status})${detail ? `: ${detail}` : ""}`);
  }
}
