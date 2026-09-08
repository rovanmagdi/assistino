import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from "react";

/**
 * How the widget picks between its light and dark token sets.
 *
 * - "inherit" (default) — follow the host page: dark when the widget sits
 *   inside a `.dark` ancestor, the convention most Tailwind apps use.
 * - "system"            — follow the OS `prefers-color-scheme`.
 * - "light" / "dark"    — pin it, regardless of host or OS.
 */
export type ThemePreference = "inherit" | "system" | "light" | "dark";

/** Resolved appearance, or null when the widget defers to a `.dark` ancestor. */
export type ResolvedTheme = "light" | "dark" | null;

// SSR-safe: on the server there is no matchMedia, so assume light.
function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/**
 * Resolve `preference` into the value for the root element's `data-theme`, and
 * hand back a toggle that overrides it for the rest of the session.
 *
 * The override is deliberately component state rather than a class on
 * `<html>`: an embedded widget must not restyle the page hosting it. `rootRef`
 * is only read to answer "am I currently inside a dark app?" when the toggle
 * flips away from "inherit".
 */
export function useTheme(
  preference: ThemePreference,
  rootRef: RefObject<HTMLElement | null>,
) {
  const [override, setOverride] = useState<"light" | "dark" | null>(null);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);
  const [inheritedDark, setInheritedDark] = useState(false);

  useEffect(() => {
    if (preference !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    setSystemDark(mq.matches);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  // Read the host's theme before paint so the first frame is already correct,
  // then keep watching: apps toggle `.dark` on <html> (or <body>) at runtime,
  // and an embedded widget has to follow them when it is set to inherit.
  useLayoutEffect(() => {
    const read = () => setInheritedDark(!!rootRef.current?.parentElement?.closest(".dark"));
    read();

    if (preference !== "inherit" || typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(read);
    // Only the two elements a theme class realistically lives on — observing
    // the whole tree for class changes would fire on every render.
    for (const el of [document.documentElement, document.body]) {
      if (el) observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    }
    return () => observer.disconnect();
  }, [rootRef, preference]);

  // An explicit `theme` prop change is the host taking control back.
  useEffect(() => setOverride(null), [preference]);

  const resolved: ResolvedTheme =
    override ??
    (preference === "inherit"
      ? null
      : preference === "system"
        ? systemDark
          ? "dark"
          : "light"
        : preference);

  const isDark = resolved ? resolved === "dark" : inheritedDark;
  const toggle = useCallback(() => setOverride(isDark ? "light" : "dark"), [isDark]);

  return { resolved, isDark, toggle };
}
