import { useEffect, useState } from "react";
import {
  AlignLeft,
  Check,
  MessageSquareText,
  Paintbrush,
  Palette,
  Pencil,
  Settings,
  Shapes,
  SquareTerminal,
  Sun,
  User,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { CustomColorPicker } from "./color-picker";
import { cn } from "../lib/utils";
import {
  COLOR_THEME_OPTIONS,
  CUSTOMIZABLE_VARS,
  type ColorTheme,
  type ColorThemeOption,
  type CustomColorKey,
  type NodeStyle,
} from "../lib/color-themes";
import {
  RESPONSE_LENGTHS,
  type Prose,
  type ResponseLength,
  type ToolSkin,
  type ViewMode,
} from "../lib/agent-view";

const CUSTOM_COLOR_LABELS: Record<CustomColorKey, string> = {
  "--primary": "Primary",
  "--secondary": "Secondary",
  "--accent": "Accent",
};

/** Everything the menu edits. Optional sections render only when value and handler are both passed. */
export interface SettingsMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dark: boolean;
  onDarkChange: (dark: boolean) => void;
  colorTheme: ColorTheme;
  onColorThemeChange: (theme: ColorTheme) => void;
  /** Brand entries to list; defaults to the built-in presets. */
  colorThemeOptions?: ColorThemeOption[];
  /** Current effective values of the three customizable colors. */
  customColors: Record<CustomColorKey, string>;
  onCustomColorChange: (variable: CustomColorKey, color: string) => void;
  onResetCustomColors: () => void;
  nodeStyle: NodeStyle;
  onNodeStyleChange: (style: NodeStyle) => void;
  /** Client/Developer — what the timeline renders at all. */
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  /** Offer the Developer option. When false the section reads as fixed to Client. Defaults to true. */
  developerView?: boolean;
  /** Flat/Terminal — Developer-only, greyed out while viewing as Client. */
  toolSkin?: ToolSkin;
  onToolSkinChange?: (skin: ToolSkin) => void;
  /** Explained/Plain — how much narration streams in on its own. */
  prose?: Prose;
  onProseChange?: (prose: Prose) => void;
  /** Short/Medium/Long — how long the final answer runs. */
  responseLength?: ResponseLength;
  onResponseLengthChange?: (length: ResponseLength) => void;
}

/** Header gear button plus the settings panel it opens. */
export function SettingsMenu({
  open,
  onOpenChange,
  dark,
  onDarkChange,
  colorTheme,
  onColorThemeChange,
  colorThemeOptions = COLOR_THEME_OPTIONS,
  customColors,
  onCustomColorChange,
  onResetCustomColors,
  nodeStyle,
  onNodeStyleChange,
  viewMode,
  onViewModeChange,
  developerView = true,
  toolSkin,
  onToolSkinChange,
  prose,
  onProseChange,
  responseLength,
  onResponseLengthChange,
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

  const choice = (selected: boolean, disabled = false) =>
    cn(
      "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
      selected
        ? "border-primary bg-primary/10 text-primary"
        : "border-border hover:bg-accent hover:text-accent-foreground",
      disabled && "cursor-not-allowed opacity-60 hover:bg-transparent hover:text-current",
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

  const showViewMode = viewMode !== undefined && onViewModeChange !== undefined;
  const showProse = prose !== undefined && onProseChange !== undefined;
  const showLength = responseLength !== undefined && onResponseLengthChange !== undefined;
  const showToolSkin = developerView && toolSkin !== undefined && onToolSkinChange !== undefined;
  const isClient = viewMode === "client";

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
                    {colorThemeOptions.map((opt) => (
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

              {showViewMode && (
                <section>
                  <SectionHeading
                    icon={User}
                    title="View mode"
                    subtitle="What the agent timeline shows on this screen"
                  />
                  <div className={developerView ? "grid grid-cols-2 gap-2" : undefined}>
                    <button
                      type="button"
                      onClick={() => onViewModeChange("client")}
                      disabled={!developerView}
                      className={cn(choice(viewMode === "client"), !developerView && "cursor-default")}
                    >
                      <User className="h-4 w-4" />
                      <span className="flex-1 text-left">Client</span>
                      {viewMode === "client" && <Check className="h-4 w-4" />}
                    </button>
                    {developerView && (
                      <button
                        type="button"
                        onClick={() => onViewModeChange("developer")}
                        className={choice(viewMode === "developer")}
                      >
                        <Wrench className="h-4 w-4" />
                        <span className="flex-1 text-left">Developer</span>
                        {viewMode === "developer" && <Check className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {developerView
                      ? "Client hides internal steps entirely — routing decisions, raw SQL/JSON, and the agent's own memory writes never render."
                      : "Fixed to Client on this deployment."}
                  </p>
                </section>
              )}

              {showProse && (
                <section>
                  <SectionHeading
                    icon={MessageSquareText}
                    title="Prose"
                    subtitle="How much narration shows while the agent is working"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onProseChange("explained")}
                      className={choice(prose === "explained")}
                    >
                      <MessageSquareText className="h-4 w-4" />
                      <span className="flex-1 text-left">Explained</span>
                      {prose === "explained" && <Check className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onProseChange("plain")}
                      className={choice(prose === "plain")}
                    >
                      <AlignLeft className="h-4 w-4" />
                      <span className="flex-1 text-left">Plain</span>
                      {prose === "plain" && <Check className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Plain drops the reasoning paragraph and step-by-step narration in favor of a
                    quick elapsed-time readout per action — the tool call and its result are still
                    there, just not narrated as they happen.
                  </p>
                </section>
              )}

              {showLength && (
                <section>
                  <SectionHeading
                    icon={AlignLeft}
                    title="Response length"
                    subtitle="How long the final answer runs"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    {RESPONSE_LENGTHS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => onResponseLengthChange(value)}
                        className={cn(choice(responseLength === value), "justify-between capitalize")}
                      >
                        {value}
                        {responseLength === value && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {showToolSkin && (
                <section className={isClient ? "opacity-50" : undefined}>
                  <SectionHeading
                    icon={SquareTerminal}
                    title="Tool display skin"
                    subtitle={
                      isClient ? "Developer-only — Client always uses the flat view" : "How a tool call is drawn"
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isClient}
                      onClick={() => onToolSkinChange("flat")}
                      className={choice(toolSkin === "flat", isClient)}
                    >
                      <Shapes className="h-4 w-4" />
                      <span className="flex-1 text-left">Flat</span>
                      {toolSkin === "flat" && <Check className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      disabled={isClient}
                      onClick={() => onToolSkinChange("terminal")}
                      className={choice(toolSkin === "terminal", isClient)}
                    >
                      <SquareTerminal className="h-4 w-4" />
                      <span className="flex-1 text-left">Terminal</span>
                      {toolSkin === "terminal" && <Check className="h-4 w-4" />}
                    </button>
                  </div>
                </section>
              )}

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
