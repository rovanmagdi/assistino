import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Brain,
  Check,
  ChevronDown,
  CircleDot,
  ClipboardList,
  Crosshair,
  Database,
  Eye,
  Globe,
  Linkedin,
  Loader2,
  MessageCircle,
  Sparkles,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Markdown } from "./markdown";
import { ToolResult } from "./tools/tool-result";
import type { TimelineStep } from "../types";

/** ms per character for the reasoning typewriter — also used to time how
 *  long a tool node's reveal should wait so it doesn't pop in mid-sentence. */
export const REASONING_TYPE_SPEED_MS = 4;

const TOOL_ICONS: Record<string, typeof Wrench> = {
  web_search: Globe,
  assistino_retrieval: Database,
  assistino_hr_action: ClipboardList,
  linkedin_url_scraper: Linkedin,
  linkedin_finding_search: Linkedin,
  linkedin_matching_search: Linkedin,
};

const TOOL_LABELS: Record<string, string> = {
  web_search: "Web Search",
  assistino_retrieval: "Database Query",
  assistino_hr_action: "HR Action",
  linkedin_url_scraper: "LinkedIn Profile",
  linkedin_finding_search: "LinkedIn Search",
  linkedin_matching_search: "LinkedIn Match",
};

/** Terminal-style live progress log shown while a tool runs. */
function ProgressLog({
  lines,
  running,
}: {
  lines: { text: string; time: string }[];
  running: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);

  if (lines.length === 0) {
    return running ? (
      <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        working…
      </div>
    ) : null;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-zinc-950 dark:bg-zinc-900">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-1.5">
        {running ? (
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
        ) : (
          <Check className="h-3 w-3 text-primary" />
        )}
        <span className="font-mono text-[11px] text-zinc-400">progress</span>
      </div>
      <div ref={ref} className="scrollbar-thin max-h-40 space-y-0.5 overflow-y-auto p-2">
        {lines.map((l, i) => (
          <div
            key={i}
            className={cn(
              "font-mono text-[11px] leading-relaxed",
              // The panel is dark in both themes, so the brand blue would be
              // too dark here — hence the brighter variant.
              i === lines.length - 1 && running ? "text-primary-bright" : "text-zinc-500",
            )}
          >
            <span className="mr-2 text-zinc-600">[{l.time}]</span>
            {l.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Types a static string out character-by-character. Backend events like
 * `thought` and `tool_start` arrive as one complete string (not token
 * deltas), so this fakes the same streamed feel the final answer gets for
 * free from real `text_delta` chunks.
 */
function Typewriter({ text, speed = 16 }: { text: string; speed?: number }) {
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

/** The circle that sits on the vertical rail. */
function StepCircle({ step }: { step: TimelineStep }) {
  // `step-node` + data-tone are hooks for the "dots" node style in lib.css.
  const base =
    "step-node relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 bg-background";

  if (step.kind === "reasoning") {
    return (
      <span data-tone="neutral" className={cn(base, "border-primary/60 text-primary")}>
        <Brain className="h-3.5 w-3.5" />
      </span>
    );
  }

  if (step.kind === "tool_selected") {
    return (
      <span data-tone="neutral" className={cn(base, "border-dashed border-border text-muted-foreground")}>
        <Crosshair className="h-3 w-3" />
      </span>
    );
  }

  if (step.kind === "explaining") {
    return (
      <span data-tone="neutral" className={cn(base, "border-muted-foreground/40 text-muted-foreground")}>
        <MessageCircle className="h-3.5 w-3.5" />
      </span>
    );
  }

  if (step.kind === "observation") {
    return (
      <span
        data-tone={step.isError ? "danger" : "neutral"}
        className={cn(
          base,
          "border-dashed",
          step.isError ? "border-destructive text-destructive" : "border-border text-muted-foreground",
        )}
      >
        <Eye className="h-3 w-3" />
      </span>
    );
  }

  if (step.kind === "answer") {
    return (
      <span data-tone="accent" className={cn(base, "border-primary bg-primary text-primary-foreground")}>
        <Sparkles className="h-3.5 w-3.5" />
      </span>
    );
  }

  // tool
  if (step.status === "running") {
    return (
      <span data-tone="accent" className={cn(base, "border-primary text-primary")}>
        {/* pulsing halo marking the current tool call */}
        <span className="absolute inset-0 animate-ping rounded-full border-2 border-primary/60" />
        <CircleDot className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (step.status === "error") {
    return (
      <span data-tone="danger" className={cn(base, "border-destructive bg-destructive text-destructive-foreground")}>
        <TriangleAlert className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span data-tone="accent" className={cn(base, "border-primary bg-primary text-primary-foreground")}>
      <Check className="h-3.5 w-3.5" />
    </span>
  );
}

function summarizeArgs(args: Record<string, unknown>): string {
  const preferred = ["query", "url", "natural_query", "title", "keywords"];
  for (const key of preferred) {
    const v = args[key];
    if (typeof v === "string" && v.trim()) return v;
  }
  const first = Object.values(args).find((v) => typeof v === "string" && v);
  return typeof first === "string" ? first : "";
}

function ToolNode({ step }: { step: Extract<TimelineStep, { kind: "tool" }> }) {
  const [open, setOpen] = useState(true);
  const summary = summarizeArgs(step.args);
  const hasArgs = Object.keys(step.args).length > 0;
  const running = step.status === "running";
  const Icon = TOOL_ICONS[step.tool] ?? Wrench;
  const label = TOOL_LABELS[step.tool] ?? step.tool;

  return (
    <div className="rounded-xl border border-border bg-card/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="text-[13px] font-medium">{label}</span>
        {summary && (
          <span className="truncate text-xs text-muted-foreground">{summary}</span>
        )}
        <span className="ml-auto flex items-center gap-2">
          {running && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              running
            </span>
          )}
          {step.status === "done" && <span className="text-xs text-muted-foreground">done</span>}
          {step.status === "error" && <span className="text-xs text-destructive">error</span>}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.165, 0.84, 0.44, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t border-border px-3 py-2.5">
              {hasArgs && (
                <div>
                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Arguments
                  </div>
                  <pre className="scrollbar-thin overflow-x-auto rounded-lg bg-muted/40 p-2 font-mono text-[12px] leading-relaxed">
                    {JSON.stringify(step.args, null, 2)}
                  </pre>
                </div>
              )}

              {/* live progress log (terminal-style) */}
              {(running || step.progress.length > 0) && (
                <ProgressLog lines={step.progress} running={running} />
              )}

              {running && step.progress.length === 0 && (
                <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  waiting for tool output…
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TimelineNode({ step, isLast }: { step: TimelineStep; isLast: boolean }) {
  // Data lands in state the instant it arrives (never delayed) — only the
  // visual reveal of tool nodes waits, via this transition delay, so the
  // reasoning above it has a moment to be read first.
  const revealDelayMs =
    step.kind === "tool_selected" || step.kind === "tool" ? step.revealDelayMs ?? 0 : 0;

  return (
    <motion.li
      className="relative pb-5 pl-10 last:pb-0"
      initial={revealDelayMs > 0 ? { opacity: 0, y: 4 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: revealDelayMs / 1000 }}
    >
      {/* connector rail */}
      {!isLast && (
        <span
          className="absolute bottom-[-10px] left-[13px] top-[14px] w-px bg-border"
          aria-hidden
        />
      )}
      <span className="absolute left-0 top-0">
        <StepCircle step={step} />
      </span>

      {step.kind === "reasoning" && (
        <div className="pt-0.5">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Reasoning
          </div>
          <div className="text-sm leading-relaxed text-muted-foreground">
            <Typewriter text={step.text} speed={REASONING_TYPE_SPEED_MS} />
          </div>
        </div>
      )}

      {step.kind === "explaining" && (
        <div className="pt-0.5">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Explaining
          </div>
          <Markdown>{step.text}</Markdown>
        </div>
      )}

      {step.kind === "tool_selected" && (
        <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
          <span className="font-medium uppercase tracking-wide">Determine Tool</span>
          <span>·</span>
          <span>
            Selected <Typewriter text={TOOL_LABELS[step.tool] ?? step.tool} speed={24} />
          </span>
        </div>
      )}

      {step.kind === "tool" && <ToolNode step={step} />}

      {step.kind === "observation" && (
        <div className="pt-0.5">
          <div
            className={cn(
              "mb-1 text-[11px] font-medium uppercase tracking-wide",
              step.isError ? "text-destructive" : "text-muted-foreground",
            )}
          >
            Observation
          </div>
          <ToolResult tool={step.tool} result={step.result} />
        </div>
      )}

      {step.kind === "answer" && (
        <div className="pt-0.5">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-primary">
            Answer
          </div>
          <Markdown>{step.text}</Markdown>
        </div>
      )}
    </motion.li>
  );
}
