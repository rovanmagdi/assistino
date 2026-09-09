import { useEffect, useState } from "react";
import { Check, Paintbrush, Palette, Pencil, Settings, Shapes, Sun, X } from "lucide-react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { CustomColorPicker } from "./color-picker";
import { cn } from "../lib/utils";
import {
  COLOR_THEME_OPTIONS,
  CUSTOMIZABLE_VARS,
  type ColorTheme,
  type CustomColorKey,
  type NodeStyle,
} from "../lib/color-themes";

const CUSTOM_COLOR_LABELS: Record<CustomColorKey, string> = {
  "--primary": "Primary",
  "--secondary": "Secondary",
  "--accent": "Accent",
};

/** Everything the menu edits. */
export interface SettingsMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dark: boolean;
  onDarkChange: (dark: boolean) => void;
  colorTheme: ColorTheme;
  onColorThemeChange: (theme: ColorTheme) => void;
  /** Current effective values of the three customizable colors. */
  customColors: Record<CustomColorKey, string>;
  onCustomColorChange: (variable: CustomColorKey, color: string) => void;
  onResetCustomColors: () => void;
  nodeStyle: NodeStyle;
  onNodeStyleChange: (style: NodeStyle) => void;
}

/** Header gear button plus the settings panel it opens. */
export function SettingsMenu({
  open,
  onOpenChange,
  dark,
  onDarkChange,
  colorTheme,
  onColorThemeChange,
  customColors,
  onCustomColorChange,
  onResetCustomColors,
  nodeStyle,
  onNodeStyleChange,
}: SettingsMenuProps) {
  const [tab, setTab] = useState<"brand" | "custom">("brand");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const choice = (selected: boolean) =>
    cn(
      "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
      selected
        ? "border-primary bg-primary/10 text-primary"
        : "border-border hover:bg-accent hover:text-accent-foreground",
    );

  const tabButton = (id: "brand" | "custom", Icon: typeof Palette, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={cn(
        "relative pb-2.5 text-sm font-medium transition-colors",
        tab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      {tab === id && (
        <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
      )}
    </button>
  );

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onOpenChange(!open)}
        aria-label="Settings"
        aria-expanded={open}
      >
        <Settings className="h-4 w-4" />
      </Button>

      {open && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onOpenChange(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            className="scrollbar-thin max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-background shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="font-heading text-base font-semibold">Settings</h2>
                <p className="text-xs text-muted-foreground">Customize your agent interface</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                aria-label="Close settings"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6 p-5">
              <section>
                <SectionHeading
                  icon={Sun}
                  title="Appearance"
                  subtitle="Choose how the interface looks"
                />
                <ThemeToggle variant="menu" dark={dark} onChange={onDarkChange} />
              </section>

              <section>
                <div className="flex items-center gap-6 border-b border-border">
                  {tabButton("brand", Palette, "Brand")}
                  {tabButton("custom", Paintbrush, "Custom theme")}
                </div>

                {tab === "brand" && (
                  <div className="mt-4 space-y-2">
                    <div className="mb-3">
                      <p className="text-sm font-medium">Product theme</p>
                      <p className="text-xs text-muted-foreground">
                        Choose a predefined brand theme
                      </p>
                    </div>
                    {COLOR_THEME_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onColorThemeChange(opt.value)}
                        className={choice(colorTheme === opt.value)}
                      >
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: opt.swatch }}
                        />
                        <span className="flex-1 text-left">{opt.label}</span>
                        {colorTheme === opt.value && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                )}

                {tab === "custom" && (
                  <div className="mt-4">
                    <div className="mb-4">
                      <p className="text-sm font-medium">Theme colors</p>
                      <p className="text-xs text-muted-foreground">
                        Customize the main colors of your theme
                      </p>
                    </div>

                    <div className="space-y-4">
                      {CUSTOMIZABLE_VARS.map((key) => {
                        const value = customColors[key];
                        return (
                          <div key={key} className="grid grid-cols-2 gap-3">
                            <div className="flex items-center text-sm font-medium">
                              {CUSTOM_COLOR_LABELS[key]}
                            </div>
                            <div className="relative flex h-10 items-center overflow-hidden rounded-full border border-border bg-background pl-1.5 transition-colors hover:border-primary/50">
                              <CustomColorPicker
                                value={value}
                                onChange={(c) => onCustomColorChange(key, c)}
                              />
                              <span className="flex-1 truncate px-3 font-mono text-xs">
                                {value ? value.toUpperCase() : "Select color"}
                              </span>
                              <span className="flex h-full items-center px-3 text-muted-foreground">
                                <Pencil className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                      <div>
                        <p className="text-xs font-medium">Restore default colors</p>
                        <p className="text-[11px] text-muted-foreground">
                          Reset all custom colors for this theme
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 rounded-lg text-xs"
                        onClick={onResetCustomColors}
                      >
                        Reset to default
                      </Button>
                    </div>
                  </div>
                )}
              </section>

              <section>
                <SectionHeading
                  icon={Shapes}
                  title="Timeline"
                  subtitle="Choose how timeline steps are displayed"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onNodeStyleChange("icons")}
                    className={choice(nodeStyle === "icons")}
                  >
                    <Shapes className="h-4 w-4" />
                    <span className="flex-1 text-left">Icons</span>
                    {nodeStyle === "icons" && <Check className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onNodeStyleChange("dots")}
                    className={choice(nodeStyle === "dots")}
                  >
                    <span className="mx-0.5 h-2.5 w-2.5 rounded-full bg-current" />
                    <span className="flex-1 text-left">Dots</span>
                    {nodeStyle === "dots" && <Check className="h-4 w-4" />}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Sun;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
