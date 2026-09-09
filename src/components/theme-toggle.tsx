import { Check, Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

/**
 * Light/dark switch for the widget. Fully controlled — the theme lives in
 * <AssistinoChat /> (see lib/use-theme.ts), not on `document`, so a widget
 * embedded in someone else's page never restyles that page.
 *
 * `variant="menu"` renders the two-option picker used inside the settings
 * menu; the default is the compact icon button in the header.
 */
export function ThemeToggle({
  dark,
  onToggle,
  onChange,
  variant = "button",
}: {
  dark: boolean;
  onToggle?: () => void;
  onChange?: (dark: boolean) => void;
  variant?: "button" | "menu";
}) {
  const set = (next: boolean) => {
    if (onChange) onChange(next);
    else if (next !== dark) onToggle?.();
  };

  if (variant === "menu") {
    const option = (isDark: boolean, Icon: typeof Sun, label: string) => {
      const selected = dark === isDark;
      return (
        <button
          type="button"
          onClick={() => set(isDark)}
          aria-pressed={selected}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors",
            selected
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1 text-left">{label}</span>
          {selected && <Check className="h-4 w-4" />}
        </button>
      );
    };
    return (
      <div className="grid grid-cols-2 gap-2">
        {option(false, Sun, "Light")}
        {option(true, Moon, "Dark")}
      </div>
    );
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={() => set(!dark)}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
