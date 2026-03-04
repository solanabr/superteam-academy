import type { StreakData, Achievement, LeaderboardEntry } from "@/types";

const ACHIEVEMENTS: Achievement[] = [
  { id: "first-steps", title: "First Steps", description: "Complete your first lesson", icon: "🚀", category: "progress", xpReward: 25, isUnlocked: false },
  { id: "course-completer", title: "Course Completer", description: "Complete your first course", icon: "🎓", category: "progress", xpReward: 100, isUnlocked: false },
  { id: "speed-runner", title: "Speed Runner", description: "Complete a course in one day", icon: "⚡", category: "progress", xpReward: 150, isUnlocked: false },
  { id: "five-courses", title: "Scholar", description: "Complete 5 courses", icon: "📚", category: "progress", xpReward: 250, isUnlocked: false },
  { id: "week-warrior", title: "Week Warrior", description: "Maintain a 7-day streak", icon: "🔥", category: "streak", xpReward: 50, isUnlocked: false },
  { id: "monthly-master", title: "Monthly Master", description: "Maintain a 30-day streak", icon: "💪", category: "streak", xpReward: 200, isUnlocked: false },
  { id: "consistency-king", title: "Consistency King", description: "Maintain a 100-day streak", icon: "👑", category: "streak", xpReward: 500, isUnlocked: false },
  { id: "rust-rookie", title: "Rust Rookie", description: "Complete a Rust challenge", icon: "🦀", category: "skill", xpReward: 50, isUnlocked: false },
  { id: "anchor-expert", title: "Anchor Expert", description: "Complete all Anchor courses", icon: "⚓", category: "skill", xpReward: 300, isUnlocked: false },
  { id: "full-stack-solana", title: "Full Stack Solana", description: "Complete frontend and backend tracks", icon: "🏗️", category: "skill", xpReward: 500, isUnlocked: false },
  { id: "helper", title: "Helper", description: "Help another learner", icon: "🤝", category: "community", xpReward: 50, isUnlocked: false },
  { id: "first-comment", title: "First Comment", description: "Leave your first comment", icon: "💬", category: "community", xpReward: 25, isUnlocked: false },
  { id: "early-adopter", title: "Early Adopter", description: "Join during beta", icon: "🌟", category: "special", xpReward: 100, isUnlocked: false },
  { id: "bug-hunter", title: "Bug Hunter", description: "Report a valid bug", icon: "🐛", category: "special", xpReward: 150, isUnlocked: false },
  { id: "perfect-score", title: "Perfect Score", description: "Complete a course with 100% on first try", icon: "💯", category: "special", xpReward: 200, isUnlocked: false },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: "user1", username: "solana_dev", walletAddress: "So1Dev123456789abcdefghijklmnopqrstuvwx", xp: 15000, level: 12, streak: 45, change: 0 },
  { rank: 2, userId: "user2", username: "rust_master", walletAddress: "RuStMa123456789abcdefghijklmnopqrstuvwx", xp: 12500, level: 11, streak: 30, change: 1 },
  { rank: 3, userId: "user3", username: "anchor_pro", walletAddress: "AnChPr123456789abcdefghijklmnopqrstuvwx", xp: 10800, level: 10, streak: 28, change: -1 },
  { rank: 4, userId: "user4", username: "defi_builder", walletAddress: "DeFiBu123456789abcdefghijklmnopqrstuvwx", xp: 9200, level: 9, streak: 21, change: 2 },
  { rank: 5, userId: "user5", username: "nft_creator", walletAddress: "NftCre123456789abcdefghijklmnopqrstuvwx", xp: 8500, level: 9, streak: 15, change: 0 },
  { rank: 6, userId: "user6", username: "web3_ninja", walletAddress: "Web3Ni123456789abcdefghijklmnopqrstuvwx", xp: 7800, level: 8, streak: 14, change: 1 },
  { rank: 7, userId: "user7", username: "crypto_coder", walletAddress: "CryCoD123456789abcdefghijklmnopqrstuvwx", xp: 6500, level: 8, streak: 12, change: -2 },
  { rank: 8, userId: "user8", username: "chain_wizard", walletAddress: "ChaWiz123456789abcdefghijklmnopqrstuvwx", xp: 5200, level: 7, streak: 10, change: 0 },
  { rank: 9, userId: "user9", username: "token_smith", walletAddress: "TokSmi123456789abcdefghijklmnopqrstuvwx", xp: 4800, level: 6, streak: 8, change: 3 },
  { rank: 10, userId: "user10", username: "block_builder", walletAddress: "BloBui123456789abcdefghijklmnopqrstuvwx", xp: 4200, level: 6, streak: 7, change: -1 },
];

/**
 * Stub implementation of GamificationService using localStorage
 */
export class StubGamificationService {
  async getXP(userId: string): Promise<number> {
    if (typeof window === "undefined") return 0;
    const xpKey = `superteam_xp_${userId}`;
    return parseInt(localStorage.getItem(xpKey) || "0", 10);
  }

  async getXPBalance(): Promise<{ data: number }> {
    return { data: Math.floor(Math.random() * 5000) + 500 };
  }

  async getStreak(userId?: string): Promise<{ data: StreakData }> {
    const streakData: StreakData = {
      currentStreak: Math.floor(Math.random() * 15) + 1,
      longestStreak: Math.floor(Math.random() * 30) + 10,
      lastActivityDate: new Date().toISOString().split("T")[0],
      freezesAvailable: Math.floor(Math.random() * 3),
      streakHistory: [],
    };
    return { data: streakData };
  }

  async getAchievements(userId?: string): Promise<{ data: Achievement[] }> {
    const achievements = ACHIEVEMENTS.map((a, i) => ({
      ...a,
      isUnlocked: i < 3,
      unlockedAt: i < 3 ? new Date() : undefined,
    }));
    return { data: achievements };
  }

  async getRank(): Promise<{ data: number }> {
    return { data: Math.floor(Math.random() * 100) + 1 };
  }

  async awardXP(amount: number, source: string, sourceId: string): Promise<{ data: number }> {
    return { data: amount };
  }

  async claimAchievement(userId: string, achievementId: string): Promise<{ xpEarned: number }> {
    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!achievement) throw new Error("Achievement not found");
    return { xpEarned: achievement.xpReward };
  }

  async getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime",
    options?: { limit?: number }
  ): Promise<{ data: LeaderboardEntry[] }> {
    const limit = options?.limit || 100;
    const variance = timeframe === "weekly" ? 0.8 : timeframe === "monthly" ? 0.9 : 1;
    const data = MOCK_LEADERBOARD.slice(0, limit).map((entry) => ({
      ...entry,
      xp: Math.floor(entry.xp * variance * (0.9 + Math.random() * 0.2)),
    }));
    return { data };
  }

  async getUserRank(userId: string, timeframe: "weekly" | "monthly" | "alltime"): Promise<number> {
    return Math.floor(Math.random() * 100) + 1;
  }
}

export const gamificationService = new StubGamificationService();
