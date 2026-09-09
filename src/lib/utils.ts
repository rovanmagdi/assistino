import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts (last wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Short unique id with an optional prefix. */
let _counter = 0;
export function uid(prefix = "id"): string {
  _counter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${rand}-${_counter}`;
}

/** Current time as "HH:MM:SS". */
export function nowTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Fresh conversation id; falls back to `uid` where `crypto.randomUUID` is unavailable. */
export function newSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return uid("session");
}
