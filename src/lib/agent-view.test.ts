import { describe, expect, it } from "vitest";
import type { TimelineStep } from "../types";
import { effectiveToolSkin, isStepHiddenFor, nl2sqlStyleFor } from "./agent-view";

const tool = (name: string): TimelineStep => ({
  id: "t",
  kind: "tool",
  callId: "c",
  tool: name,
  args: {},
  status: "done",
  progress: [],
  startedAt: 0,
});
const reasoning: TimelineStep = { id: "r", kind: "reasoning", text: "…" };
const selected: TimelineStep = { id: "s", kind: "tool_selected", tool: "web_search" };
const answer: TimelineStep = { id: "a", kind: "answer", text: "done" };

describe("isStepHiddenFor", () => {
  it("shows everything to a developer with explained prose", () => {
    for (const s of [reasoning, selected, tool("execute_sql"), tool("store_learning"), answer]) {
      expect(isStepHiddenFor(s, "developer", "explained")).toBe(false);
    }
  });

  it("hides routing and dev-only tools from a client, keeps the rest", () => {
    expect(isStepHiddenFor(selected, "client", "explained")).toBe(true);
    expect(isStepHiddenFor(tool("store_learning"), "client", "explained")).toBe(true);
    expect(isStepHiddenFor(tool("check_lessons"), "client", "explained")).toBe(true);
    expect(isStepHiddenFor(tool("execute_sql"), "client", "explained")).toBe(false);
    expect(isStepHiddenFor(reasoning, "client", "explained")).toBe(false);
    expect(isStepHiddenFor(answer, "client", "explained")).toBe(false);
  });

  it("plain prose drops narration for either viewer but never a tool call", () => {
    expect(isStepHiddenFor(reasoning, "developer", "plain")).toBe(true);
    expect(isStepHiddenFor(selected, "developer", "plain")).toBe(true);
    expect(isStepHiddenFor(tool("execute_sql"), "developer", "plain")).toBe(false);
    expect(isStepHiddenFor(tool("store_learning"), "developer", "plain")).toBe(false);
  });
});

describe("effectiveToolSkin / nl2sqlStyleFor", () => {
  it("forces the flat skin for a client", () => {
    expect(effectiveToolSkin("client", "terminal")).toBe("flat");
    expect(effectiveToolSkin("developer", "terminal")).toBe("terminal");
  });

  it("maps the view mode to the answer tone", () => {
    expect(nl2sqlStyleFor("client")).toBe("client");
    expect(nl2sqlStyleFor("developer")).toBe("technical");
  });
});
