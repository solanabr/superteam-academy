import { xpToLevel } from "@/types";
import type { LeaderboardEntry, LeaderboardTimeframe } from "@/types";
import { supabase } from "@/lib/supabase";

export async function getLeaderboard(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _timeframe: LeaderboardTimeframe = "all-time"
): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("wallet_address, username, display_name, avatar_url, total_xp")
    .eq("is_public", true)
    .gt("total_xp", 0)
    .order("total_xp", { ascending: false })
    .limit(50);

  if (error || !data || data.length === 0) return [];

  return data.map((row, i) => ({
    rank: i + 1,
    walletAddress: row.wallet_address ?? "",
    username: row.username ?? undefined,
    displayName: row.display_name ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    xpBalance: row.total_xp ?? 0,
    level: xpToLevel(row.total_xp ?? 0),
  }));
}
