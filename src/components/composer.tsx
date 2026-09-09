import { useEffect, useRef, useState, type ReactNode, type TextareaHTMLAttributes } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

/** How the input area looks and behaves. Passed as props of <ChatInput />. */
export interface ComposerOptions {
  /** Placeholder text in the input. */
  placeholder?: string;
  /** Class hooks for each layer — see {@link ComposerClassNames}. */
  classNames?: ComposerClassNames;
  /** The line under the input; `false` removes it. */
  hint?: ReactNode | false;
  /** Rows the empty input starts at. Defaults to 1. */
  minRows?: number;
  /** How tall it may auto-grow before scrolling, in px. Defaults to 200. */
  maxHeight?: number;
  /** Focus the input on mount. */
  autoFocus?: boolean;
  /** Enter submits (Shift+Enter for a newline). Defaults to true. */
  submitOnEnter?: boolean;
  /** Rendered inside the box, before the textarea. */
  leading?: ReactNode;
  /** Rendered inside the box, between the textarea and the send button. */
  trailing?: ReactNode;
  /** Replace the send/stop buttons. */
  renderActions?: (api: ComposerActions) => ReactNode;
  /** Raw <textarea> attributes. `className` is merged, `onKeyDown` runs first. */
  textareaProps?: Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "value" | "defaultValue" | "onChange" | "ref"
  >;
}

/** Class hooks for the composer's layers, outermost first. */
export interface ComposerClassNames {
  /** The outer wrapper (controls width and outer spacing). */
  root?: string;
  /** The bordered input box. */
  box?: string;
  /** The <textarea> itself. */
  textarea?: string;
  /** The hint line under the input. */
  hint?: string;
}

/** Handed to `renderActions` so custom buttons can drive the composer. */
export interface ComposerActions {
  /** Send what is currently typed. No-op while a turn is streaming. */
  submit: () => void;
  /** Abort the streaming turn. */
  stop: () => void;
  /** A turn is in flight. */
  streaming: boolean;
  /** Current input text. */
  value: string;
}

const DEFAULT_HINT = "Enter to send · Shift+Enter for a new line";

export function Composer({
  onSend,
  onStop,
  streaming,
  placeholder = "Ask the ReAct agent…",
  classNames,
  hint = DEFAULT_HINT,
  minRows = 1,
  maxHeight = 200,
  autoFocus,
  submitOnEnter = true,
  leading,
  trailing,
  renderActions,
  textareaProps,
}: {
  onSend: (text: string) => void;
  onStop: () => void;
  streaming: boolean;
} & ComposerOptions) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value, maxHeight]);

  function submit() {
    const text = value.trim();
    if (!text || streaming) return;
    onSend(text);
    setValue("");
  }

  const actions: ComposerActions = { submit, stop: onStop, streaming, value };

  return (
    <div className={cn("w-full px-4 pb-4", classNames?.root)}>
      <div
        className={cn(
          "flex items-end gap-2 rounded-2xl border border-input bg-card p-2 shadow-sm transition-colors focus-within:border-ring",
          classNames?.box,
        )}
      >
        {leading}
        <textarea
          {...textareaProps}
          ref={ref}
          rows={minRows}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            textareaProps?.onKeyDown?.(e);
            if (e.defaultPrevented) return;
            if (submitOnEnter && e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          style={{ maxHeight, ...textareaProps?.style }}
          className={cn(
            "scrollbar-thin flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground",
            classNames?.textarea,
            textareaProps?.className,
          )}
        />
        {trailing}
        {renderActions ? (
          renderActions(actions)
        ) : streaming ? (
          <Button size="icon" variant="outline" onClick={onStop} aria-label="Stop">
            <Square className="h-4 w-4 fill-current" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={submit}
            disabled={!value.trim()}
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
      {hint !== false && (
        <p className={cn("mt-2 text-center text-[11px] text-muted-foreground", classNames?.hint)}>
          {hint}
        </p>
      )}
    </div>
  );
}
