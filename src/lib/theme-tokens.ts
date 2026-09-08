import type { CSSProperties } from "react";

/**
 * Every color, radius, and font the widget draws with. Pass a partial set to
 * <AssistinoChat tokens={…} /> (and `darkTokens` for the dark variant) to
 * repaint it in your own brand without writing any CSS.
 *
 * Values are plain CSS — "#137FC3", "rgb(19 127 195)", "oklch(0.57 0.14 244)"
 * all work. Anything left out keeps the Talentino-blue default.
 *
 * The same names exist as CSS custom properties on the widget root, so a
 * stylesheet can set them instead if that fits your app better:
 *
 *     .assistino-chat { --primary: #7C3AED; }
 */
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
  /**
   * A lighter brand color for the always-dark tool progress log, where
   * `primary` itself is usually too dark to read. Does not flip by theme.
   */
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
  /** Body font stack. */
  fontSans?: string;
  /** Heading font stack. */
  fontHeading?: string;
  /** Monospace stack for code and the progress log. */
  fontMono?: string;
}

/** "primaryForeground" → "--primary-foreground" */
function cssVarName(key: string): string {
  return `--${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}

/**
 * Turn a {@link ThemeTokens} object into a React `style` object of CSS custom
 * properties. Undefined entries are dropped so they fall through to the
 * stylesheet default instead of blanking the token out.
 */
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
