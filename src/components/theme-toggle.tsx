import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

/**
 * Light/dark switch for the widget. Fully controlled — the theme lives in
 * <AssistinoChat /> (see lib/use-theme.ts), not on `document`, so a widget
 * embedded in someone else's page never restyles that page.
 */
export function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={onToggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
