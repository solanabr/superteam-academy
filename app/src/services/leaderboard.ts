import { fetchAllXpBalances } from "@/lib/solana";
import { xpToLevel } from "@/types";
import type { LeaderboardEntry, LeaderboardTimeframe } from "@/types";
import { supabase } from "@/lib/supabase";

export async function getLeaderboard(
  _timeframe: LeaderboardTimeframe = "all-time"
): Promise<LeaderboardEntry[]> {
  // Fetch all XP token balances from Solana
  const balances = await fetchAllXpBalances();

  if (balances.length === 0) return getMockLeaderboard();

  // Enrich with usernames from Supabase profiles (best-effort)
  const wallets = balances.slice(0, 50).map((b) => b.wallet);
  const profiles: Record<string, { username?: string; avatarUrl?: string }> = {};

  if (supabase) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("wallet_address, username, avatar_url")
        .in("wallet_address", wallets);

      if (data) {
        for (const row of data as Array<{ wallet_address: string; username?: string; avatar_url?: string }>) {
          profiles[row.wallet_address] = {
            username: row.username,
            avatarUrl: row.avatar_url,
          };
        }
      }
    } catch {
      // ignore
    }
  }

  return balances.slice(0, 50).map((entry, i): LeaderboardEntry => ({
    rank: i + 1,
    walletAddress: entry.wallet,
    username: profiles[entry.wallet]?.username,
    avatarUrl: profiles[entry.wallet]?.avatarUrl,
    xpBalance: entry.xp,
    level: xpToLevel(entry.xp),
  }));
}

function getMockLeaderboard(): LeaderboardEntry[] {
  const mocks = [
    { wallet: "7xKXt...8mPQ", xp: 48500 },
    { wallet: "9sR2k...3nVW", xp: 41200 },
    { wallet: "4mPL...7qRT", xp: 37800 },
    { wallet: "2jNK...6wXS", xp: 31100 },
    { wallet: "8rQT...1yZU", xp: 28400 },
    { wallet: "5vBL...9cAB", xp: 24700 },
    { wallet: "1kMN...4fCD", xp: 21300 },
    { wallet: "6wOP...2hEF", xp: 18900 },
    { wallet: "3tQR...7jGH", xp: 16400 },
    { wallet: "0xST...5kIJ", xp: 14100 },
  ];

  return mocks.map((m, i) => ({
    rank: i + 1,
    walletAddress: m.wallet,
    xpBalance: m.xp,
    level: xpToLevel(m.xp),
  }));
}
