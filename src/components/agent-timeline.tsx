import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { TimelineNode } from "./timeline-node";
import { isStepHiddenFor, type Prose, type ToolSkin, type ViewMode } from "../lib/agent-view";
import type { TimelineStep } from "../types";

const WAITING_WORDS = [
  "Thinking",
  "Reasoning",
  "Analyzing",
  "Considering",
  "Pondering",
  "Evaluating",
  "Exploring options",
  "Connecting the dots",
  "Working on it",
];

function WaitingWord() {
  const [i, setI] = useState(() => Math.floor(Math.random() * WAITING_WORDS.length));

  useEffect(() => {
    const id = setInterval(() => setI((prev) => (prev + 1) % WAITING_WORDS.length), 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={WAITING_WORDS[i]}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
      >
        {WAITING_WORDS[i]}
      </motion.span>
    </AnimatePresence>
  );
}

export interface AgentTimelineProps {
  steps: TimelineStep[];
  streaming: boolean;
  /** Client/Developer — what the timeline renders at all. Defaults to "developer". */
  viewMode?: ViewMode;
  /** Flat/Terminal — how a tool node is drawn. Defaults to "flat". */
  toolSkin?: ToolSkin;
  /** Explained/Plain — how much narration shows. Defaults to "explained". */
  prose?: Prose;
  /** stepId, questionId, answer — resolves a paused human_question step. */
  onAnswerQuestion?: (stepId: string, questionId: string, answer: string) => void;
}

export function AgentTimeline({
  steps,
  streaming,
  viewMode = "developer",
  toolSkin = "flat",
  prose = "explained",
  onAnswerQuestion,
}: AgentTimelineProps) {
  if (steps.length === 0 && streaming) {
    return (
      <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <WaitingWord />
        <span>…</span>
      </div>
    );
  }

  const visibleSteps = steps.filter((s) => !isStepHiddenFor(s, viewMode, prose));

  return (
    <ol className="relative">
      {visibleSteps.map((step, i) => (
        <TimelineNode
          key={step.id}
          step={step}
          isLast={i === visibleSteps.length - 1}
          viewMode={viewMode}
          toolSkin={toolSkin}
          prose={prose}
          onAnswerQuestion={onAnswerQuestion}
        />
      ))}
    </ol>
  );
}
