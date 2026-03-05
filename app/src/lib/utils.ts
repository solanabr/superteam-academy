import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Level = floor(sqrt(xp / 100)) */
export function xpToLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

export function levelToXp(level: number): number {
  return level * level * 100;
}

export function xpProgressInLevel(xp: number): {
  current: number;
  next: number;
  percent: number;
} {
  const level = xpToLevel(xp);
  const current = levelToXp(level);
  const next = levelToXp(level + 1);
  const percent =
    next === current ? 100 : ((xp - current) / (next - current)) * 100;
  return { current, next, percent };
}
