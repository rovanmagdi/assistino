import { useCallback, useMemo, useState, type CSSProperties } from "react";
import {
  colorThemeVars,
  customColorKey,
  CUSTOMIZABLE_VARS,
  isColorTheme,
  presetColor,
  readCustomColors,
  readSetting,
  writeSetting,
  type ColorTheme,
  type CustomColorKey,
  type CustomColors,
  type Mode,
  type NodeStyle,
} from "./color-themes";

const EMPTY: CustomColors = {};

export interface ChatSettingsOptions {
  /** Brand preset to start from when nothing is remembered. */
  defaultColorTheme?: ColorTheme;
  /** Rail marker style to start from when nothing is remembered. */
  defaultNodeStyle?: NodeStyle;
  /** Remember choices in localStorage (namespaced `assistino-chat:*`). */
  persist?: boolean;
}

/** The user-adjustable settings behind the gear menu, plus the CSS they produce. */
export function useChatSettings(
  mode: Mode,
  { defaultColorTheme = "default", defaultNodeStyle = "icons", persist = true }: ChatSettingsOptions,
) {
  const remember = useCallback(
    (key: string, value: string | null) => {
      if (persist) writeSetting(key, value);
    },
    [persist],
  );

  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    const stored = persist ? readSetting("color-theme") : null;
    return isColorTheme(stored) ? stored : defaultColorTheme;
  });

  const [nodeStyle, setNodeStyleState] = useState<NodeStyle>(() => {
    const stored = persist ? readSetting("node-style") : null;
    return stored === "dots" || stored === "icons" ? stored : defaultNodeStyle;
  });

  const [custom, setCustom] = useState<Record<string, CustomColors>>(() => {
    if (!persist) return {};
    const out: Record<string, CustomColors> = {};
    for (const t of ["default", "pmk", "tendrix", "talentino AI"] as ColorTheme[]) {
      for (const m of ["light", "dark"] as Mode[]) {
        const c = readCustomColors(t, m);
        if (Object.keys(c).length) out[`${t}:${m}`] = c;
      }
    }
    return out;
  });
  const bucket = `${colorTheme}:${mode}`;
  const customForCurrent = custom[bucket] ?? EMPTY;

  const setColorTheme = useCallback(
    (t: ColorTheme) => {
      setColorThemeState(t);
      remember("color-theme", t === "default" ? null : t);
    },
    [remember],
  );

  const setNodeStyle = useCallback(
    (s: NodeStyle) => {
      setNodeStyleState(s);
      remember("node-style", s === "icons" ? null : s);
    },
    [remember],
  );

  const setCustomColor = useCallback(
    (variable: CustomColorKey, color: string) => {
      setCustom((prev) => ({ ...prev, [bucket]: { ...prev[bucket], [variable]: color } }));
      remember(customColorKey(colorTheme, mode, variable), color);
    },
    [bucket, colorTheme, mode, remember],
  );

  const resetCustomColors = useCallback(() => {
    setCustom((prev) => {
      const next = { ...prev };
      delete next[bucket];
      return next;
    });
    for (const v of CUSTOMIZABLE_VARS) remember(customColorKey(colorTheme, mode, v), null);
  }, [bucket, colorTheme, mode, remember]);

  const vars = useMemo<CSSProperties>(
    () => ({ ...colorThemeVars(colorTheme, mode), ...customForCurrent }) as CSSProperties,
    [colorTheme, mode, customForCurrent],
  );

  const customColorValues = useCallback(
    (resolve: (variable: CustomColorKey) => string): Record<CustomColorKey, string> => {
      const out = {} as Record<CustomColorKey, string>;
      for (const v of CUSTOMIZABLE_VARS) {
        out[v] = customForCurrent[v] || presetColor(colorTheme, mode, v) || resolve(v);
      }
      return out;
    },
    [customForCurrent, colorTheme, mode],
  );

  return {
    colorTheme,
    setColorTheme,
    nodeStyle,
    setNodeStyle,
    setCustomColor,
    resetCustomColors,
    customColorValues,
    vars,
  };
}
