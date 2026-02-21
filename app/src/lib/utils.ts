import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`
  } else if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`
  }
  return xp.toString()
}

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100))
}

export function calculateXPForNextLevel(currentLevel: number): number {
  const nextLevel = currentLevel + 1
  return nextLevel * nextLevel * 100
}

export function calculateXPProgress(currentXP: number, currentLevel: number): number {
  const currentLevelXP = currentLevel * currentLevel * 100
  const nextLevelXP = calculateXPForNextLevel(currentLevel)
  const progressXP = currentXP - currentLevelXP
  const requiredXP = nextLevelXP - currentLevelXP
  
  return (progressXP / requiredXP) * 100
}

export function formatDifficulty(difficulty: string): string {
  const labels: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  }
  return labels[difficulty] || difficulty
}

export function formatTrackName(track: string): string {
  const labels: Record<string, string> = {
    defi: 'DeFi',
    nft: 'NFTs',
    dao: 'DAOs',
    payments: 'Payments',
    gaming: 'Gaming',
    infrastructure: 'Infrastructure',
  }
  return labels[track] || track.charAt(0).toUpperCase() + track.slice(1)
}