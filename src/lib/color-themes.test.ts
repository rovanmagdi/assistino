import { describe, expect, it } from "vitest";
import {
  BRAND_THEMES,
  COLOR_THEMES,
  colorThemeOptions,
  colorThemeVars,
  isColorTheme,
  mergeColorThemes,
  presetColor,
} from "./color-themes";

describe("brand presets", () => {
  it("has one distinct preset per product", () => {
    expect(BRAND_THEMES).toEqual(["assistino", "pmk", "tendrix", "talentino AI"]);
    const primaries = BRAND_THEMES.map((b) => COLOR_THEMES[b].light?.["--primary"]);
    expect(new Set(primaries).size).toBe(BRAND_THEMES.length);
  });

  it("recognizes every preset plus default", () => {
    for (const t of ["default", ...BRAND_THEMES]) expect(isColorTheme(t)).toBe(true);
    expect(isColorTheme("nope")).toBe(false);
    expect(isColorTheme(null)).toBe(false);
  });

  it("contributes nothing for default", () => {
    expect(colorThemeVars("default", "light")).toEqual({});
    expect(presetColor("default", "dark", "--primary")).toBe("");
  });
});

describe("mergeColorThemes", () => {
  it("returns the built-ins untouched without overrides", () => {
    expect(mergeColorThemes()).toBe(COLOR_THEMES);
  });

  it("overrides a single variable and keeps the rest of the brand", () => {
    const themes = mergeColorThemes({ pmk: { light: { "--primary": "#123456" } } });
    expect(themes.pmk.light?.["--primary"]).toBe("#123456");
    expect(themes.pmk.light?.["--border"]).toBe(COLOR_THEMES.pmk.light?.["--border"]);
    expect(themes.pmk.dark).toEqual(COLOR_THEMES.pmk.dark);
    expect(themes.tendrix).toBe(COLOR_THEMES.tendrix);
    expect(COLOR_THEMES.pmk.light?.["--primary"]).not.toBe("#123456");
  });

  it("flows overrides into vars, preset colors, and swatches", () => {
    const themes = mergeColorThemes({
      tendrix: { base: { "--radius": "0" }, dark: { "--primary": "#abcdef" } },
    });
    const vars = colorThemeVars("tendrix", "dark", themes) as Record<string, string>;
    expect(vars["--radius"]).toBe("0");
    expect(vars["--primary"]).toBe("#abcdef");
    expect(presetColor("tendrix", "dark", "--primary", themes)).toBe("#abcdef");
    expect(presetColor("tendrix", "light", "--primary", themes)).toBe("#ff750e");

    const opts = colorThemeOptions(mergeColorThemes({ pmk: { light: { "--primary": "red" } } }));
    expect(opts.find((o) => o.value === "pmk")?.swatch).toBe("red");
    expect(opts.map((o) => o.value)).toEqual(["default", ...BRAND_THEMES]);
  });
});
