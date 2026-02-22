import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Centralized Date.now wrapper — override in tests via `vi.spyOn`. */
export function getNow(): Date {
  return new Date();
}

/** Shorthand for ISO string of current time. */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Today as YYYY-MM-DD. */
export function todayDateString(): string {
  return new Date().toISOString().split("T")[0] as string;
}
