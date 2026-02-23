import { mockLeaderboard } from "@/lib/data/mock-courses";
import { levelFromXp } from "@/lib/solana/constants";
import type { LeaderboardEntry, LeaderboardTimeframe } from "@/types";

export interface LeaderboardService {
  getEntries(timeframe: LeaderboardTimeframe): Promise<LeaderboardEntry[]>;
  getEntriesWithUser(
    timeframe: LeaderboardTimeframe,
    user?: { userId: string; username: string; avatar: string; xp: number },
  ): Promise<LeaderboardEntry[]>;
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

  async getEntriesWithUser(
    timeframe: LeaderboardTimeframe,
    user?: { userId: string; username: string; avatar: string; xp: number },
  ): Promise<LeaderboardEntry[]> {
    const entries = await this.getEntries(timeframe);
    if (!user || entries.some((e) => e.userId === user.userId)) {
      return entries;
    }
    const userEntry: LeaderboardEntry = {
      userId: user.userId,
      username: user.username,
      avatar: user.avatar,
      xp: user.xp,
      level: levelFromXp(user.xp),
      country: "🇧🇷",
      weeklyGain: user.xp > 0 ? Math.min(user.xp, 150) : 0,
      badges: ["Active Learner"],
      isCurrentUser: true,
    };
    return [...entries, userEntry].sort((a, b) => b.xp - a.xp);
  }
}

export const leaderboardService: LeaderboardService = new LocalLeaderboardService();
