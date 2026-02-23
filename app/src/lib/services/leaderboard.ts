import type { LeaderboardEntry } from "./types";

export async function getLeaderboard(
  timeframe: "weekly" | "monthly" | "alltime",
): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`/api/leaderboard?timeframe=${timeframe}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
