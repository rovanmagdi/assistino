import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { ElapsedBadge, ProgressLog, RowsTable, humanLineFor } from "./shared";
import type { ToolBodyProps } from "./types";

export function FlatToolBody({
  step,
  isClient,
  prose,
  running,
  open,
  onToggleOpen,
  icon: Icon,
  label,
  summary,
  hasArgs,
  hasDetail,
  humanizedArgs,
  summarized,
  isSqlResult,
}: ToolBodyProps) {
  const isPlain = prose === "plain";
  return (
    <>
      <button
        type="button"
        onClick={() => hasDetail && onToggleOpen()}
        className={cn("flex w-full items-center gap-2 py-1 text-left", !hasDetail && "cursor-default")}
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="text-[13px] font-medium">{label}</span>
        {summary && <span className="truncate text-xs text-muted-foreground">{summary}</span>}
        <span className="ml-auto flex items-center gap-2">
          {isPlain ? (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                running
                  ? "text-primary"
                  : step.status === "error"
                    ? "text-destructive"
                    : "text-muted-foreground",
              )}
            >
              {running && <Loader2 className="h-3 w-3 animate-spin" />}
              <ElapsedBadge
                startedAt={step.startedAt}
                running={running}
                doneLabel={step.status === "error" ? "error" : "done"}
              />
            </span>
          ) : (
            <>
              {running && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  running
                </span>
              )}
              {step.status === "done" && <span className="text-xs text-muted-foreground">done</span>}
              {step.status === "error" && <span className="text-xs text-destructive">error</span>}
            </>
          )}
          {hasDetail && (
            <ChevronDown
              className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
            />
          )}
        </span>
      </button>

      {!isPlain && (running || step.progress.length > 0) && (
        <ProgressLog lines={step.progress} running={running} isClient={isClient} />
      )}
      {!isPlain && running && step.progress.length === 0 && (
        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          waiting for tool output…
        </div>
      )}
      {!running && summarized && (
        <div className="pt-1">
          {isSqlResult ? (
            summarized.kind === "sql-result" && summarized.ok ? (
              <div className="text-[12.5px] text-foreground">{humanLineFor(summarized)}</div>
            ) : summarized.kind === "sql-result" ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-1.5 text-[11.5px] text-destructive">
                {summarized.error}
              </div>
            ) : null
          ) : (
            <div className="text-[12.5px] text-muted-foreground">{step.observation}</div>
          )}
        </div>
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
            <div className="mt-2 space-y-2 border-l-2 border-border/50 py-0.5 pl-3">
              {hasArgs && (
                <div>
                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Arguments
                  </div>
                  {isClient ? (
                    <div className="space-y-1 rounded-lg bg-muted/40 p-2 text-[12.5px] leading-relaxed">
                      {humanizedArgs.map(({ label: argLabel, value }) => (
                        <div key={argLabel}>
                          <span className="font-medium text-muted-foreground">{argLabel}: </span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="scrollbar-thin overflow-x-auto rounded-lg bg-muted/40 p-2 font-mono text-[12px] leading-relaxed">
                      {JSON.stringify(step.args, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              {step.observation !== undefined && (
                <div>
                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Output
                  </div>
                  {isSqlResult && summarized?.kind === "sql-result" ? (
                    <div className="space-y-1.5">
                      {summarized.ok && (
                        <div className="text-[12.5px] text-foreground">{humanLineFor(summarized)}</div>
                      )}
                      <pre className="scrollbar-thin overflow-x-auto rounded-md bg-zinc-950 p-1.5 font-mono text-[11px] leading-relaxed text-zinc-100 dark:bg-zinc-900">
                        {summarized.sql}
                      </pre>
                      {summarized.ok ? (
                        <RowsTable rows={summarized.rows} allowRawToggle={!isClient} />
                      ) : (
                        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-1.5 text-[11px] text-destructive">
                          {summarized.error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <pre className="scrollbar-thin max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-1.5 font-mono text-[11px] leading-relaxed">
                      {step.observation}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
