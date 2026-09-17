import type { LucideIcon } from "lucide-react";
import type { SummarizedObservation } from "../../lib/summarize-observation";
import type { Prose } from "../../lib/agent-view";
import type { TimelineStep } from "../../types";

/** Everything a skin needs to render one tool step; derived once in ToolNode. */
export interface ToolBodyProps {
  step: Extract<TimelineStep, { kind: "tool" }>;
  /** Always false for the terminal skin, which is Developer-only. */
  isClient: boolean;
  /** "explained" keeps progress narration; "plain" swaps it for ElapsedBadge. */
  prose: Prose;
  running: boolean;
  open: boolean;
  onToggleOpen: () => void;
  icon: LucideIcon;
  label: string;
  summary: string;
  hasArgs: boolean;
  hasDetail: boolean;
  humanizedArgs: { label: string; value: string }[];
  summarized: SummarizedObservation | null;
  isSqlResult: boolean;
}
