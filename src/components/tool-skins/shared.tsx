import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export function Typewriter({ text, speed = 16 }: { text: string; speed?: number }) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    setShown("");
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return <>{shown}</>;
}

const SQL_PROGRESS_PREFIX = "Running: ";

const BARE_TOOL_NAME_LINES = new Set([
  "check_lessons",
  "retrieve_table",
  "execute_sql",
  "process_sql",
  "store_learning",
]);

/** Live narration shown while a tool runs, filtered per view. */
export function ProgressLog({
  lines,
  running,
  isClient,
}: {
  lines: { text: string; time: string }[];
  running: boolean;
  isClient: boolean;
}) {
  const narrated = lines.filter((l) => {
    const text = l.text.trim();
    if (BARE_TOOL_NAME_LINES.has(text)) return false;
    if (isClient && text.startsWith(SQL_PROGRESS_PREFIX)) return false;
    return true;
  });

  if (narrated.length === 0) {
    return running ? (
      <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        working…
      </div>
    ) : null;
  }

  return (
    <div className="space-y-1 pt-1">
      {narrated.map((l, i) => {
        const isNewest = i === narrated.length - 1;
        return (
          <div
            key={i}
            title={l.time}
            className={cn(
              "text-[13px] leading-relaxed",
              isNewest && running ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {isNewest && running ? <Typewriter text={l.text} speed={6} /> : l.text}
          </div>
        );
      })}
    </div>
  );
}

/** Shown in "plain" prose instead of narration; ticks while running, freezes when done. */
export function ElapsedBadge({
  startedAt,
  running,
  doneLabel,
}: {
  startedAt: number;
  running: boolean;
  doneLabel: string;
}) {
  const [elapsedMs, setElapsedMs] = useState(() => Date.now() - startedAt);

  useEffect(() => {
    if (!running) {
      setElapsedMs(Date.now() - startedAt);
      return;
    }
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt), 1000);
    return () => clearInterval(id);
  }, [running, startedAt]);

  const secs = Math.max(0, Math.round(elapsedMs / 1000));
  return <>{running ? `${secs}s…` : `${secs}s · ${doneLabel}`}</>;
}

/** A short, human sentence for a parsed SQL-result observation. */
export function humanLineFor(sub: { rowCount: number | null }): string {
  const n = sub.rowCount;
  if (n === null) return "Checked the data";
  if (n === 0) return "Found nothing";
  return `Checked ${n} record${n === 1 ? "" : "s"}`;
}

function cellText(v: unknown): string {
  if (v === null || v === undefined) return "";
  return typeof v === "object" ? JSON.stringify(v) : String(v);
}

/** Rows as a table, with a raw-JSON toggle for the Developer view. */
export function RowsTable({ rows, allowRawToggle }: { rows: unknown[]; allowRawToggle: boolean }) {
  const [raw, setRaw] = useState(false);
  const showRaw = raw && allowRawToggle;

  if (rows.length === 0) {
    return <div className="text-[12px] text-muted-foreground">No rows.</div>;
  }

  const isObjectRows = rows.every((r) => r !== null && typeof r === "object" && !Array.isArray(r));
  const columns = isObjectRows
    ? Array.from(new Set(rows.flatMap((r) => Object.keys(r as Record<string, unknown>))))
    : ["value"];

  return (
    <div className="space-y-1">
      {allowRawToggle && (
        <button
          type="button"
          onClick={() => setRaw((v) => !v)}
          className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
        >
          {showRaw ? "Show as table" : "Show raw JSON"}
        </button>
      )}
      {showRaw ? (
        <pre className="scrollbar-thin max-h-56 overflow-auto rounded-md bg-muted/40 p-1.5 font-mono text-[11px] leading-relaxed">
          {JSON.stringify(rows, null, 2)}
        </pre>
      ) : (
        <div className="scrollbar-thin max-h-56 overflow-auto rounded-md border border-border/60">
          <table className="w-full border-collapse text-[11.5px]">
            <thead className="sticky top-0 bg-muted/60">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c}
                    className="whitespace-nowrap border-b border-border/60 px-2 py-1 text-left font-medium text-muted-foreground"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="odd:bg-transparent even:bg-muted/20">
                  {columns.map((c) => {
                    const v = isObjectRows ? (r as Record<string, unknown>)[c] : r;
                    return (
                      <td
                        key={c}
                        title={cellText(v)}
                        className={cn(
                          "max-w-[220px] truncate whitespace-nowrap border-b border-border/40 px-2 py-1",
                          v === null || v === undefined ? "italic text-muted-foreground" : "",
                        )}
                      >
                        {v === null || v === undefined ? "null" : cellText(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Dev-mode summary line for a tool call: the first string-ish argument, verbatim. */
export function summarizeArgs(args: Record<string, unknown>): string {
  const preferred = ["query", "url", "natural_query", "title", "keywords"];
  for (const key of preferred) {
    const v = args[key];
    if (typeof v === "string" && v.trim()) return v;
  }
  const first = Object.values(args).find((v) => typeof v === "string" && v);
  return typeof first === "string" ? first : "";
}

const ARG_KEY_LABELS: Record<string, string> = {
  natural_query: "Question",
  query: "Query",
  question: "Question",
  url: "URL",
  keywords: "Keywords",
  title: "Title",
};

/** Client-mode rendering of a tool's arguments: "Label: value" lines instead of raw JSON. */
export function humanizeArgs(args: Record<string, unknown>): { label: string; value: string }[] {
  return Object.entries(args)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([key, v]) => ({
      label: ARG_KEY_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: typeof v === "string" ? v : JSON.stringify(v),
    }));
}
