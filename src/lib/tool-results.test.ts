import { describe, expect, it } from "vitest";
import { normalizeResult } from "./tool-results";

describe("normalizeResult", () => {
  it("falls back to text for unknown tools and null results", () => {
    expect(normalizeResult("mystery_tool", "hello")).toEqual({ kind: "text", raw: "hello" });
    expect(normalizeResult("mystery_tool", null)).toEqual({ kind: "text", raw: "" });
  });

  describe("web_search", () => {
    it("parses URL/Title/Snippet blocks separated by ---", () => {
      const raw = [
        "Title: First\nURL: https://a.com\nSnippet: alpha",
        "Title: \nURL: https://b.com\nSnippet: beta",
        "Title: Bad\nURL: not-a-url\nSnippet: skip",
      ].join("\n\n---\n\n");

      const r = normalizeResult("web_search", raw);
      expect(r.kind).toBe("websearch");
      if (r.kind !== "websearch") return;
      expect(r.sources).toEqual([
        { url: "https://a.com", title: "First", snippet: "alpha" },
        { url: "https://b.com", title: "https://b.com", snippet: "beta" },
      ]);
    });

    it("returns no sources for prose without URLs", () => {
      const r = normalizeResult("web_search", "nothing found");
      expect(r).toEqual({ kind: "websearch", sources: [], raw: "nothing found" });
    });
  });

  describe("assistino_retrieval", () => {
    it("turns a JSON array into columns and rows", () => {
      const rows = [{ id: 1, name: "a" }, { id: 2, name: "b" }];
      const r = normalizeResult("assistino_retrieval", JSON.stringify(rows));
      expect(r).toMatchObject({ kind: "retrieval", columns: ["id", "name"], rows, totalRows: 2 });
    });

    it("surfaces [Error] results", () => {
      const r = normalizeResult("assistino_retrieval", "[Error] bad sql");
      expect(r).toMatchObject({ kind: "retrieval", error: "[Error] bad sql", rows: [], totalRows: 0 });
    });

    it("falls back to text when the payload is not an array", () => {
      expect(normalizeResult("assistino_retrieval", "plain").kind).toBe("text");
      expect(normalizeResult("assistino_retrieval", '{"a":1}').kind).toBe("text");
    });
  });

  describe("chart_visualisation", () => {
    it("parses charts and coerces counts", () => {
      const raw = JSON.stringify({
        sql: "select 1",
        charted_question: "q",
        row_count: "3",
        rejected: 1,
        charts: [
          { title: "T", chart_type: "bar", insight: "i", file: "c1.json" },
          { title: "no file" },
          null,
        ],
      });
      const r = normalizeResult("chart_visualisation", raw);
      expect(r).toMatchObject({
        kind: "chart",
        sql: "select 1",
        chartedQuestion: "q",
        rowCount: 3,
        rejected: 1,
        charts: [{ title: "T", chartType: "bar", insight: "i", file: "c1.json" }],
      });
    });

    it("defaults a missing title", () => {
      const r = normalizeResult("chart_visualisation", JSON.stringify({ charts: [{ file: "f" }] }));
      if (r.kind !== "chart") throw new Error("expected chart");
      expect(r.charts[0].title).toBe("Untitled chart");
    });

    it("reports errors from either the [Error] prefix or the error field", () => {
      expect(normalizeResult("chart_visualisation", "[Error] boom")).toMatchObject({
        kind: "chart",
        error: "[Error] boom",
        charts: [],
      });
      expect(normalizeResult("chart_visualisation", '{"error":"nope"}')).toMatchObject({
        kind: "chart",
        error: "nope",
      });
    });

    it("falls back to text for non-object JSON", () => {
      expect(normalizeResult("chart_visualisation", "[1,2]").kind).toBe("text");
      expect(normalizeResult("chart_visualisation", "oops").kind).toBe("text");
    });
  });

  describe("assistino_hr_action", () => {
    it("maps accepted/missing attributes, status, nlg and validation errors", () => {
      const raw = JSON.stringify({
        type: "missing",
        action: "create_leave",
        nlg: { message: "Need dates" },
        validation_errors: ["a", "b"],
        acceptedAttributes: [
          { name: "employee", type: "string", required: true, enums: [1, "x"], isArray: false, value: "Bob" },
        ],
        missingAttributes: [{ name: "start_date", label: "Start" }],
      });
      const r = normalizeResult("assistino_hr_action", raw);
      expect(r).toEqual({
        kind: "action",
        status: "missing",
        action: "create_leave",
        nlg: "Need dates",
        error: "a; b",
        accepted: [
          {
            name: "employee",
            type: "string",
            required: true,
            renderType: undefined,
            label: undefined,
            enums: ["1", "x"],
            isArray: false,
            value: "Bob",
          },
        ],
        missing: [
          {
            name: "start_date",
            type: undefined,
            required: false,
            renderType: undefined,
            label: "Start",
            enums: undefined,
            isArray: undefined,
            value: undefined,
          },
        ],
        raw,
      });
    });

    it("defaults status to ready and falls back to text for non-JSON", () => {
      expect(normalizeResult("assistino_hr_action", "{}")).toMatchObject({ kind: "action", status: "ready" });
      expect(normalizeResult("assistino_hr_action", "text").kind).toBe("text");
    });
  });

  describe("linkedin tools", () => {
    it("scraper: one profile, url falls back to the top-level url", () => {
      const raw = JSON.stringify({ url: "https://li/x", profile: { full_name: "A", headline: "H" } });
      expect(normalizeResult("linkedin_url_scraper", raw)).toMatchObject({
        kind: "linkedin",
        total: 1,
        profiles: [{ full_name: "A", headline: "H", profile_url: "https://li/x" }],
      });
    });

    it("scraper: reports failure and missing profile", () => {
      expect(normalizeResult("linkedin_url_scraper", '{"success":false,"error":"blocked"}')).toMatchObject({
        kind: "linkedin",
        error: "blocked",
        profiles: [],
      });
      expect(normalizeResult("linkedin_url_scraper", '{"status":"pending"}')).toMatchObject({
        kind: "linkedin",
        error: "pending",
      });
      expect(normalizeResult("linkedin_url_scraper", "[Error] x")).toMatchObject({ error: "[Error] x" });
    });

    it("finding: maps profiles and picks the first available url field", () => {
      const raw = JSON.stringify({
        total: 2,
        profiles: [{ full_name: "A", linkedin_url: "u1" }, { full_name: "B", url: "u3" }],
      });
      expect(normalizeResult("linkedin_finding_search", raw)).toMatchObject({
        kind: "linkedin",
        total: 2,
        profiles: [{ full_name: "A", profile_url: "u1" }, { full_name: "B", profile_url: "u3" }],
      });
    });

    it("matching: maps scores, confidence and reasons (falling back to match_details)", () => {
      const raw = JSON.stringify({
        total_scored: 5,
        top_matches: [
          { full_name: "A", score: 0.9, confidence: "high", match_reasons: ["r1"] },
          { full_name: "B", match_details: ["d1", 2] },
        ],
      });
      expect(normalizeResult("linkedin_matching_search", raw)).toMatchObject({
        kind: "linkedin",
        total: 5,
        profiles: [
          { full_name: "A", score: 0.9, confidence: "high", match_reasons: ["r1"] },
          { full_name: "B", score: undefined, match_reasons: ["d1", "2"] },
        ],
      });
    });

    it("all three fall back to text for non-JSON", () => {
      for (const t of ["linkedin_url_scraper", "linkedin_finding_search", "linkedin_matching_search"]) {
        expect(normalizeResult(t, "plain").kind).toBe("text");
      }
    });
  });
});
