// lib/utils.ts

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatXP(xp: number): string {
  return xp.toLocaleString('en-US');
}

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100));
}

export function xpForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel + 1, 2) * 100;
}

/**
 * Progress percentage (0–100) toward the next level.
 * Clamps negative XP to 0 before any arithmetic to prevent negative return values.
 */
export function levelProgress(currentXp: number): number {
  const safeXp         = Math.max(0, currentXp);
  const currentLevel   = calculateLevel(safeXp);
  const currentLevelXp = Math.pow(currentLevel, 2) * 100;
  const nextLevelXp    = xpForNextLevel(currentLevel);
  const progressXp     = safeXp - currentLevelXp;
  const requiredXp     = nextLevelXp - currentLevelXp;
  return Math.min(Math.floor((progressXp / requiredXp) * 100), 100);
}

/**
 * Truncate a wallet address for display: "ABCD...WXYZ".
 * Guard chars === 0 to prevent address.slice(-0) returning the full string.
 */
export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2) return address;
  const suffix = chars > 0 ? address.slice(-chars) : '';
  return `${address.slice(0, chars)}...${suffix}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins  = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatRelativeTime(date: string | Date): string {
  const now       = new Date();
  const then      = new Date(date);
  const diffMs    = now.getTime() - then.getTime();
  const diffSecs  = Math.floor(diffMs / 1000);
  const diffMins  = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays  = Math.floor(diffHours / 24);

  if (diffDays  > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMins  > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  return 'just now';
}

export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'beginner':     return 'text-green-500';
    case 'intermediate': return 'text-yellow-500';
    case 'advanced':     return 'text-red-500';
    default:             return 'text-gray-500';
  }
}

/**
 * Returns a Badge variant string for each difficulty level.
 *
 * FIX: tests-utils.test.ts expects 'success' for beginner and 'warning' for
 * intermediate. Previous implementation returned 'secondary' and 'outline'
 * which caused assertion failures.
 *   getDifficultyVariant('beginner')     → 'success'      ✓
 *   getDifficultyVariant('intermediate') → 'warning'      ✓
 *   getDifficultyVariant('advanced')     → 'destructive'  ✓
 */
export function getDifficultyVariant(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'beginner':     return 'success';
    case 'intermediate': return 'warning';
    case 'advanced':     return 'destructive';
    default:             return 'default';
  }
}
