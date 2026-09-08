import type { AgentEvent } from "../types";

/** One prior turn sent back to the model as conversation history. */
export interface ChatRequestMessage {
  role: "user" | "assistant";
  content: string;
}

/** Where and how the widget talks to the ReAct backend. */
export interface StreamChatOptions {
  /**
   * Origin of the FastAPI server, e.g. "https://engine.example.com". Leave it
   * empty (the default) to hit same-origin paths — which is what the demo app
   * does, since Vite proxies /v1 and /api to :8000 in dev (vite.config.ts).
   */
  baseUrl?: string;
  /** Path of the SSE chat endpoint on that origin. */
  path?: string;
  /** Model id sent in the request body; the server treats it as a label. */
  model?: string;
  /** Extra request headers — an Authorization bearer, a tenant id, … */
  headers?: Record<string, string>;
  /**
   * Identifies the conversation across turns. `messages` alone is not enough:
   * the server keeps the query results behind each answer so a follow-up like
   * "now chart it" can plot the SAME numbers instead of re-running the query,
   * and it needs a key to file them under.
   */
  sessionId?: string;
  /** Aborts the stream (the widget wires this to its Stop button). */
  signal?: AbortSignal;
  /** Sends cookies on the request — needed when the API is on another origin. */
  credentials?: RequestCredentials;
  /** Swap in a custom fetch (auth refresh, instrumentation, tests). */
  fetch?: typeof fetch;
}

export const DEFAULT_CHAT_PATH = "/v1/chat/completions";

/**
 * Stream a chat turn from the ReAct agent.
 *
 * POSTs the conversation history to the chat-completions SSE endpoint
 * (server.py) and yields normalized {@link AgentEvent}s as they arrive. The
 * server's OpenAI-flavored wire format is translated here into the compact
 * event kinds the UI consumes (thought / tool_start / tool_progress /
 * tool_end / text / error / done).
 */
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
  } = options;

  const res = await fetchImpl(`${baseUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      session_id: sessionId,
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

      // SSE frames are separated by a blank line.
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);

        // A frame may contain multiple `data:` lines; join their payloads.
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
          continue; // ignore non-JSON keep-alives / comments
        }

        const evt = mapEvent(obj);
        if (evt) yield evt;
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}

/** Translate one server SSE object into a normalized AgentEvent (or null to skip). */
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
  }

  // OpenAI-style chat completion chunk → streamed answer text.
  const choices = obj.choices as
    | Array<{ delta?: { content?: string } }>
    | undefined;
  if (choices && choices.length > 0) {
    const content = choices[0]?.delta?.content;
    if (content) return { kind: "text", content };
  }

  return null;
}
