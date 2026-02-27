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

/** Truncate a Solana address or URI for display: "AbCd...xYz1". */
export function truncateAddress(
  address: string,
  prefixLen = 6,
  suffixLen = 4
): string {
  if (address.length <= prefixLen + suffixLen + 3) return address;
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
}
