import "server-only";

import { getAllLearnerProfilesOnChain } from "@/lib/server/academy-chain-read";
import { getCurrentStreak } from "@/lib/server/activity-store";

export type LeaderboardEntry = {
  wallet: string;
  authority: string;
  xp: number;
  level: number;
  streak: number;
  rank: number;
  lastActivityTs: number;
};

export type TimeFilter = "all" | "monthly" | "weekly";

const CACHE_MS = 5 * 60 * 1000;
let cached: { entries: LeaderboardEntry[]; at: number } | null = null;

async function fetchAll(): Promise<LeaderboardEntry[]> {
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.entries;
  }
  try {
    const profiles = await getAllLearnerProfilesOnChain();
    if (profiles.length === 0 && cached) {
      return cached.entries;
    }
    const streaks = await Promise.all(
      profiles.map((p) => getCurrentStreak(p.authority).catch(() => 0)),
    );
    const entries: LeaderboardEntry[] = profiles
      .map((p, i) => ({
        wallet: p.authority,
        authority: p.authority,
        xp: p.xpTotal,
        level: p.level,
        streak: Math.max(p.streakCurrent, streaks[i]),
        rank: 0,
        lastActivityTs: p.lastActivityTs,
      }))
      .sort((a, b) => b.xp - a.xp);
    entries.forEach((e, i) => {
      e.rank = i + 1;
    });
    cached = { entries, at: Date.now() };
    return entries;
  } catch (error: any) {
    if (
      error?.message?.includes("fetch failed") ||
      error?.message?.includes("ECONNREFUSED") ||
      error?.code === "ENOTFOUND"
    ) {
      if (cached) return cached.entries;
      return [];
    }
    throw error;
  }
}

export async function getCachedLeaderboard(
  filter: TimeFilter = "all",
): Promise<LeaderboardEntry[]> {
  const all = await fetchAll();
  if (filter === "all") return all;

  const now = Date.now() / 1000;
  const cutoff = filter === "weekly" ? now - 7 * 86400 : now - 30 * 86400;

  const filtered = all
    .filter((e) => e.lastActivityTs >= cutoff)
    .sort((a, b) => b.xp - a.xp);
  filtered.forEach((e, i) => {
    e.rank = i + 1;
  });
  return filtered;
}

export function getRankForWallet(
  entries: LeaderboardEntry[],
  wallet: string,
): number | null {
  const i = entries.findIndex((e) => e.wallet === wallet);
  return i >= 0 ? i + 1 : null;
}
