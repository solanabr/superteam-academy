import "server-only";

import { getAllLearnerProfilesOnChain } from "@/lib/server/academy-chain-read";

export type LeaderboardEntry = {
  wallet: string;
  authority: string;
  xp: number;
  level: number;
  streak: number;
  rank: number;
};

const CACHE_MS = 5 * 60 * 1000;
let cached: { entries: LeaderboardEntry[]; at: number } | null = null;

export async function getCachedLeaderboard(): Promise<LeaderboardEntry[]> {
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.entries;
  }
  try {
    const profiles = await getAllLearnerProfilesOnChain();
    // If network error returned empty array, use cached data if available
    if (profiles.length === 0 && cached) {
      return cached.entries;
    }
    const entries: LeaderboardEntry[] = profiles
      .map((p) => ({
        wallet: p.authority,
        authority: p.authority,
        xp: p.xpTotal,
        level: p.level,
        streak: p.streakCurrent,
        rank: 0,
      }))
      .sort((a, b) => b.xp - a.xp);
    entries.forEach((e, i) => {
      e.rank = i + 1;
    });
    cached = { entries, at: Date.now() };
    return entries;
  } catch (error: any) {
    // Network errors - return cached data if available, otherwise empty array
    if (
      error?.message?.includes("fetch failed") ||
      error?.message?.includes("ECONNREFUSED") ||
      error?.code === "ENOTFOUND"
    ) {
      if (cached) {
        return cached.entries;
      }
      return [];
    }
    throw error;
  }
}

export function getRankForWallet(
  entries: LeaderboardEntry[],
  wallet: string,
): number | null {
  const i = entries.findIndex((e) => e.wallet === wallet);
  return i >= 0 ? i + 1 : null;
}
