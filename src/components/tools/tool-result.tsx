import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Globe, Linkedin, Send, XCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  type ActionAttr,
  type LinkedInProfile,
  type NormalizedResult,
  normalizeResult,
} from "../../lib/tool-results";

/** Dispatch a tool's result to the matching rich renderer (by tool name). */
export function ToolResult({ tool, result }: { tool: string; result: string | null }) {
  const norm = useMemo(() => normalizeResult(tool, result), [tool, result]);

  switch (norm.kind) {
    case "websearch":
      return <WebSearchResult norm={norm} />;
    case "retrieval":
      return <RetrievalResult norm={norm} />;
    case "linkedin":
      return <LinkedInResult norm={norm} />;
    case "action":
      return <ActionWizard norm={norm} />;
    case "chart":
      return <ChartResult norm={norm} />;
    default:
      return <TextResult raw={norm.raw} />;
  }
}

// ── fallback ──────────────────────────────────────────────────────────────────
function TextResult({ raw }: { raw: string }) {
  return (
    <pre className="scrollbar-thin max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-2 font-mono text-[12px] leading-relaxed">
      {raw || "(empty)"}
    </pre>
  );
}

// ── web search → source chips ───────────────────────────────────────────────
function favicon(url: string): string {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
  } catch {
    return "";
  }
}

function WebSearchResult({ norm }: { norm: Extract<NormalizedResult, { kind: "websearch" }> }) {
  if (norm.sources.length === 0) return <TextResult raw={norm.raw} />;
  return (
    <div className="flex flex-wrap gap-1.5">
      {norm.sources.map((s, i) => (
        <a
          key={`${s.url}-${i}`}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          title={s.snippet || s.title}
          className="inline-flex max-w-[260px] items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs transition-colors hover:border-ring hover:bg-accent"
        >
          {favicon(s.url) ? (
            <img src={favicon(s.url)} alt="" className="h-3.5 w-3.5 rounded-sm" />
          ) : (
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="truncate">{s.title}</span>
        </a>
      ))}
    </div>
  );
}

// ── retrieval → SQL + table ───────────────────────────────────────────────────
function fmtCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

const MAX_ROWS = 50;

function RetrievalResult({ norm }: { norm: Extract<NormalizedResult, { kind: "retrieval" }> }) {
  const rows = norm.rows.slice(0, MAX_ROWS);
  return (
    <div className="space-y-2 text-sm">
      {norm.sql && (
        <div>
          <Label>SQL</Label>
          <pre className="scrollbar-thin overflow-x-auto whitespace-pre-wrap break-all rounded bg-muted/40 px-2 py-1.5 font-mono text-[12px]">
            {norm.sql}
          </pre>
        </div>
      )}
      {norm.error && (
        <div className="flex items-start gap-2 rounded bg-destructive/10 px-2 py-1.5">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
          <p className="text-xs text-destructive">{norm.error}</p>
        </div>
      )}
      {!norm.error && norm.columns.length > 0 && (
        <div>
          <Label>
            Results{" "}
            <span className="font-normal normal-case text-muted-foreground/70">
              {norm.totalRows} row{norm.totalRows !== 1 ? "s" : ""}
            </span>
          </Label>
          <div className="scrollbar-thin overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-max text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {norm.columns.map((c) => (
                    <th key={c} className="whitespace-nowrap px-2 py-1.5 text-left font-semibold text-muted-foreground">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                    {norm.columns.map((c) => (
                      <td key={c} className="max-w-[220px] truncate px-2 py-1.5" title={fmtCell(row[c])}>
                        {fmtCell(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {norm.totalRows > MAX_ROWS && (
            <p className="mt-1 text-xs text-muted-foreground">
              Showing {MAX_ROWS} of {norm.totalRows} rows
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── chart_visualisation → interactive plotly figures ─────────────────────────

/**
 * plotly.js is ~1MB, so it is imported dynamically and only once — the first
 * time a chart is actually shown, rather than on every page load.
 */
let plotlyPromise: Promise<typeof import("plotly.js-dist-min")> | null = null;
const loadPlotly = () => (plotlyPromise ??= import("plotly.js-dist-min"));

/** One figure, fetched by filename from /api/charts and drawn into a div. */
function ChartFigure({ file }: { file: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let drawnInto: HTMLDivElement | null = null;

    (async () => {
      try {
        const [{ default: Plotly }, res] = await Promise.all([
          loadPlotly(),
          fetch(`/api/charts/${encodeURIComponent(file)}`),
        ]);
        if (!res.ok) throw new Error(`chart unavailable (HTTP ${res.status})`);
        const fig = await res.json();
        // The effect can resolve after unmount, or after `file` changed.
        if (cancelled || !host.current) return;
        drawnInto = host.current;
        // The figure carries its own template inline, so there is no theme to
        // apply here — it already matches in light and dark.
        await Plotly.newPlot(drawnInto, fig.data ?? [], fig.layout ?? {}, {
          responsive: true,
          displaylogo: false,
          modeBarButtonsToRemove: ["lasso2d", "select2d"],
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
      // Plotly registers a window resize listener (and a WebGL context for some
      // trace types) per plot. Without purge they accumulate every time the
      // timeline re-renders.
      if (drawnInto) void loadPlotly().then(({ default: P }) => P.purge(drawnInto!));
    };
  }, [file]);

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded bg-destructive/10 px-2 py-1.5">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
        <p className="text-xs text-destructive">Could not load this chart: {error}</p>
      </div>
    );
  }
  // min-height reserves the space plotly will fill, so the message above the
  // chart does not jump once the figure lands.
  return <div ref={host} className="min-h-[320px] w-full" />;
}

function ChartResult({ norm }: { norm: Extract<NormalizedResult, { kind: "chart" }> }) {
  const [showSql, setShowSql] = useState(false);

  if (norm.error) {
    return (
      <div className="flex items-start gap-2 rounded bg-destructive/10 px-2 py-1.5">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
        <p className="text-xs text-destructive">{norm.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      {norm.message && <p className="text-xs text-muted-foreground">{norm.message}</p>}

      {norm.charts.map((c) => (
        <div key={c.file} className="rounded-lg border border-border p-2">
          <Label>
            {c.title}{" "}
            {c.chartType && (
              <span className="font-normal normal-case text-muted-foreground/70">
                {c.chartType}
              </span>
            )}
          </Label>
          <ChartFigure file={c.file} />
          {c.insight && (
            <p
              className="mt-1 text-xs leading-relaxed text-muted-foreground"
              // The insight is written by the charting model as a short HTML
              // fragment (it uses <b> for emphasis), produced server-side by our
              // own prompt — not user input.
              dangerouslySetInnerHTML={{ __html: c.insight }}
            />
          )}
        </div>
      ))}

      {norm.charts.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No charts were produced{norm.rowCount ? ` from ${norm.rowCount} rows` : ""}.
        </p>
      )}

      {/* Collapsed by default: the SQL is context for a wrong-looking chart, not
          something to read every time. */}
      {norm.sql && (
        <div>
          <button
            type="button"
            onClick={() => setShowSql((v) => !v)}
            className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            {showSql ? "Hide" : "Show"} SQL
            <span className="ml-1.5 font-normal normal-case text-muted-foreground/70">
              {norm.rowCount} row{norm.rowCount !== 1 ? "s" : ""}
              {norm.rejected > 0 &&
                ` · ${norm.rejected} chart${norm.rejected !== 1 ? "s" : ""} the reviewer still flagged`}
            </span>
          </button>
          {showSql && (
            <>
              {norm.chartedQuestion && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Drawn from the data fetched for:{" "}
                  <span className="italic">“{norm.chartedQuestion}”</span>
                </p>
              )}
              <pre className="scrollbar-thin mt-1 overflow-x-auto whitespace-pre-wrap break-all rounded bg-muted/40 px-2 py-1.5 font-mono text-[12px]">
                {norm.sql}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── linkedin → profile cards ─────────────────────────────────────────────────
function confidenceStyle(c?: string): { color: string; Icon: typeof CheckCircle2 } {
  // Semantic tokens rather than palette classes, so a host that re-themes the
  // widget (see styles/lib.css) re-themes these badges with it.
  switch (c) {
    case "very_high":
    case "high":
      return { color: "text-success", Icon: CheckCircle2 };
    case "medium":
      return { color: "text-warning", Icon: AlertCircle };
    case "low":
    case "very_low":
      return { color: "text-destructive", Icon: XCircle };
    default:
      return { color: "text-muted-foreground", Icon: CheckCircle2 };
  }
}

function ProfileCard({ p }: { p: LinkedInProfile }) {
  const { color, Icon } = confidenceStyle(p.confidence);
  const inner = (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate font-semibold text-foreground">{p.full_name || "Unknown"}</h4>
          {p.confidence && (
            <span className={cn("flex items-center gap-1 text-xs font-medium", color)}>
              <Icon className="h-3 w-3" />
              {p.confidence.replace(/_/g, " ")}
            </span>
          )}
        </div>
        {p.headline && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{p.headline}</p>}
        {p.location && <p className="mt-1 text-xs text-muted-foreground">📍 {p.location}</p>}
        {p.email && <p className="mt-1 text-xs text-muted-foreground">✉️ {p.email}</p>}
        {p.score !== undefined && <p className="mt-1 text-xs text-muted-foreground">Score: {p.score}/100</p>}
        {p.match_reasons && p.match_reasons.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {p.match_reasons.slice(0, 4).map((r, i) => (
              <span key={i} className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {r.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}
      </div>
      <Linkedin className="h-5 w-5 shrink-0 text-[#0A66C2]" />
    </div>
  );
  const className =
    "block rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50";
  return p.profile_url ? (
    <a href={p.profile_url} target="_blank" rel="noopener noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <div className={className}>{inner}</div>
  );
}

function LinkedInResult({ norm }: { norm: Extract<NormalizedResult, { kind: "linkedin" }> }) {
  if (norm.error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
        <p className="text-sm font-medium text-destructive">Error</p>
        <p className="mt-1 text-xs text-destructive/80">{norm.error}</p>
      </div>
    );
  }
  if (norm.profiles.length === 0) {
    return <p className="text-sm text-muted-foreground">No profiles found.</p>;
  }
  const shown = norm.profiles.slice(0, 5);
  return (
    <div className="flex flex-col gap-2">
      {typeof norm.total === "number" && (
        <p className="text-xs text-muted-foreground">{norm.total} total result{norm.total !== 1 ? "s" : ""}</p>
      )}
      {shown.map((p, i) => (
        <ProfileCard key={`${p.profile_url}-${i}`} p={p} />
      ))}
      {norm.profiles.length > shown.length && (
        <p className="text-xs text-muted-foreground">+{norm.profiles.length - shown.length} more</p>
      )}
    </div>
  );
}

// ── action wizard → interactive form ─────────────────────────────────────────
function humanize(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ActionWizard({ norm }: { norm: Extract<NormalizedResult, { kind: "action" }> }) {
  const fields = useMemo(() => [...norm.accepted, ...norm.missing], [norm.accepted, norm.missing]);
  const [form, setForm] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const a of norm.accepted) init[a.name] = a.value ?? "";
    for (const a of norm.missing) init[a.name] = "";
    return init;
  });
  const [submitted, setSubmitted] = useState(false);

  if (norm.status === "error") {
    return (
      <div className="space-y-2 text-sm">
        {norm.nlg && <p className="text-muted-foreground">{norm.nlg}</p>}
        {norm.error && (
          <p className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">{norm.error}</p>
        )}
      </div>
    );
  }

  const requiredMissing = norm.missing.filter((a) => a.required && !form[a.name]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">{norm.action ? humanize(norm.action) : "Action"}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            norm.status === "ready"
              ? "bg-primary/15 text-primary"
              : "bg-warning/15 text-warning",
          )}
        >
          {norm.status}
        </span>
      </div>
      {norm.nlg && <p className="text-sm text-muted-foreground">{norm.nlg}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((a) => (
          <Field
            key={a.name}
            attr={a}
            value={form[a.name]}
            onChange={(v) => setForm((p) => ({ ...p, [a.name]: v }))}
          />
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          {requiredMissing.length > 0
            ? `${requiredMissing.length} required field(s)`
            : "All required fields completed"}
        </p>
        <button
          type="button"
          disabled={requiredMissing.length > 0 || submitted}
          onClick={() => setSubmitted(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {submitted ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Submitted
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Submit
            </>
          )}
        </button>
      </div>
      {submitted && (
        <p className="text-xs text-muted-foreground">
          (Demo) Submit is a stub — wire it to a backend action endpoint to persist.
        </p>
      )}
    </div>
  );
}

function Field({
  attr,
  value,
  onChange,
}: {
  attr: ActionAttr;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const label = attr.label ?? humanize(attr.name);
  const fullWidth =
    attr.renderType === "textarea" || /description|requirements/.test(attr.name);
  const common = "w-full rounded-lg border border-input bg-card px-2.5 py-1.5 text-sm outline-none focus:border-ring";

  const control =
    attr.renderType === "select" || attr.enums ? (
      <select
        className={common}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{`Select ${label}`}</option>
        {attr.enums?.map((o) => (
          <option key={o} value={o}>
            {humanize(o)}
          </option>
        ))}
      </select>
    ) : fullWidth ? (
      <textarea
        rows={2}
        className={cn(common, "resize-none")}
        value={String(value ?? "")}
        placeholder={`Enter ${label.toLowerCase()}`}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <input
        type={attr.type === "number" ? "number" : "text"}
        className={common}
        value={String(value ?? "")}
        placeholder={`Enter ${label.toLowerCase()}`}
        onChange={(e) => onChange(e.target.value)}
      />
    );

  return (
    <div className={cn("space-y-1", fullWidth && "sm:col-span-2")}>
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {attr.required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {control}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}
