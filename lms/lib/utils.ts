import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

export function getXpForLevel(level: number): number {
  return level * level * 100;
}

export function getXpProgress(xp: number): { current: number; needed: number; percent: number } {
  const level = getLevel(xp);
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const current = xp - currentLevelXp;
  const needed = nextLevelXp - currentLevelXp;
  return { current, needed, percent: Math.min((current / needed) * 100, 100) };
}

export function formatXP(xp: number): string {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toString();
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function isAchievementClaimed(flags: bigint[], index: number): boolean {
  const word = Math.floor(index / 64);
  const bit = index % 64;
  return (flags[word] & (BigInt(1) << BigInt(bit))) !== BigInt(0);
}

export function getUtcDay(timestamp?: number): number {
  const ts = timestamp ?? Date.now() / 1000;
  return Math.floor(ts / 86400);
}
