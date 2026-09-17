import { useCallback, useMemo, useState, type CSSProperties } from "react";
import {
  COLOR_THEME_VALUES,
  colorThemeOptions,
  colorThemeVars,
  customColorKey,
  CUSTOMIZABLE_VARS,
  isColorTheme,
  mergeColorThemes,
  presetColor,
  readCustomColors,
  readSetting,
  writeSetting,
  type ColorTheme,
  type ColorThemeOverrides,
  type CustomColorKey,
  type CustomColors,
  type Mode,
  type NodeStyle,
} from "./color-themes";
import {
  isProse,
  isResponseLength,
  isToolSkin,
  isViewMode,
  type Prose,
  type ResponseLength,
  type ToolSkin,
  type ViewMode,
} from "./agent-view";

const EMPTY: CustomColors = {};

export interface ChatSettingsOptions {
  /** Brand preset to start from when nothing is remembered. */
  defaultColorTheme?: ColorTheme;
  /** Host overrides layered on the built-in brand presets, per brand. */
  colorThemes?: ColorThemeOverrides;
  /** Rail marker style to start from when nothing is remembered. */
  defaultNodeStyle?: NodeStyle;
  /** Who's viewing when nothing is remembered. Defaults to "client". */
  defaultViewMode?: ViewMode;
  /** When false the view mode is clamped to "client", even against a remembered value. */
  developerView?: boolean;
  /** Tool-node skin to start from when nothing is remembered. Defaults to "flat". */
  defaultToolSkin?: ToolSkin;
  /** Narration density to start from when nothing is remembered. Defaults to "explained". */
  defaultProse?: Prose;
  /** Final-answer length to start from when nothing is remembered. Defaults to "long". */
  defaultResponseLength?: ResponseLength;
  /** Remember choices in localStorage (namespaced `assistino-chat:*`). */
  persist?: boolean;
}

/** The user-adjustable settings behind the gear menu, plus the CSS they produce. */
export function useChatSettings(
  mode: Mode,
  {
    defaultColorTheme = "default",
    defaultNodeStyle = "icons",
    defaultViewMode = "client",
    developerView = true,
    defaultToolSkin = "flat",
    defaultProse = "explained",
    defaultResponseLength = "long",
    persist = true,
    colorThemes,
  }: ChatSettingsOptions,
) {
  const themes = useMemo(() => mergeColorThemes(colorThemes), [colorThemes]);
  const themeOptions = useMemo(() => colorThemeOptions(themes), [themes]);

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

  const clampViewMode = useCallback(
    (m: ViewMode): ViewMode => (developerView ? m : "client"),
    [developerView],
  );

  const [viewModeState, setViewModeState] = useState<ViewMode>(() => {
    const stored = persist ? readSetting("view-mode") : null;
    return isViewMode(stored) ? stored : defaultViewMode;
  });
  const viewMode = clampViewMode(viewModeState);

  const [toolSkin, setToolSkinState] = useState<ToolSkin>(() => {
    const stored = persist ? readSetting("tool-skin") : null;
    return isToolSkin(stored) ? stored : defaultToolSkin;
  });

  const [prose, setProseState] = useState<Prose>(() => {
    const stored = persist ? readSetting("prose") : null;
    return isProse(stored) ? stored : defaultProse;
  });

  const [responseLength, setResponseLengthState] = useState<ResponseLength>(() => {
    const stored = persist ? readSetting("response-length") : null;
    return isResponseLength(stored) ? stored : defaultResponseLength;
  });

  const [custom, setCustom] = useState<Record<string, CustomColors>>(() => {
    if (!persist) return {};
    const out: Record<string, CustomColors> = {};
    for (const t of COLOR_THEME_VALUES) {
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

  const setViewMode = useCallback(
    (m: ViewMode) => {
      const next = clampViewMode(m);
      setViewModeState(next);
      remember("view-mode", next === defaultViewMode ? null : next);
    },
    [clampViewMode, defaultViewMode, remember],
  );

  const setToolSkin = useCallback(
    (s: ToolSkin) => {
      setToolSkinState(s);
      remember("tool-skin", s === defaultToolSkin ? null : s);
    },
    [defaultToolSkin, remember],
  );

  const setProse = useCallback(
    (p: Prose) => {
      setProseState(p);
      remember("prose", p === defaultProse ? null : p);
    },
    [defaultProse, remember],
  );

  const setResponseLength = useCallback(
    (l: ResponseLength) => {
      setResponseLengthState(l);
      remember("response-length", l === defaultResponseLength ? null : l);
    },
    [defaultResponseLength, remember],
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
    () => ({ ...colorThemeVars(colorTheme, mode, themes), ...customForCurrent }) as CSSProperties,
    [colorTheme, mode, themes, customForCurrent],
  );

  const customColorValues = useCallback(
    (resolve: (variable: CustomColorKey) => string): Record<CustomColorKey, string> => {
      const out = {} as Record<CustomColorKey, string>;
      for (const v of CUSTOMIZABLE_VARS) {
        out[v] = customForCurrent[v] || presetColor(colorTheme, mode, v, themes) || resolve(v);
      }
      return out;
    },
    [customForCurrent, colorTheme, mode, themes],
  );

  return {
    colorTheme,
    setColorTheme,
    /** Built-in presets with the host's overrides applied. */
    themes,
    /** Menu entries (label + swatch) for the brand picker. */
    themeOptions,
    nodeStyle,
    setNodeStyle,
    /** Client/Developer — already clamped to "client" when `developerView` is false. */
    viewMode,
    setViewMode,
    /** Whether the Developer option is offered at all. */
    developerView,
    toolSkin,
    setToolSkin,
    prose,
    setProse,
    responseLength,
    setResponseLength,
    setCustomColor,
    resetCustomColors,
    customColorValues,
    vars,
  };
}
