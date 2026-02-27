// Utility functions
export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

export function xpForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel + 1, 2) * 100;
}

export function xpProgress(xp: number): { current: number; required: number; percentage: number } {
  const level = calculateLevel(xp);
  const currentLevelXP = Math.pow(level, 2) * 100;
  const nextLevelXP = Math.pow(level + 1, 2) * 100;
  const current = xp - currentLevelXP;
  const required = nextLevelXP - currentLevelXP;
  const percentage = (current / required) * 100;
  return { current, required, percentage };
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
