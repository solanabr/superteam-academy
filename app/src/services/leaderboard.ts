import type { LeaderboardService } from "./interfaces";
import type { LeaderboardEntry } from "@/types/gamification";

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: "u1",
    username: "solana_dev",
    displayName: "Maria Silva",
    avatarUrl: "",
    totalXP: 12500,
    level: 11,
    currentStreak: 45,
  },
  {
    rank: 2,
    userId: "u2",
    username: "rust_master",
    displayName: "Pedro Santos",
    avatarUrl: "",
    totalXP: 10200,
    level: 10,
    currentStreak: 30,
  },
  {
    rank: 3,
    userId: "u3",
    username: "web3_builder",
    displayName: "Ana Costa",
    avatarUrl: "",
    totalXP: 8900,
    level: 9,
    currentStreak: 22,
  },
  {
    rank: 4,
    userId: "u4",
    username: "anchor_pro",
    displayName: "Lucas Oliveira",
    avatarUrl: "",
    totalXP: 7600,
    level: 8,
    currentStreak: 15,
  },
  {
    rank: 5,
    userId: "u5",
    username: "defi_wizard",
    displayName: "Julia Ferreira",
    avatarUrl: "",
    totalXP: 6300,
    level: 7,
    currentStreak: 12,
  },
  {
    rank: 6,
    userId: "u6",
    username: "nft_creator",
    displayName: "Rafael Lima",
    avatarUrl: "",
    totalXP: 5100,
    level: 7,
    currentStreak: 8,
  },
  {
    rank: 7,
    userId: "u7",
    username: "token_king",
    displayName: "Beatriz Souza",
    avatarUrl: "",
    totalXP: 4200,
    level: 6,
    currentStreak: 5,
  },
  {
    rank: 8,
    userId: "u8",
    username: "chain_dev",
    displayName: "Gabriel Almeida",
    avatarUrl: "",
    totalXP: 3500,
    level: 5,
    currentStreak: 3,
  },
  {
    rank: 9,
    userId: "u9",
    username: "crypto_coder",
    displayName: "Isabela Rodrigues",
    avatarUrl: "",
    totalXP: 2800,
    level: 5,
    currentStreak: 7,
  },
  {
    rank: 10,
    userId: "u10",
    username: "block_builder",
    displayName: "Thiago Martins",
    avatarUrl: "",
    totalXP: 2100,
    level: 4,
    currentStreak: 2,
  },
];

export class SupabaseLeaderboardService implements LeaderboardService {
  async getLeaderboard(
    _timeframe: "weekly" | "monthly" | "alltime",
    limit = 100,
  ): Promise<LeaderboardEntry[]> {
    return MOCK_LEADERBOARD.slice(0, limit);
  }

  async getUserRank(userId: string, _timeframe: string): Promise<number> {
    const entry = MOCK_LEADERBOARD.find((e) => e.userId === userId);
    return entry?.rank ?? -1;
  }
}

export const leaderboardService = new SupabaseLeaderboardService();
