import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from "react";

/** "inherit" follows a `.dark` ancestor, "system" the OS, "light"/"dark" pin it. */
export type ThemePreference = "inherit" | "system" | "light" | "dark";

/** Resolved appearance, or null when the widget defers to a `.dark` ancestor. */
export type ResolvedTheme = "light" | "dark" | null;

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/** Resolve `preference` for the root's `data-theme`, plus a session override. */
export function useTheme(
  preference: ThemePreference,
  rootRef: RefObject<HTMLElement | null>,
  initialOverride: "light" | "dark" | null = null,
) {
  const [override, setOverride] = useState<"light" | "dark" | null>(initialOverride);
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

  useLayoutEffect(() => {
    const read = () => setInheritedDark(!!rootRef.current?.parentElement?.closest(".dark"));
    read();

    if (preference !== "inherit" || typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(read);
    for (const el of [document.documentElement, document.body]) {
      if (el) observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    }
    return () => observer.disconnect();
  }, [rootRef, preference]);

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
  const set = useCallback((mode: "light" | "dark" | null) => setOverride(mode), []);

  return { resolved, isDark, toggle, set };
}
