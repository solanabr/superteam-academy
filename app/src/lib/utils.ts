import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

export function xpForLevel(level: number): number {
  return level * level * 100;
}

export function xpProgress(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
} {
  const level = getLevel(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const progress =
    ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  return { level, currentLevelXp, nextLevelXp, progress };
}

export function formatXP(xp: number): string {
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}k`;
  }
  return xp.toString();
}

export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/** Inline style for a difficulty badge given its hex color. */
export function difficultyStyle(color: string) {
  return { backgroundColor: `${color}18`, color };
}

/** Read the current user's display name from localStorage profile. */
export function getUserDisplayName(): string {
  if (typeof window === "undefined") return "Anonymous";
  try {
    const raw = localStorage.getItem("sta-profile");
    if (raw) {
      const p = JSON.parse(raw);
      if (p.displayName) return p.displayName as string;
    }
  } catch {
    /* ignore */
  }
  return "Anonymous Learner";
}

/** Format an ISO timestamp as a compact relative date string. */
export function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return new Date(iso).toLocaleDateString();
}
