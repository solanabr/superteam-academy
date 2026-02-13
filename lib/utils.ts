import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function levelFromXP(totalXP: number): number {
  if (totalXP <= 0) {
    return 0;
  }

  return Math.floor(Math.sqrt(totalXP / 100));
}

export function formatXP(totalXP: number): string {
  return Intl.NumberFormat('en-US').format(totalXP);
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}
