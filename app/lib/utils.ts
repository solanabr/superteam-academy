import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PublicKey } from "@solana/web3.js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string | PublicKey, chars = 4): string {
  const str = typeof address === "string" ? address : address.toBase58();
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}

export function formatXP(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`;
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`;
  return xp.toString();
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getLevelFromXP(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

export function getXPForNextLevel(level: number): number {
  return (level + 1) * (level + 1) * 100;
}

export function getXPProgressPercent(xp: number): number {
  const level = getLevelFromXP(xp);
  const currentLevelXp = level * level * 100;
  const nextLevelXp = getXPForNextLevel(level);
  return ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
}

export function isLessonComplete(
  lessonFlags: bigint[],
  lessonIndex: number
): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  return (lessonFlags[wordIndex] & (1n << BigInt(bitIndex))) !== 0n;
}

export function countCompletedLessons(lessonFlags: bigint[]): number {
  return lessonFlags.reduce((sum, word) => {
    let count = 0;
    let w = word;
    while (w > 0n) {
      count += Number(w & 1n);
      w >>= 1n;
    }
    return sum + count;
  }, 0);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}