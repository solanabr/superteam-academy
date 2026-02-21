import type { LeaderboardService } from "../leaderboard-service";
import type { LeaderboardEntry, LeaderboardTimeframe } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { xpProgress } from "@/lib/constants";

// TODO: Replace with Helius DAS API for on-chain Token-2022 balance ranking
export const supabaseLeaderboardService: LeaderboardService = {
  async getLeaderboard(
    _timeframe: LeaderboardTimeframe,
    limit = 50,
    offset = 0,
  ) {
    const supabase = createSupabaseBrowserClient();

    const { data: progressData } = await supabase
      .from("course_progress")
      .select("user_id, xp_earned");

    if (!progressData?.length) return [];

    // Aggregate XP per user
    const xpByUser = new Map<string, number>();
    for (const row of progressData) {
      const current = xpByUser.get(row.user_id) ?? 0;
      xpByUser.set(row.user_id, current + (row.xp_earned ?? 0));
    }

    // Sort by XP descending
    const sorted = Array.from(xpByUser.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(offset, offset + limit);

    const userIds = sorted.map(([id]) => id);

    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, wallet_address")
      .in("id", userIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p]),
    );

    return sorted.map(([userId, xp], i) => {
      const profile = profileMap.get(userId);
      const info = xpProgress(xp);
      return {
        rank: offset + i + 1,
        walletAddress: profile?.wallet_address ?? "",
        username: profile?.username,
        displayName: profile?.display_name,
        avatarUrl: profile?.avatar_url,
        xp,
        level: info.level,
      } satisfies LeaderboardEntry;
    });
  },

  async getUserRank(userId, _timeframe) {
    const supabase = createSupabaseBrowserClient();

    const { data: progressData } = await supabase
      .from("course_progress")
      .select("user_id, xp_earned");

    if (!progressData?.length) return null;

    const xpByUser = new Map<string, number>();
    for (const row of progressData) {
      const current = xpByUser.get(row.user_id) ?? 0;
      xpByUser.set(row.user_id, current + (row.xp_earned ?? 0));
    }

    const sorted = Array.from(xpByUser.entries()).sort((a, b) => b[1] - a[1]);
    const index = sorted.findIndex(([id]) => id === userId);
    if (index === -1) return null;

    const xp = sorted[index][1];
    const info = xpProgress(xp);

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url, wallet_address")
      .eq("id", userId)
      .single();

    return {
      rank: index + 1,
      walletAddress: profile?.wallet_address ?? "",
      username: profile?.username,
      displayName: profile?.display_name,
      avatarUrl: profile?.avatar_url,
      xp,
      level: info.level,
    } satisfies LeaderboardEntry;
  },

  async getTotalParticipants(_timeframe) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("course_progress")
      .select("user_id");

    if (!data?.length) return 0;

    const uniqueUsers = new Set(data.map((r) => r.user_id));
    return uniqueUsers.size;
  },
};
