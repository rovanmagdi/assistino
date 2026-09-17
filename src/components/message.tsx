import { Bot, User } from "lucide-react";
import { AgentTimeline } from "./agent-timeline";
import { Markdown } from "./markdown";
import type { Prose, ToolSkin, ViewMode } from "../lib/agent-view";
import type { ChatMessage } from "../types";

export function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-end gap-[var(--space-md)]">
      <div className="max-w-[80%] rounded-xl rounded-tr-sm bg-primary px-[var(--space-md)] py-[var(--space-sm)] text-sm leading-relaxed text-primary-foreground whitespace-pre-wrap shadow-sm">
        {message.content}
      </div>
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <User className="h-4 w-4" />
      </div>
    </div>
  );
}

export interface AssistantMessageProps {
  message: ChatMessage;
  /** Client/Developer — what the timeline renders at all. Defaults to "developer". */
  viewMode?: ViewMode;
  /** Flat/Terminal — how a tool node is drawn. Forced to "flat" for Client. Defaults to "flat". */
  toolSkin?: ToolSkin;
  /** Explained/Plain — how much narration streams in. Defaults to "explained". */
  prose?: Prose;
  /** stepId, questionId, answer — resolves a paused human_question step. */
  onAnswerQuestion?: (stepId: string, questionId: string, answer: string) => void;
}

export function AssistantMessage({
  message,
  viewMode,
  toolSkin,
  prose,
  onAnswerQuestion,
}: AssistantMessageProps) {
  const steps = message.steps ?? [];
  const hasTextStep = steps.some((s) => s.kind === "answer" || s.kind === "explaining");

  return (
    <div className="flex gap-[var(--space-md)]">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Bot className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <AgentTimeline
          steps={steps}
          streaming={!!message.streaming}
          viewMode={viewMode}
          toolSkin={toolSkin}
          prose={prose}
          onAnswerQuestion={onAnswerQuestion}
        />

        {!hasTextStep && !message.streaming && message.content && (
          <Markdown>{message.content}</Markdown>
        )}

        {message.error && (
          <div className="mt-[var(--space-sm)] rounded-lg border border-destructive/40 bg-destructive/10 px-[var(--space-md)] py-[var(--space-sm)] text-sm text-destructive">
            {message.error}
          </div>
        )}
      </div>
    </div>
  );
}
