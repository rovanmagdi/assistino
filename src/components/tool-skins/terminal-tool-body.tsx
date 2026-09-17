import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { ElapsedBadge, humanLineFor } from "./shared";
import type { ToolBodyProps } from "./types";

const MAX_COL_WIDTH = 22;
const MAX_TERMINAL_ROWS = 20;

function cellText(v: unknown): string {
  if (v === null || v === undefined) return "∅";
  return typeof v === "object" ? JSON.stringify(v) : String(v);
}

function clip(s: string, width: number): string {
  return s.length > width ? `${s.slice(0, width - 1)}…` : s.padEnd(width);
}

function formatTerminalRows(rows: unknown[]): string {
  if (rows.length === 0) return "(no rows)";

  const isObjectRows = rows.every((r) => r !== null && typeof r === "object" && !Array.isArray(r));
  const columns = isObjectRows
    ? Array.from(new Set(rows.flatMap((r) => Object.keys(r as Record<string, unknown>))))
    : ["value"];
  const cellAt = (r: unknown, c: string) =>
    cellText(isObjectRows ? (r as Record<string, unknown>)[c] : r);

  const widths = columns.map((c) =>
    Math.min(MAX_COL_WIDTH, Math.max(c.length, ...rows.map((r) => cellAt(r, c).length))),
  );

  const lines = [
    columns.map((c, i) => clip(c, widths[i])).join("  "),
    widths.map((w) => "-".repeat(w)).join("  "),
    ...rows
      .slice(0, MAX_TERMINAL_ROWS)
      .map((r) => columns.map((c, i) => clip(cellAt(r, c), widths[i])).join("  ")),
  ];
  if (rows.length > MAX_TERMINAL_ROWS) lines.push(`… (${rows.length - MAX_TERMINAL_ROWS} more)`);
  return lines.join("\n");
}

/** Developer-only terminal-window skin; Client is forced to "flat". */
export function TerminalToolBody({
  step,
  prose,
  running,
  open,
  onToggleOpen,
  label,
  summary,
  hasArgs,
  hasDetail,
  summarized,
  isSqlResult,
}: ToolBodyProps) {
  const isPlain = prose === "plain";
  const progressLines = isPlain ? [] : step.progress.map((l) => l.text.trim()).filter(Boolean);

  return (
    <div className="overflow-hidden rounded-lg border border-black/40">
      <button
        type="button"
        onClick={() => hasDetail && onToggleOpen()}
        className={cn(
          "flex w-full items-center gap-1.5 bg-[#181b19] px-3 py-2",
          hasDetail ? "cursor-pointer" : "cursor-default",
        )}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-[#ec6a5e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#f5bd4f]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#61c455]" />
        <span className="ml-2 truncate font-mono text-[11px] text-[#8a968f]">
          assistino@agent — {step.tool}
        </span>
        {hasDetail && (
          <span className="ml-auto font-mono text-[10px] text-[#8a968f]">
            {open ? "▾ collapse" : "▸ expand"}
          </span>
        )}
      </button>

      <div className="space-y-1 bg-[#0c0f0d] px-3.5 py-2.5 font-mono text-[12px] leading-relaxed text-[#8fe8bc]">
        <div>
          <span className="text-[#e7c36b]">$</span> {step.tool}({summary || (hasArgs ? "…" : "")})
        </div>

        {progressLines.length > 0 && (
          <div className="space-y-0.5 pl-3 text-[#4c6357]">
            {progressLines.map((line, i) => (
              <div
                key={i}
                className={cn(i === progressLines.length - 1 && running && "text-[#8fe8bc]")}
              >
                {i === progressLines.length - 1 ? "└─" : "├─"} {line}
              </div>
            ))}
          </div>
        )}
        {!isPlain && running && progressLines.length === 0 && (
          <div className="flex items-center gap-2 pl-3 text-[#4c6357]">
            <Loader2 className="h-3 w-3 animate-spin" />
            waiting for output…
          </div>
        )}

        {!running && summarized && !isSqlResult && (
          <div className="pl-3 text-[#4c6357]">└─ {step.observation}</div>
        )}
        {!running && isSqlResult && summarized?.kind === "sql-result" && summarized.ok && (
          <div className="pl-3 text-[#4c6357]">└─ {humanLineFor(summarized)}</div>
        )}

        <AnimatePresence initial={false}>
          {open && hasDetail && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.165, 0.84, 0.44, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-2 border-t border-[#1e2320] pt-2">
                {hasArgs && (
                  <pre className="whitespace-pre-wrap break-all text-[11px] text-[#7fb8e0]">
                    {JSON.stringify(step.args, null, 2)}
                  </pre>
                )}

                {isSqlResult && summarized?.kind === "sql-result" && (
                  <div className="space-y-1.5">
                    <pre className="whitespace-pre-wrap break-all text-[#7fb8e0]">{summarized.sql}</pre>
                    {summarized.ok ? (
                      <pre className="overflow-x-auto text-[#d7e4dc]">
                        {formatTerminalRows(summarized.rows)}
                      </pre>
                    ) : (
                      <pre className="whitespace-pre-wrap break-all text-[#e37a73]">{summarized.error}</pre>
                    )}
                  </div>
                )}

                {!isSqlResult && step.observation !== undefined && (
                  <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all text-[#d7e4dc]">
                    {step.observation}
                  </pre>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn("pt-0.5", step.status === "error" ? "text-[#e37a73]" : "text-[#e7c36b]")}>
          ${" "}
          {isPlain ? (
            <ElapsedBadge
              startedAt={step.startedAt}
              running={running}
              doneLabel={step.status === "error" ? "failed" : "done"}
            />
          ) : running ? (
            "running…"
          ) : step.status === "error" ? (
            "failed"
          ) : (
            "done"
          )}
        </div>
      </div>

      <span className="sr-only">{label}</span>
    </div>
  );
}
