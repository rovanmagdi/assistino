

/** A single LinkedIn profile card. */
export interface LinkedInProfile {
  full_name?: string;
  headline?: string;
  location?: string;
  email?: string;
  score?: number;
  confidence?: string;
  match_reasons?: string[];
  profile_url?: string;
}

/** One field of an HR action form. */
export interface ActionAttr {
  name: string;
  type?: string;
  required?: boolean;
  renderType?: string;
  label?: string;
  enums?: string[];
  isArray?: boolean;
  value?: unknown;
}

/** One chart from chart_visualisation; `file` is fetched from `/api/charts/{file}`. */
export interface ChartRef {
  title: string;
  chartType?: string;
  insight?: string;
  file: string;
}

export type NormalizedResult =
  | { kind: "websearch"; sources: { url: string; title: string; snippet: string }[]; raw: string }
  | {
      kind: "retrieval";
      sql?: string;
      error?: string;
      columns: string[];
      rows: Record<string, unknown>[];
      totalRows: number;
      raw: string;
    }
  | { kind: "linkedin"; error?: string; profiles: LinkedInProfile[]; total?: number; raw: string }
  | {
      kind: "action";
      status: string;
      action?: string;
      nlg?: string;
      error?: string;
      accepted: ActionAttr[];
      missing: ActionAttr[];
      raw: string;
    }
  | {
      kind: "chart";
      sql?: string;
      chartedQuestion?: string;
      error?: string;
      message?: string;
      rowCount: number;
      rejected: number;
      charts: ChartRef[];
      raw: string;
    }
  | { kind: "text"; raw: string };

export function normalizeResult(tool: string, result: string | null): NormalizedResult {
  const raw = result ?? "";

  switch (tool) {
    case "web_search":
      return parseWebSearch(raw);
    case "assistino_retrieval":
      return parseRetrieval(raw);
    case "assistino_hr_action":
      return parseAction(raw);
    case "chart_visualisation":
      return parseChart(raw);
    case "linkedin_url_scraper":
      return parseLinkedInScraper(raw);
    case "linkedin_finding_search":
      return parseLinkedInFinding(raw);
    case "linkedin_matching_search":
      return parseLinkedInMatching(raw);
    default:
      return { kind: "text", raw };
  }
}

function tryJson<T = unknown>(raw: string): T | null {
  const s = raw.trim();
  if (!s || (s[0] !== "{" && s[0] !== "[")) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function isError(raw: string): boolean {
  return raw.trimStart().startsWith("[Error]");
}

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s || undefined;
}

function parseWebSearch(raw: string): NormalizedResult {
  const sources: { url: string; title: string; snippet: string }[] = [];
  for (const block of raw.split(/\n\n-{3,}\n\n/)) {
    const url = /^URL:\s*(.+)$/m.exec(block)?.[1]?.trim();
    if (!url || !/^https?:\/\//i.test(url)) continue;
    const title = /^Title:\s*(.*)$/m.exec(block)?.[1]?.trim() ?? "";
    const snippet = /^Snippet:\s*([\s\S]*?)\s*$/m.exec(block)?.[1]?.trim() ?? "";
    sources.push({ url, title: title || url, snippet });
  }
  return { kind: "websearch", sources, raw };
}

function parseRetrieval(raw: string): NormalizedResult {
  if (isError(raw)) {
    return { kind: "retrieval", error: raw.trim(), columns: [], rows: [], totalRows: 0, raw };
  }
  const parsed = tryJson<Record<string, unknown>[]>(raw);
  if (Array.isArray(parsed)) {
    const rows = parsed.filter((r) => r && typeof r === "object");
    const columns = rows.length ? Object.keys(rows[0]) : [];
    return { kind: "retrieval", columns, rows, totalRows: rows.length, raw };
  }
  return { kind: "text", raw };
}

function parseChart(raw: string): NormalizedResult {
  const empty = { kind: "chart" as const, rowCount: 0, rejected: 0, charts: [], raw };
  if (isError(raw)) return { ...empty, error: raw.trim() };

  const p = tryJson<Record<string, unknown>>(raw);
  if (!p || typeof p !== "object" || Array.isArray(p)) return { kind: "text", raw };
  if (p.error) return { ...empty, error: str(p.error) };

  const charts: ChartRef[] = (Array.isArray(p.charts) ? p.charts : [])
    .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
    .filter((c) => !!str(c.file))
    .map((c) => ({
      title: str(c.title) ?? "Untitled chart",
      chartType: str(c.chart_type),
      insight: str(c.insight),
      file: String(c.file),
    }));

  return {
    ...empty,
    sql: str(p.sql),
    chartedQuestion: str(p.charted_question),
    message: str(p.message),
    rowCount: Number(p.row_count) || 0,
    rejected: Number(p.rejected) || 0,
    charts,
  };
}

function toAttr(a: Record<string, unknown>): ActionAttr {
  return {
    name: String(a.name ?? ""),
    type: str(a.type),
    required: Boolean(a.required),
    renderType: str(a.renderType),
    label: str(a.label),
    enums: Array.isArray(a.enums) ? (a.enums as unknown[]).map(String) : undefined,
    isArray: typeof a.isArray === "boolean" ? a.isArray : undefined,
    value: "value" in a ? a.value : undefined,
  };
}

function parseAction(raw: string): NormalizedResult {
  const obj = tryJson<Record<string, unknown>>(raw);
  if (!obj || typeof obj !== "object") return { kind: "text", raw };

  const accepted = Array.isArray(obj.acceptedAttributes)
    ? (obj.acceptedAttributes as Record<string, unknown>[]).map(toAttr)
    : [];
  const missing = Array.isArray(obj.missingAttributes)
    ? (obj.missingAttributes as Record<string, unknown>[]).map(toAttr)
    : [];
  const nlg = (obj.nlg as Record<string, unknown> | undefined) ?? undefined;
  const status = str(obj.type) ?? "ready"; // "ready" | "missing" | "error"
  const errList = Array.isArray(obj.validation_errors)
    ? (obj.validation_errors as unknown[]).map(String)
    : [];

  return {
    kind: "action",
    status,
    action: str(obj.action),
    nlg: str(nlg?.message),
    error: errList.length ? errList.join("; ") : undefined,
    accepted,
    missing,
    raw,
  };
}

function parseLinkedInScraper(raw: string): NormalizedResult {
  if (isError(raw)) return { kind: "linkedin", error: raw.trim(), profiles: [], raw };
  const obj = tryJson<Record<string, unknown>>(raw);
  if (!obj) return { kind: "text", raw };

  if (obj.success === false || obj.error) {
    return { kind: "linkedin", error: str(obj.error) ?? "Scrape failed", profiles: [], raw };
  }
  const p = obj.profile as Record<string, unknown> | undefined;
  if (!p) {
    return { kind: "linkedin", error: str(obj.status) ?? "No profile data", profiles: [], raw };
  }
  const profile: LinkedInProfile = {
    full_name: str(p.full_name),
    headline: str(p.headline),
    location: str(p.location),
    profile_url: str(p.profile_url) ?? str(obj.url),
  };
  return { kind: "linkedin", profiles: [profile], total: 1, raw };
}

function parseLinkedInFinding(raw: string): NormalizedResult {
  if (isError(raw)) return { kind: "linkedin", error: raw.trim(), profiles: [], raw };
  const obj = tryJson<Record<string, unknown>>(raw);
  if (!obj) return { kind: "text", raw };

  const list = Array.isArray(obj.profiles) ? (obj.profiles as Record<string, unknown>[]) : [];
  const profiles: LinkedInProfile[] = list.map((p) => ({
    full_name: str(p.full_name),
    headline: str(p.headline),
    location: str(p.location),
    profile_url: str(p.linkedin_url) ?? str(p.profile_url) ?? str(p.url),
  }));
  return {
    kind: "linkedin",
    profiles,
    total: typeof obj.total === "number" ? obj.total : undefined,
    raw,
  };
}

function parseLinkedInMatching(raw: string): NormalizedResult {
  if (isError(raw)) return { kind: "linkedin", error: raw.trim(), profiles: [], raw };
  const obj = tryJson<Record<string, unknown>>(raw);
  if (!obj) return { kind: "text", raw };

  const list = Array.isArray(obj.top_matches) ? (obj.top_matches as Record<string, unknown>[]) : [];
  const profiles: LinkedInProfile[] = list.map((m) => ({
    full_name: str(m.full_name),
    headline: str(m.headline),
    location: str(m.location),
    email: str(m.email),
    score: typeof m.score === "number" ? m.score : undefined,
    confidence: str(m.confidence),
    match_reasons: Array.isArray(m.match_reasons)
      ? (m.match_reasons as unknown[]).map(String)
      : Array.isArray(m.match_details)
        ? (m.match_details as unknown[]).map(String)
        : undefined,
    profile_url: str(m.profile_url),
  }));
  return {
    kind: "linkedin",
    profiles,
    total: typeof obj.total_scored === "number" ? obj.total_scored : undefined,
    raw,
  };
}
