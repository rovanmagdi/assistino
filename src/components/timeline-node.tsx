import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  BarChart3,
  BookmarkPlus,
  BookOpen,
  Brain,
  Check,
  CircleDot,
  ClipboardList,
  Code2,
  Crosshair,
  Database,
  Eye,
  Globe,
  HelpCircle,
  Linkedin,
  MessageCircle,
  Sparkles,
  Table2,
  Terminal,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Markdown } from "./markdown";
import { ToolResult } from "./tools/tool-result";
import { summarizeObservation } from "../lib/summarize-observation";
import { Typewriter, humanizeArgs, summarizeArgs } from "./tool-skins/shared";
import { TOOL_SKIN_BODIES } from "./tool-skins";
import { effectiveToolSkin, type Prose, type ToolSkin, type ViewMode } from "../lib/agent-view";
import type { OptionPreview, TimelineStep } from "../types";

/** ms per character for the reasoning typewriter; also delays the tool node's reveal. */
export const REASONING_TYPE_SPEED_MS = 4;

const TOOL_ICONS: Record<string, typeof Wrench> = {
  web_search: Globe,
  assistino_retrieval: Database,
  assistino_hr_action: ClipboardList,
  linkedin_url_scraper: Linkedin,
  linkedin_finding_search: Linkedin,
  linkedin_matching_search: Linkedin,
  nl2sql: Database,
  chart_visualisation: BarChart3,
  check_lessons: BookOpen,
  retrieve_table: Table2,
  execute_sql: Terminal,
  process_sql: Code2,
  store_learning: BookmarkPlus,
};

const TOOL_LABELS: Record<string, string> = {
  web_search: "Web Search",
  assistino_retrieval: "Database Query",
  assistino_hr_action: "HR Action",
  linkedin_url_scraper: "LinkedIn Profile",
  linkedin_finding_search: "LinkedIn Search",
  linkedin_matching_search: "LinkedIn Match",
  nl2sql: "Database Agent",
  chart_visualisation: "Chart",
  check_lessons: "Recall past learnings",
  retrieve_table: "Retrieve table",
  execute_sql: "Run query",
  process_sql: "Process results",
  store_learning: "Store learning",
  ask_human: "Ask human",
  resolve_value: "Resolve value",
  retrieve_from_db: "Retrieve from DB",
  post_process_rows: "Post-process rows",
  describe_result: "Describe result",
};

/** Client-mode header one-liners, in place of a raw args summary. */
const CLIENT_SUMMARY_TEMPLATES: Record<string, (running: boolean) => string> = {
  nl2sql: (running) => (running ? "Looking into the database…" : "Looked into the database"),
  web_search: (running) => (running ? "Searching the web…" : "Searched the web"),
  assistino_hr_action: (running) => (running ? "Working on that action…" : "Completed that action"),
  chart_visualisation: (running) => (running ? "Building a chart…" : "Built a chart"),
  check_lessons: () => "Recalling what I already know",
  retrieve_table: () => "Looking for the right data",
  execute_sql: () => "Checking real data",
  process_sql: () => "Working through the results",
  store_learning: () => "Making a note for next time",
};

function StepCircle({ step }: { step: TimelineStep }) {
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

  if (step.kind === "human_question") {
    return (
      <span
        data-tone={step.answered ? "neutral" : "warning"}
        className={cn(
          base,
          step.answered ? "border-border text-muted-foreground" : "border-warning text-warning",
        )}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </span>
    );
  }

  if (step.status === "running") {
    return (
      <span data-tone="accent" className={cn(base, "border-primary text-primary")}>
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

function ToolNode({
  step,
  viewMode,
  toolSkin,
  prose,
}: {
  step: Extract<TimelineStep, { kind: "tool" }>;
  viewMode: ViewMode;
  toolSkin: ToolSkin;
  prose: Prose;
}) {
  const isClient = viewMode === "client";
  const skin = effectiveToolSkin(viewMode, toolSkin);
  const [open, setOpen] = useState(!isClient);
  const running = step.status === "running";
  const hasArgs = Object.keys(step.args).length > 0;
  const Icon = TOOL_ICONS[step.tool] ?? Wrench;
  const label = TOOL_LABELS[step.tool] ?? step.tool;
  const summary = isClient
    ? (CLIENT_SUMMARY_TEMPLATES[step.tool]?.(running) ?? summarizeArgs(step.args))
    : summarizeArgs(step.args);

  const wasRunningRef = useRef(running);
  const [justCompleted, setJustCompleted] = useState(false);
  useEffect(() => {
    const finished = wasRunningRef.current && !running;
    wasRunningRef.current = running;
    if (finished && !open) {
      setJustCompleted(true);
      const id = setTimeout(() => setJustCompleted(false), 900);
      return () => clearTimeout(id);
    }
  }, [running, open]);

  const summarized = step.observation !== undefined ? summarizeObservation(step.observation) : null;
  const isSqlResult = summarized?.kind === "sql-result";
  const hasDetail = hasArgs || step.observation !== undefined;

  const Body = TOOL_SKIN_BODIES[skin];

  return (
    <div
      className={cn(
        "-mx-2 rounded-lg px-2 py-1 transition-colors duration-500",
        justCompleted && "bg-primary/10",
      )}
    >
      <Body
        step={step}
        isClient={isClient}
        prose={prose}
        running={running}
        open={open}
        onToggleOpen={() => setOpen((v) => !v)}
        icon={Icon}
        label={label}
        summary={summary}
        hasArgs={hasArgs}
        hasDetail={hasDetail}
        humanizedArgs={humanizeArgs(step.args)}
        summarized={summarized}
        isSqlResult={isSqlResult}
      />
    </div>
  );
}

function OptionCard({
  label,
  preview,
  onPick,
}: {
  label: string;
  preview?: OptionPreview;
  onPick: () => void;
}) {
  const empty = preview != null && (preview.count === 0 || preview.count === null);
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex flex-col gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm transition-colors hover:border-primary hover:bg-accent"
    >
      <span className="font-medium">{label}</span>
      {preview && (
        <>
          <span
            className={cn(
              "text-[11px] uppercase tracking-wide",
              empty ? "text-muted-foreground" : "font-medium text-success",
            )}
          >
            {preview.summary}
          </span>
          {preview.samples.length > 0 && (
            <ul className="mt-0.5 space-y-1">
              {preview.samples.map((sample, i) => (
                <li key={i} className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                  {sample}
                </li>
              ))}
            </ul>
          )}
          {preview.error && (
            <span className="text-xs text-muted-foreground">
              Couldn&apos;t check this one — pick it anyway to have it worked out from scratch.
            </span>
          )}
        </>
      )}
    </button>
  );
}

function HumanQuestionNode({
  step,
  onAnswer,
}: {
  step: Extract<TimelineStep, { kind: "human_question" }>;
  onAnswer?: (answer: string) => void;
}) {
  const [freeText, setFreeText] = useState("");

  return (
    <div className="rounded-xl border border-warning/40 bg-warning/[0.06] p-3">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-warning">
        Needs your input
      </div>
      <div className="text-sm leading-relaxed">{step.question}</div>
      {step.context && <div className="mt-1 text-xs text-muted-foreground">{step.context}</div>}

      {step.answered ? (
        <div className="mt-2 text-xs text-muted-foreground">
          You answered: <span className="font-medium text-foreground">{step.answer}</span>
        </div>
      ) : step.options.length > 0 ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {step.options.map((opt, i) => (
            <OptionCard
              key={opt}
              label={opt}
              preview={step.previews?.[i]}
              onPick={() => onAnswer?.(opt)}
            />
          ))}
        </div>
      ) : (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (freeText.trim()) onAnswer?.(freeText.trim());
          }}
        >
          <input
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Type your answer…"
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-ring"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}

export interface TimelineNodeProps {
  step: TimelineStep;
  isLast: boolean;
  /** Client/Developer — what the timeline renders at all. Defaults to "developer". */
  viewMode?: ViewMode;
  /** Flat/Terminal — how a tool node is drawn. Forced to "flat" for Client. Defaults to "flat". */
  toolSkin?: ToolSkin;
  /** Explained/Plain — how much narration shows. Defaults to "explained". */
  prose?: Prose;
  /** stepId, questionId, answer — resolves a paused human_question step. */
  onAnswerQuestion?: (stepId: string, questionId: string, answer: string) => void;
}

export function TimelineNode({
  step,
  isLast,
  viewMode = "developer",
  toolSkin = "flat",
  prose = "explained",
  onAnswerQuestion,
}: TimelineNodeProps) {
  const revealDelayMs =
    step.kind === "tool_selected" || step.kind === "tool" ? step.revealDelayMs ?? 0 : 0;

  return (
    <motion.li
      className="relative pb-5 pl-10 last:pb-0"
      initial={revealDelayMs > 0 ? { opacity: 0, y: 4 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: revealDelayMs / 1000 }}
    >
      {!isLast && (
        <span
          className={cn(
            "absolute bottom-[-10px] left-[13px] top-[14px] w-px bg-border",
            step.kind === "tool" && step.status === "running" && "animate-pulse bg-primary/50",
          )}
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

      {step.kind === "tool" && (
        <ToolNode step={step} viewMode={viewMode} toolSkin={toolSkin} prose={prose} />
      )}

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

      {step.kind === "human_question" && (
        <div className="pt-0.5">
          <HumanQuestionNode
            step={step}
            onAnswer={(answer) => onAnswerQuestion?.(step.id, step.questionId, answer)}
          />
        </div>
      )}
    </motion.li>
  );
}
