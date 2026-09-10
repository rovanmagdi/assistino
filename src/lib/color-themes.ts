import type { CSSProperties } from "react";

/**
 * Brand presets. "default" applies no preset (the host's CSS on
 * `.assistino-chat` wins); the others are one per product.
 */
export type ColorTheme = "default" | "assistino" | "pmk" | "tendrix" | "talentino AI";
export type BrandTheme = Exclude<ColorTheme, "default">;

/** Every brand, in menu order. */
export const BRAND_THEMES: readonly BrandTheme[] = ["assistino", "pmk", "tendrix", "talentino AI"];
export const COLOR_THEME_VALUES: readonly ColorTheme[] = ["default", ...BRAND_THEMES];
export type Mode = "light" | "dark";

/** Widget-scoped node style on the timeline rail. */
export type NodeStyle = "icons" | "dots";

export type CssVars = Record<string, string>;

/** A brand's CSS variables — the shape hosts pass to `colorThemes` too. */
export interface ThemeDefinition {
  /** Applies in both light and dark mode (radius, fonts, spacing, etc). */
  base?: CssVars;
  /** Overrides/adds on top of `base` when the widget is light. */
  light?: CssVars;
  /** Overrides/adds on top of `base` when the widget is dark. */
  dark?: CssVars;
}

export type ColorThemeMap = Record<BrandTheme, ThemeDefinition>;

/** Per-brand overrides a host can layer on the built-in presets. */
export type ColorThemeOverrides = Partial<Record<BrandTheme, ThemeDefinition>>;

export const COLOR_THEMES: ColorThemeMap = {
  /** The engine palette made explicit — emerald primary on neutral greys. */
  assistino: {
    base: {
      "--radius": "1.2rem",
      "--font-sans": '"Inter Variable", ui-sans-serif, system-ui, sans-serif',
      "--font-heading": '"Space Grotesk Variable", var(--font-sans)',
    },
    light: {
      "--primary": "oklch(0.6929 0.1396 166.5513)",
      "--primary-foreground": "oklch(1 0 0)",
      "--ring": "oklch(0.6929 0.1396 166.5513)",
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.2686 0 0)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.1281 0.0179 169.2764)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.1281 0.0179 169.2764)",
      "--secondary": "oklch(0.9596 0.0275 167.8295)",
      "--secondary-foreground": "oklch(0.2868 0.0649 159.9823)",
      "--muted": "oklch(0.9702 0 0)",
      "--muted-foreground": "oklch(0.5486 0 0)",
      "--accent": "oklch(0.9596 0.0275 167.8295)",
      "--accent-foreground": "oklch(0.2868 0.0649 159.9823)",
      "--destructive": "oklch(0.6368 0.2078 25.3313)",
      "--destructive-foreground": "oklch(1 0 0)",
      "--border": "oklch(0.9208 0.0101 164.8536)",
      "--input": "oklch(0.9208 0.0101 164.8536)",
    },
    dark: {
      "--primary": "oklch(0.6929 0.1396 166.5513)",
      "--primary-foreground": "oklch(1 0 0)",
      "--ring": "oklch(0.6929 0.1396 166.5513)",
      "--background": "oklch(0.24 0 0)",
      "--foreground": "oklch(0.98 0 0)",
      "--card": "oklch(0.28 0 0)",
      "--card-foreground": "oklch(0.98 0 0)",
      "--popover": "oklch(0.28 0 0)",
      "--popover-foreground": "oklch(0.98 0 0)",
      "--secondary": "oklch(0.33 0 0)",
      "--secondary-foreground": "oklch(0.98 0 0)",
      "--muted": "oklch(0.33 0 0)",
      "--muted-foreground": "oklch(0.7 0 0)",
      "--accent": "oklch(0.33 0 0)",
      "--accent-foreground": "oklch(0.98 0 0)",
      "--destructive": "oklch(0.6368 0.2078 25.3313)",
      "--destructive-foreground": "oklch(1 0 0)",
      "--border": "oklch(0.38 0 0)",
      "--input": "oklch(0.38 0 0)",
    },
  },

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

export interface ColorThemeOption {
  value: ColorTheme;
  label: string;
  swatch: string;
}

const THEME_LABELS: Record<ColorTheme, string> = {
  default: "Default",
  assistino: "Assistino",
  pmk: "PMK",
  tendrix: "Tendrix",
  "talentino AI": "Talentino AI",
};

/**
 * Menu entries for `themes` — the swatch is each brand's light primary, so a
 * host override that changes the primary changes the swatch too.
 */
export function colorThemeOptions(themes: ColorThemeMap = COLOR_THEMES): ColorThemeOption[] {
  return COLOR_THEME_VALUES.map((value) => ({
    value,
    label: THEME_LABELS[value],
    swatch:
      value === "default"
        ? "var(--primary)"
        : themes[value].light?.["--primary"] ?? themes[value].base?.["--primary"] ?? "var(--primary)",
  }));
}

/** Menu entries for the built-in presets. */
export const COLOR_THEME_OPTIONS: ColorThemeOption[] = colorThemeOptions();

/**
 * Layer host overrides on the built-in presets, variable by variable, so a
 * host can give one brand a different primary without restating its palette.
 */
export function mergeColorThemes(overrides?: ColorThemeOverrides): ColorThemeMap {
  if (!overrides) return COLOR_THEMES;
  const out = { ...COLOR_THEMES };
  for (const brand of BRAND_THEMES) {
    const o = overrides[brand];
    if (!o) continue;
    const b = COLOR_THEMES[brand];
    out[brand] = {
      base: { ...b.base, ...o.base },
      light: { ...b.light, ...o.light },
      dark: { ...b.dark, ...o.dark },
    };
  }
  return out;
}

export const CUSTOMIZABLE_VARS = ["--primary", "--secondary", "--accent"] as const;
export type CustomColorKey = (typeof CUSTOMIZABLE_VARS)[number];
export type CustomColors = Partial<Record<CustomColorKey, string>>;

export function isColorTheme(value: unknown): value is ColorTheme {
  return typeof value === "string" && (COLOR_THEME_VALUES as readonly string[]).includes(value);
}

/** The variables a brand preset contributes for one mode, as a style object. */
export function colorThemeVars(
  theme: ColorTheme,
  mode: Mode,
  themes: ColorThemeMap = COLOR_THEMES,
): CSSProperties {
  if (theme === "default") return {};
  const def = themes[theme];
  return { ...def.base, ...def[mode] } as CSSProperties;
}

/** The preset's own value for a customizable color, "" when it has none. */
export function presetColor(
  theme: ColorTheme,
  mode: Mode,
  variable: CustomColorKey,
  themes: ColorThemeMap = COLOR_THEMES,
): string {
  if (theme === "default") return "";
  return themes[theme][mode]?.[variable] ?? themes[theme].base?.[variable] ?? "";
}

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
