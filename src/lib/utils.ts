import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts (last wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Short unique id with an optional prefix, e.g. uid("msg") → "msg-4f9a2c-3". */
let _counter = 0;
export function uid(prefix = "id"): string {
  _counter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${rand}-${_counter}`;
}

/** Current wall-clock time as a short "HH:MM:SS" string for progress lines. */
export function nowTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Fresh conversation id. `crypto.randomUUID` is unavailable on http:// origins
 * and older browsers, so fall back to a random string — the server only needs
 * the value to be unique, not a real UUID.
 */
export function newSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return uid("session");
}
