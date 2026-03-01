import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatXp(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`;
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`;
  return xp.toString();
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function getDifficultyColor(difficulty: number): string {
  switch (difficulty) {
    case 1:
      return 'text-green-400 bg-green-400/10';
    case 2:
      return 'text-yellow-400 bg-yellow-400/10';
    case 3:
      return 'text-red-400 bg-red-400/10';
    default:
      return 'text-gray-400 bg-gray-400/10';
  }
}
