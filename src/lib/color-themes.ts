import type { CSSProperties } from "react";

/**
 * Brand presets selectable from the settings menu. Ported from
 * Assistino_Engine/frontend (branch feat/add-new-chat-theme), with one
 * difference: the engine writes these onto `<html>`, while here they ride as
 * inline custom properties on the widget root so an embedded widget never
 * recolors the page around it.
 *
 * "default" is the package's own Talentino-blue palette from styles/lib.css.
 */
export type ColorTheme = "default" | "pmk" | "tendrix" | "talentino AI";
export type Mode = "light" | "dark";

/** Widget-scoped node style on the timeline rail. */
export type NodeStyle = "icons" | "dots";

type CssVars = Record<string, string>;

interface ThemeDefinition {
  /** Applies in both light and dark mode (radius, fonts, spacing, etc). */
  base?: CssVars;
  /** Overrides/adds on top of `base` when the widget is light. */
  light?: CssVars;
  /** Overrides/adds on top of `base` when the widget is dark. */
  dark?: CssVars;
}

export const COLOR_THEMES: Record<Exclude<ColorTheme, "default">, ThemeDefinition> = {
  pmk: {
    base: {
      "--radius": "0.5rem",
      "--font-sans": '"Inter Variable", ui-sans-serif, sans-serif, system-ui',
      "--font-heading": '"Inter Variable", var(--font-sans)',
    },
    light: {
      "--primary": "hsl(221.2 83.2% 53.3%)",
      "--primary-foreground": "hsl(210 40% 98%)",
      "--ring": "hsl(221.2 83.2% 53.3%)",
      "--secondary": "hsl(210 40% 96.1%)",
      "--secondary-foreground": "hsl(222.2 47.4% 11.2%)",
      "--muted": "hsl(210 40% 96.1%)",
      "--muted-foreground": "hsl(215.4 16.3% 46.9%)",
      "--accent": "hsl(210 40% 96.1%)",
      "--accent-foreground": "hsl(222.2 47.4% 11.2%)",
      "--destructive": "hsl(0 84.2% 60.2%)",
      "--destructive-foreground": "hsl(210 40% 98%)",
      "--border": "hsl(214.3 31.8% 91.4%)",
      "--input": "hsl(214.3 31.8% 91.4%)",
    },
    dark: {
      "--primary": "hsl(217.2 91.2% 59.8%)",
      "--primary-foreground": "hsl(222.2 47.4% 11.2%)",
      "--ring": "hsl(224.3 76.3% 48%)",
      "--secondary": "hsl(217.2 32.6% 17.5%)",
      "--secondary-foreground": "hsl(210 40% 98%)",
      "--muted": "hsl(217.2 32.6% 17.5%)",
      "--muted-foreground": "hsl(215 20.2% 65.1%)",
      "--accent": "hsl(217.2 32.6% 17.5%)",
      "--accent-foreground": "hsl(210 40% 98%)",
      "--destructive": "hsl(0 62.8% 30.6%)",
      "--destructive-foreground": "hsl(210 40% 98%)",
      "--border": "hsl(217.2 32.6% 17.5%)",
      "--input": "hsl(217.2 32.6% 17.5%)",
    },
  },

  tendrix: {
    base: {
      "--radius": "0.9rem",
      "--spacing-unit": "0.28rem",
      "--font-sans": '"Inter Variable", ui-sans-serif, sans-serif, system-ui',
      "--font-heading": '"Space Grotesk Variable", var(--font-sans)',
    },
    light: {
      "--primary": "#ff750e",
      "--primary-foreground": "#ffffff",
      "--ring": "#ff750e",
      "--background": "#ffffff",
      "--foreground": "#000000",
      "--card": "#ffffff",
      "--card-foreground": "#333332",
      "--popover": "#ffffff",
      "--popover-foreground": "#333332",
      "--secondary": "#f8f8f8",
      "--secondary-foreground": "#333332",
      "--muted": "#f8f8f8",
      "--muted-foreground": "#6d6d6d",
      "--accent": "#f8f8f8",
      "--accent-foreground": "#333332",
      "--border": "#e6e6e6",
      "--input": "#e6e6e6",
      "--destructive": "#ef4444",
      "--destructive-foreground": "#ffffff",
    },
    dark: {
      "--primary": "#ff9e4d",
      "--primary-foreground": "#ffffff",
      "--ring": "#ff9e4d",
      "--background": "#121212",
      "--foreground": "#ffffff",
      "--card": "#1a1a1a",
      "--card-foreground": "#ffffff",
      "--popover": "#1a1a1a",
      "--popover-foreground": "#ffffff",
      "--secondary": "#2d2d2d",
      "--secondary-foreground": "#ffffff",
      "--muted": "#2d2d2d",
      "--muted-foreground": "#8a8a8a",
      "--accent": "#2d2d2d",
      "--accent-foreground": "#ffffff",
      "--border": "#3d3d3d",
      "--input": "#3d3d3d",
      "--destructive": "#ff6b6b",
      "--destructive-foreground": "#ffffff",
    },
  },

  "talentino AI": {
    base: {
      "--font-sans": '"Poppins", "Inter Variable", "Open Sans", sans-serif',
      "--font-heading": '"Dubai", "Poppins", sans-serif',
    },
    light: {
      "--primary": "#076698",
      "--primary-foreground": "#f1f5fa",
      "--ring": "#076698",
      "--background": "#ffffff",
      "--foreground": "#1a1a1a",
      "--card": "#ffffff",
      "--card-foreground": "#1a1a1a",
      "--popover": "#bfbfbf",
      "--popover-foreground": "#f0f0f0",
      "--secondary": "#415466",
      "--secondary-foreground": "#909fba",
      "--muted": "#f0f1f3",
      "--muted-foreground": "#415466",
      "--accent": "#f0f1f3",
      "--accent-foreground": "#415466",
      "--destructive": "#ff0000",
      "--destructive-foreground": "#ffffff",
      "--border": "#d2d6db",
      "--input": "#d2d6db",
    },
    dark: {
      "--primary": "#5aa9da",
      "--primary-foreground": "#054d72",
      "--ring": "#2b93d9",
      "--background": "#1a1a1a",
      "--foreground": "#ffffff",
      "--card": "#333333",
      "--card-foreground": "#ffffff",
      "--popover": "#bfbfbf",
      "--popover-foreground": "#f0f0f0",
      "--secondary": "#333333",
      "--secondary-foreground": "#ffffff",
      "--muted": "#333333",
      "--muted-foreground": "#909fba",
      "--accent": "#333333",
      "--accent-foreground": "#ffffff",
      "--destructive": "#d20e24",
      "--destructive-foreground": "#ffffff",
      "--border": "#3a3a3a",
      "--input": "#3a3a3a",
    },
  },
};

export const COLOR_THEME_OPTIONS: { value: ColorTheme; label: string; swatch: string }[] = [
  { value: "default", label: "Default", swatch: "#137FC3" },
  { value: "pmk", label: "PMK", swatch: "hsl(221.2 83.2% 53.3%)" },
  { value: "tendrix", label: "Tendrix", swatch: "#ff750e" },
  { value: "talentino AI", label: "Talentino AI", swatch: "#076698" },
];

export const CUSTOMIZABLE_VARS = ["--primary", "--secondary", "--accent"] as const;
export type CustomColorKey = (typeof CUSTOMIZABLE_VARS)[number];
export type CustomColors = Partial<Record<CustomColorKey, string>>;

export function isColorTheme(value: unknown): value is ColorTheme {
  return value === "default" || (typeof value === "string" && value in COLOR_THEMES);
}

/** The variables a brand preset contributes for one mode, as a style object. */
export function colorThemeVars(theme: ColorTheme, mode: Mode): CSSProperties {
  if (theme === "default") return {};
  const def = COLOR_THEMES[theme];
  return { ...def.base, ...def[mode] } as CSSProperties;
}

/** The preset's own value for a customizable color, "" when it has none. */
export function presetColor(theme: ColorTheme, mode: Mode, variable: CustomColorKey): string {
  if (theme === "default") return "";
  return COLOR_THEMES[theme][mode]?.[variable] ?? "";
}

// ── persistence ──────────────────────────────────────────────────────────────
// Settings survive a reload via localStorage, namespaced so they cannot collide
// with the host app's own keys. Every access is guarded: storage can be absent
// (SSR) or throw (private mode, blocked site data).

const PREFIX = "assistino-chat:";

export function readSetting(key: string): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function writeSetting(key: string, value: string | null): void {
  try {
    if (typeof localStorage === "undefined") return;
    if (value === null) localStorage.removeItem(PREFIX + key);
    else localStorage.setItem(PREFIX + key, value);
  } catch {
    /* storage unavailable — the setting simply lasts for this session */
  }
}

export function customColorKey(theme: ColorTheme, mode: Mode, variable: CustomColorKey): string {
  return `custom-color:${theme}:${mode}:${variable}`;
}

export function readCustomColors(theme: ColorTheme, mode: Mode): CustomColors {
  const out: CustomColors = {};
  for (const v of CUSTOMIZABLE_VARS) {
    const stored = readSetting(customColorKey(theme, mode, v));
    if (stored) out[v] = stored;
  }
  return out;
}
