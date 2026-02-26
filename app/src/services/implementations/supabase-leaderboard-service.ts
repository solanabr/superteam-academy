import type { LeaderboardService } from "../leaderboard-service";
import type { LeaderboardEntry, LeaderboardTimeframe } from "@/types";

// Fetches leaderboard via server API route (bypasses RLS, works for all users)
export const supabaseLeaderboardService: LeaderboardService = {
  async getLeaderboard(
    timeframe: LeaderboardTimeframe = "all-time",
    limit = 50,
    offset = 0,
  ) {
    const params = new URLSearchParams({
      timeframe,
      limit: String(limit),
      offset: String(offset),
    });

    const res = await fetch(`/api/leaderboard?${params}`);
    if (!res.ok) return [];

    const { entries } = await res.json();
    return (entries ?? []) as LeaderboardEntry[];
  },

  async getUserRank(userId, timeframe = "all-time") {
    const params = new URLSearchParams({
      timeframe,
      limit: "1000",
    });

    const res = await fetch(`/api/leaderboard?${params}`);
    if (!res.ok) return null;

    const { entries } = (await res.json()) as { entries: LeaderboardEntry[] };
    return entries.find((e) => e.walletAddress === userId) ?? null;
  },

  async getTotalParticipants(timeframe = "all-time") {
    const params = new URLSearchParams({ timeframe, limit: "1" });

    const res = await fetch(`/api/leaderboard?${params}`);
    if (!res.ok) return 0;

    const { total } = await res.json();
    return (total ?? 0) as number;
  },
};
