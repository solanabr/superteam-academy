import type { LeaderboardEntry, LeaderboardTimeframe } from "@/types";

export interface LeaderboardService {
  getLeaderboard(
    timeframe: LeaderboardTimeframe,
    limit?: number,
    offset?: number,
  ): Promise<LeaderboardEntry[]>;
  getUserRank(
    userId: string,
    timeframe: LeaderboardTimeframe,
  ): Promise<LeaderboardEntry | null>;
  getTotalParticipants(timeframe: LeaderboardTimeframe): Promise<number>;
}
