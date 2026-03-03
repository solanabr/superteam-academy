import { xpToLevel } from "@/types";
import type { LeaderboardEntry, LeaderboardTimeframe } from "@/types";
import { fetchAllXpBalances } from "@/lib/solana";
import { supabase } from "@/lib/supabase";

export async function getLeaderboard(
  timeframe: LeaderboardTimeframe = "all-time",
): Promise<LeaderboardEntry[]> {
  // weekly / monthly: Supabase has timestamps; fall through to on-chain if unavailable
  if (timeframe !== "all-time" && supabase) {
    const since = new Date();
    if (timeframe === "weekly") since.setDate(since.getDate() - 7);
    else since.setMonth(since.getMonth() - 1);

    const { data } = await supabase
      .from("lesson_completions")
      .select("wallet_address, xp_earned")
      .gte("completed_at", since.toISOString());

    if (data && data.length > 0) {
      const totals: Record<string, number> = {};
      for (const row of data) {
        if (!row.wallet_address) continue;
        totals[row.wallet_address] =
          (totals[row.wallet_address] ?? 0) + (row.xp_earned ?? 0);
      }
      return await enrichWithProfiles(
        Object.entries(totals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 50)
          .map(([wallet, xp]) => ({ wallet, xp })),
      );
    }
  }

  // all-time (and fallback): read from Token-2022 on-chain
  const balances = await fetchAllXpBalances();
  return enrichWithProfiles(
    balances.slice(0, 50).map(({ wallet, xp }) => ({ wallet, xp })),
  );
}

async function enrichWithProfiles(
  entries: Array<{ wallet: string; xp: number }>,
): Promise<LeaderboardEntry[]> {
  let profileMap: Record<
    string,
    { username?: string; display_name?: string; avatar_url?: string }
  > = {};

  if (supabase && entries.length > 0) {
    const wallets = entries.map((e) => e.wallet);
    const { data } = await supabase
      .from("profiles")
      .select("wallet_address, username, display_name, avatar_url")
      .in("wallet_address", wallets);

    for (const row of data ?? []) {
      if (row.wallet_address) profileMap[row.wallet_address] = row;
    }
  }

  return entries.map((entry, i) => {
    const profile = profileMap[entry.wallet] ?? {};
    return {
      rank: i + 1,
      walletAddress: entry.wallet,
      username: profile.username ?? undefined,
      displayName: profile.display_name ?? undefined,
      avatarUrl: profile.avatar_url ?? undefined,
      xpBalance: entry.xp,
      level: xpToLevel(entry.xp),
    };
  });
}
