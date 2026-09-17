/** Parses the engine's "SQL OK:" / "SQL FAILED:" observation strings; anything else is "raw". */
export type SummarizedObservation =
  | {
      kind: "sql-result";
      ok: true;
      sql: string;
      rowCount: number | null;
      shownCount: number | null;
      rows: unknown[];
    }
  | { kind: "sql-result"; ok: false; sql: string; error: string }
  | { kind: "raw"; text: string };

const SQL_OK_RESULT_RE = /^(SQL (?:OK|FAILED)):\s*\n([\s\S]*?)\n\nResult:\n([\s\S]*)$/;
const SQL_FAILED_ERROR_RE = /^(SQL FAILED):\s*\n([\s\S]*?)\n\nError:\s*([\s\S]*)$/;
const ROW_TRAILER_RE = /\n… \((\d+) rows total, showing (\d+)\)\s*$/;

export function summarizeObservation(text: string): SummarizedObservation {
  const raw: SummarizedObservation = { kind: "raw", text };
  if (!text) return raw;

  const okMatch = SQL_OK_RESULT_RE.exec(text);
  if (okMatch) {
    const [, verdict, sql, rest] = okMatch;
    if (verdict === "SQL FAILED") {
      return { kind: "sql-result", ok: false, sql, error: rest };
    }
    const parsed = parseResultBlob(rest);
    if (parsed) {
      return {
        kind: "sql-result",
        ok: true,
        sql,
        rowCount: parsed.trailer?.total ?? (Array.isArray(parsed.rows) ? parsed.rows.length : null),
        shownCount: parsed.trailer?.shown ?? null,
        rows: parsed.rows,
      };
    }
    return raw;
  }

  const failMatch = SQL_FAILED_ERROR_RE.exec(text);
  if (failMatch) {
    const [, , sql, error] = failMatch;
    return { kind: "sql-result", ok: false, sql, error };
  }

  return raw;
}

function parseResultBlob(
  rest: string,
): { rows: unknown[]; trailer: { total: number; shown: number } | null } | null {
  const trailerMatch = ROW_TRAILER_RE.exec(rest);
  const trailer = trailerMatch ? { total: +trailerMatch[1], shown: +trailerMatch[2] } : null;
  const jsonText = trailerMatch ? rest.slice(0, trailerMatch.index) : rest;
  try {
    const rows = JSON.parse(jsonText);
    if (Array.isArray(rows)) return { rows, trailer };
  } catch {
  }
  return null;
}
