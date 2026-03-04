export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  walletShort: string;
  xp: number;
  level: number;
  isCurrentUser: boolean;
}

export type LeaderboardPeriod = "all-time" | "weekly" | "monthly";

export type LeaderboardResponse = {
  timeframe: LeaderboardPeriod;
  entries: LeaderboardEntry[];
  fallbackToAllTime: boolean;
  notice?: string;
};

