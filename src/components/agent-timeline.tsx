import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { TimelineNode } from "./timeline-node";
import type { TimelineStep } from "../types";

/** Cycled while we wait for the first event — avoids one static "Reasoning…" label. */
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

export function AgentTimeline({
  steps,
  streaming,
}: {
  steps: TimelineStep[];
  streaming: boolean;
}) {
  // Show a rotating placeholder before the first event arrives.
  if (steps.length === 0 && streaming) {
    return (
      <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <WaitingWord />
        <span>…</span>
      </div>
    );
  }

  return (
    <ol className="relative">
      {steps.map((step, i) => (
        <TimelineNode key={step.id} step={step} isLast={i === steps.length - 1} />
      ))}
    </ol>
  );
}
