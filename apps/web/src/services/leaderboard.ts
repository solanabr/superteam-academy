import type {
  LeaderboardEntry,
  LeaderboardTimeframe,
  WalletAddress
} from "./models";

export interface LeaderboardService {
  getLeaderboard(
    timeframe: LeaderboardTimeframe
  ): Promise<LeaderboardEntry[]>;

  getUserRank(
    wallet: WalletAddress,
    timeframe: LeaderboardTimeframe
  ): Promise<LeaderboardEntry | null>;
}

class StubLeaderboardService implements LeaderboardService {
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return [];
  }

  async getUserRank(): Promise<LeaderboardEntry | null> {
    return null;
  }
}

export const leaderboardService: LeaderboardService =
  new StubLeaderboardService();

