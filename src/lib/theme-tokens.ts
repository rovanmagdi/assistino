import type { CSSProperties } from "react";

/** Every color, radius, and font the widget draws with, as plain CSS values. */
export interface ThemeTokens {
  /** Page behind the whole widget. */
  background?: string;
  /** Default text color. */
  foreground?: string;
  /** Raised surfaces: the composer, code blocks, tool panels. */
  card?: string;
  cardForeground?: string;
  popover?: string;
  popoverForeground?: string;
  /** Brand color — user bubbles, primary buttons, links, active states. */
  primary?: string;
  /** Text/icons drawn on top of `primary`. */
  primaryForeground?: string;
  /** Lighter brand color for the always-dark progress log. */
  primaryBright?: string;
  secondary?: string;
  secondaryForeground?: string;
  /** Subdued fills: code backgrounds, inactive chips. */
  muted?: string;
  /** Secondary text — timestamps, hints, captions. */
  mutedForeground?: string;
  /** Hover/selected fills. */
  accent?: string;
  accentForeground?: string;
  /** Errors, failed tool calls, low-confidence badges. */
  destructive?: string;
  destructiveForeground?: string;
  /** Completed tool calls, high-confidence badges. */
  success?: string;
  /** Warnings, medium-confidence badges, pending actions. */
  warning?: string;
  /** Hairlines and dividers. */
  border?: string;
  /** Border of inputs and the composer. */
  input?: string;
  /** Focus ring. */
  ring?: string;
  /** Corner rounding, e.g. "0.75rem". Smaller radii cascade from it. */
  radius?: string;
  /** Base of the spacing scale (--space-xs … --space-xl), default "0.25rem". */
  spacingUnit?: string;
  /** Body font stack. */
  fontSans?: string;
  /** Heading font stack. */
  fontHeading?: string;
  /** Monospace stack for code and the progress log. */
  fontMono?: string;
}

function cssVarName(key: string): string {
  return `--${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}

/** {@link ThemeTokens} → inline CSS custom properties. Empty entries are dropped. */
export function themeTokensToVars(...tokenSets: (ThemeTokens | undefined)[]): CSSProperties {
  const vars: Record<string, string> = {};
  for (const tokens of tokenSets) {
    if (!tokens) continue;
    for (const [key, value] of Object.entries(tokens)) {
      if (typeof value === "string" && value !== "") vars[cssVarName(key)] = value;
    }
  }
  return vars as CSSProperties;
}
