import { mockLeaderboard } from "@/lib/data/mock-courses";
import { levelFromXp } from "@/lib/solana/constants";
import type { LeaderboardEntry, LeaderboardTimeframe } from "@/types";

export interface LeaderboardService {
  getEntries(timeframe: LeaderboardTimeframe): Promise<LeaderboardEntry[]>;
}

class LocalLeaderboardService implements LeaderboardService {
  async getEntries(timeframe: LeaderboardTimeframe): Promise<LeaderboardEntry[]> {
    const deduction = timeframe === "weekly" ? 1800 : timeframe === "monthly" ? 500 : 0;
    return mockLeaderboard
      .map((entry) => {
        const xp = Math.max(0, entry.xp - deduction);
        return {
          ...entry,
          xp,
          level: levelFromXp(xp),
        };
      })
      .sort((a, b) => b.xp - a.xp);
  }
}

export const leaderboardService: LeaderboardService = new LocalLeaderboardService();
