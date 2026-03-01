import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || 'ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf'
);

export const XP_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_XP_MINT || 'xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3'
);

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
);

export const MPL_CORE_PROGRAM_ID = new PublicKey(
  'CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d'
);

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

export const HELIUS_RPC_URL =
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 'https://api.devnet.solana.com';

export const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet') as
  | 'devnet'
  | 'mainnet-beta';

/** Level = floor(sqrt(xp / 100)) */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

/** XP needed for next level */
export function xpForLevel(level: number): number {
  return level * level * 100;
}

/** XP progress within current level (0-1) */
export function levelProgress(xp: number): number {
  const currentLevel = calculateLevel(xp);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  if (nextLevelXp === currentLevelXp) return 1;
  return (xp - currentLevelXp) / (nextLevelXp - currentLevelXp);
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
};

export const TRACK_LABELS: Record<number, string> = {
  1: 'Anchor',
  2: 'DeFi',
  3: 'NFTs',
  4: 'Gaming',
  5: 'Mobile',
};
