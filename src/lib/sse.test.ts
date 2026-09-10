import { describe, expect, it, vi } from "vitest";
import type { AgentEvent } from "../types";
import { DEFAULT_CHAT_PATH, streamChat } from "./sse";

/** Build a fetch stub that streams `frames` (already SSE-formatted) in the given chunks. */
function fakeFetch(chunks: string[], init: Partial<Response> = {}) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = vi.fn(async (url: string | URL | Request, reqInit?: RequestInit) => {
    calls.push({ url: String(url), init: reqInit ?? {} });
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const c of chunks) controller.enqueue(encoder.encode(c));
        controller.close();
      },
    });
    return new Response(body, { status: 200, ...init });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

const data = (obj: unknown) => `data: ${JSON.stringify(obj)}\n\n`;

async function collect(gen: AsyncGenerator<AgentEvent>): Promise<AgentEvent[]> {
  const out: AgentEvent[] = [];
  for await (const e of gen) out.push(e);
  return out;
}

describe("streamChat request", () => {
  it("posts to baseUrl + default path with history, session and headers", async () => {
    const { fetchImpl, calls } = fakeFetch(["data: [DONE]\n\n"]);
    await collect(
      streamChat([{ role: "user", content: "hi" }], {
        baseUrl: "https://api.example.com/",
        headers: { Authorization: "Bearer t" },
        sessionId: "s1",
        credentials: "include",
        fetch: fetchImpl,
      }),
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`https://api.example.com${DEFAULT_CHAT_PATH}`);
    const { init } = calls[0];
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer t",
    });
    expect(JSON.parse(String(init.body))).toEqual({
      model: "react-agent",
      messages: [{ role: "user", content: "hi" }],
      stream: true,
      session_id: "s1",
    });
  });

  it("honours a custom path and model", async () => {
    const { fetchImpl, calls } = fakeFetch(["data: [DONE]\n\n"]);
    await collect(
      streamChat([], { baseUrl: "http://x", path: "/chat", model: "m", fetch: fetchImpl }),
    );
    expect(calls[0].url).toBe("http://x/chat");
    expect(JSON.parse(String(calls[0].init.body)).model).toBe("m");
  });

  it("throws with status and body text on a non-2xx response", async () => {
    const { fetchImpl } = fakeFetch(["nope"], { status: 500 });
    await expect(collect(streamChat([], { fetch: fetchImpl }))).rejects.toThrow(
      "Request failed (500): nope",
    );
  });
});

describe("streamChat event mapping", () => {
  it("maps every backend event type to a normalized AgentEvent", async () => {
    const { fetchImpl } = fakeFetch([
      data({ type: "tool_status", content: "thinking" }),
      data({ type: "tool_start", tool_call_id: "c1", tool_name: "web_search", arguments: { q: "x" } }),
      data({ type: "tool_progress", tool_call_id: "c1", tool_name: "web_search", message: "50%" }),
      data({ type: "tool_end", tool_call_id: "c1", tool_name: "web_search", result: "ok" }),
      data({ choices: [{ delta: { content: "Hel" } }] }),
      data({ choices: [{ delta: { content: "lo" } }] }),
      "data: [DONE]\n\n",
    ]);

    const events = await collect(streamChat([], { fetch: fetchImpl }));
    expect(events).toEqual([
      { kind: "thought", content: "thinking" },
      { kind: "tool_start", callId: "c1", tool: "web_search", args: { q: "x" } },
      { kind: "tool_progress", callId: "c1", tool: "web_search", message: "50%" },
      { kind: "tool_end", callId: "c1", tool: "web_search", result: "ok" },
      { kind: "text", content: "Hel" },
      { kind: "text", content: "lo" },
      { kind: "done" },
    ]);
  });

  it("reassembles frames split across chunk boundaries", async () => {
    const frame = data({ choices: [{ delta: { content: "split" } }] });
    const mid = Math.floor(frame.length / 2);
    const { fetchImpl } = fakeFetch([frame.slice(0, mid), frame.slice(mid), "data: [DONE]\n\n"]);

    const events = await collect(streamChat([], { fetch: fetchImpl }));
    expect(events).toEqual([{ kind: "text", content: "split" }, { kind: "done" }]);
  });

  it("skips malformed JSON, empty deltas, unknown events and comment lines", async () => {
    const { fetchImpl } = fakeFetch([
      ": keep-alive\n\n",
      "data: {not json\n\n",
      data({ choices: [{ delta: {} }] }),
      data({ type: "something_else" }),
      data({ choices: [{ delta: { content: "ok" } }] }),
      "data: [DONE]\n\n",
    ]);

    const events = await collect(streamChat([], { fetch: fetchImpl }));
    expect(events).toEqual([{ kind: "text", content: "ok" }, { kind: "done" }]);
  });

  it("stops at [DONE] and ignores anything after it", async () => {
    const { fetchImpl } = fakeFetch([
      "data: [DONE]\n\n",
      data({ choices: [{ delta: { content: "late" } }] }),
    ]);
    const events = await collect(streamChat([], { fetch: fetchImpl }));
    expect(events).toEqual([{ kind: "done" }]);
  });

  it("ends without a done event when the stream closes early", async () => {
    const { fetchImpl } = fakeFetch([data({ choices: [{ delta: { content: "partial" } }] })]);
    const events = await collect(streamChat([], { fetch: fetchImpl }));
    expect(events).toEqual([{ kind: "text", content: "partial" }]);
  });
});
