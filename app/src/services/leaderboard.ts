import type { LeaderboardService } from "./interfaces";
import type { LeaderboardEntry } from "@/types/gamification";
import { calculateLevel } from "@/types/gamification";
import { getAdminClient } from "@/lib/supabase/admin";

// --- Mock Implementation ---

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: "u1", username: "solana_dev", displayName: "Maria Silva", avatarUrl: "", totalXP: 12500, level: 11, currentStreak: 45 },
  { rank: 2, userId: "u2", username: "rust_master", displayName: "Pedro Santos", avatarUrl: "", totalXP: 10200, level: 10, currentStreak: 30 },
  { rank: 3, userId: "u3", username: "web3_builder", displayName: "Ana Costa", avatarUrl: "", totalXP: 8900, level: 9, currentStreak: 22 },
  { rank: 4, userId: "u4", username: "anchor_pro", displayName: "Lucas Oliveira", avatarUrl: "", totalXP: 7600, level: 8, currentStreak: 15 },
  { rank: 5, userId: "u5", username: "defi_wizard", displayName: "Julia Ferreira", avatarUrl: "", totalXP: 6300, level: 7, currentStreak: 12 },
  { rank: 6, userId: "u6", username: "nft_creator", displayName: "Rafael Lima", avatarUrl: "", totalXP: 5100, level: 7, currentStreak: 8 },
  { rank: 7, userId: "u7", username: "token_king", displayName: "Beatriz Souza", avatarUrl: "", totalXP: 4200, level: 6, currentStreak: 5 },
  { rank: 8, userId: "u8", username: "chain_dev", displayName: "Gabriel Almeida", avatarUrl: "", totalXP: 3500, level: 5, currentStreak: 3 },
  { rank: 9, userId: "u9", username: "crypto_coder", displayName: "Isabela Rodrigues", avatarUrl: "", totalXP: 2800, level: 5, currentStreak: 7 },
  { rank: 10, userId: "u10", username: "block_builder", displayName: "Thiago Martins", avatarUrl: "", totalXP: 2100, level: 4, currentStreak: 2 },
];

class MockLeaderboardService implements LeaderboardService {
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

// --- Supabase Implementation ---

class SupabaseLeaderboardService implements LeaderboardService {
  private get db() {
    const client = getAdminClient();
    if (!client) throw new Error("Supabase admin client not configured");
    return client;
  }

  async getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime",
    limit = 100,
  ): Promise<LeaderboardEntry[]> {
    if (timeframe === "alltime") {
      return this.getAllTimeLeaderboard(limit);
    }

    // For weekly/monthly, sum XP transactions within the time window
    const now = new Date();
    const cutoff = new Date();
    if (timeframe === "weekly") {
      cutoff.setDate(now.getDate() - 7);
    } else {
      cutoff.setDate(now.getDate() - 30);
    }

    const { data: txData } = await this.db
      .from("xp_transactions")
      .select("user_id, amount")
      .gte("created_at", cutoff.toISOString());

    if (!txData || txData.length === 0) {
      return this.getAllTimeLeaderboard(limit);
    }

    // Aggregate XP per user
    const userXP = new Map<string, number>();
    for (const tx of txData) {
      userXP.set(
        tx.user_id,
        (userXP.get(tx.user_id) ?? 0) + tx.amount,
      );
    }

    // Sort by XP
    const sorted = Array.from(userXP.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    // Fetch profiles for these users
    const userIds = sorted.map(([id]) => id);
    const { data: profiles } = await this.db
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds);

    const { data: statsData } = await this.db
      .from("user_stats")
      .select("user_id, total_xp, current_streak")
      .in("user_id", userIds);

    const profileMap = new Map(
      (profiles ?? []).map((p: Record<string, unknown>) => [p.id, p]),
    );
    const statsMap = new Map(
      (statsData ?? []).map((s: Record<string, unknown>) => [s.user_id, s]),
    );

    return sorted.map(([userId, periodXP], idx) => {
      const profile = profileMap.get(userId) as Record<string, unknown> | undefined;
      const stats = statsMap.get(userId) as Record<string, unknown> | undefined;
      const totalXP = (stats?.total_xp as number) ?? periodXP;

      return {
        rank: idx + 1,
        userId,
        username: (profile?.username as string) ?? "",
        displayName: (profile?.display_name as string) ?? "Anonymous",
        avatarUrl: (profile?.avatar_url as string) ?? "",
        totalXP: periodXP,
        level: calculateLevel(totalXP).level,
        currentStreak: (stats?.current_streak as number) ?? 0,
      };
    });
  }

  private async getAllTimeLeaderboard(
    limit: number,
  ): Promise<LeaderboardEntry[]> {
    const { data, error } = await this.db
      .from("user_stats")
      .select(
        "user_id, total_xp, current_streak, profiles!inner(username, display_name, avatar_url)",
      )
      .order("total_xp", { ascending: false })
      .limit(limit);

    if (error || !data) return MOCK_LEADERBOARD.slice(0, limit);

    return data.map(
      (row: Record<string, unknown>, idx: number): LeaderboardEntry => {
        const profile = row.profiles as Record<string, unknown>;
        const totalXP = (row.total_xp as number) ?? 0;
        return {
          rank: idx + 1,
          userId: row.user_id as string,
          username: (profile?.username as string) ?? "",
          displayName: (profile?.display_name as string) ?? "Anonymous",
          avatarUrl: (profile?.avatar_url as string) ?? "",
          totalXP,
          level: calculateLevel(totalXP).level,
          currentStreak: (row.current_streak as number) ?? 0,
        };
      },
    );
  }

  async getUserRank(userId: string, timeframe: string): Promise<number> {
    if (timeframe === "alltime") {
      // Count users with more XP
      const { data: userStats } = await this.db
        .from("user_stats")
        .select("total_xp")
        .eq("user_id", userId)
        .single();

      if (!userStats) return -1;

      const { count } = await this.db
        .from("user_stats")
        .select("*", { count: "exact", head: true })
        .gt("total_xp", userStats.total_xp);

      return (count ?? 0) + 1;
    }

    // For timeframes, get the full leaderboard and find position
    const leaderboard = await this.getLeaderboard(
      timeframe as "weekly" | "monthly",
      1000,
    );
    const entry = leaderboard.find((e) => e.userId === userId);
    return entry?.rank ?? -1;
  }
}

// --- Singleton with fallback ---

function createService(): LeaderboardService {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return new SupabaseLeaderboardService();
  }
  return new MockLeaderboardService();
}

export const leaderboardService: LeaderboardService = createService();
