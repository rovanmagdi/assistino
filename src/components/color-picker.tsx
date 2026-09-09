import { useRef, type ChangeEvent } from "react";

/**
 * A round swatch that opens the browser's native color input. The input is
 * kept in the DOM but invisible so the picker anchors to the swatch.
 */
export function CustomColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      aria-label="Choose color"
      className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/20 shadow-sm ring-1 ring-border transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ backgroundColor: value || "#ffffff" }}
    >
      <input
        ref={inputRef}
        type="color"
        // <input type="color"> only accepts #rrggbb; anything else falls back
        // to white in the dialog while the swatch still shows the real value.
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#ffffff"}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className="absolute inset-0 h-0 w-0 opacity-0"
        tabIndex={-1}
      />
    </button>
  );
}
