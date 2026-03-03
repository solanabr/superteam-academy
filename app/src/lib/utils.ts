import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatXP(xp: number): string {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toString();
}

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

export function xpForLevel(level: number): number {
  return level * level * 100;
}

export function xpProgress(xp: number): { level: number; current: number; needed: number; percentage: number } {
  const level = calculateLevel(xp);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const current = xp - currentLevelXP;
  const needed = nextLevelXP - currentLevelXP;
  const percentage = Math.min((current / needed) * 100, 100);
  return { level, current, needed, percentage };
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case "beginner": return "text-emerald-500";
    case "intermediate": return "text-amber-500";
    case "advanced": return "text-red-500";
    default: return "text-muted-foreground";
  }
}

export function getDifficultyBg(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case "beginner": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "intermediate": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "advanced": return "bg-red-500/10 text-red-500 border-red-500/20";
    default: return "bg-muted text-muted-foreground";
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function isLessonComplete(lessonFlags: number[], lessonIndex: number): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  if (wordIndex >= lessonFlags.length) return false;
  return (lessonFlags[wordIndex] & (1 << bitIndex)) !== 0;
}

export function countCompletedLessons(lessonFlags: number[], totalLessons: number): number {
  let count = 0;
  for (let i = 0; i < totalLessons; i++) {
    if (isLessonComplete(lessonFlags, i)) count++;
  }
  return count;
}
