import { fetchAllXpBalances } from "@/lib/solana";
import { xpToLevel } from "@/types";
import type { LeaderboardEntry, LeaderboardTimeframe } from "@/types";
import { supabase } from "@/lib/supabase";

export async function getLeaderboard(
  timeframe: LeaderboardTimeframe = "all-time"
): Promise<LeaderboardEntry[]> {
  // Fetch all XP token balances from Solana
  const balances = await fetchAllXpBalances();

  if (balances.length === 0) return getMockLeaderboard(timeframe);

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

function getMockLeaderboard(timeframe: LeaderboardTimeframe = "all-time"): LeaderboardEntry[] {
  const allTime = [
    { wallet: "7xKXt...8mPQ", xp: 48500, username: "sol_maxi" },
    { wallet: "9sR2k...3nVW", xp: 41200, username: "anchor_dev" },
    { wallet: "4mPL...7qRT", xp: 37800, username: "rustacean" },
    { wallet: "2jNK...6wXS", xp: 31100, username: "degen_builder" },
    { wallet: "8rQT...1yZU", xp: 28400, username: "lamport_lord" },
    { wallet: "5vBL...9cAB", xp: 24700, username: "pdaMaster" },
    { wallet: "1kMN...4fCD", xp: 21300, username: "zk_curious" },
    { wallet: "6wOP...2hEF", xp: 18900, username: "helius_fan" },
    { wallet: "3tQR...7jGH", xp: 16400, username: "spl_enjoyer" },
    { wallet: "0xST...5kIJ", xp: 14100, username: "wagmi_dev" },
  ];

  const monthly = [
    { wallet: "5vBL...9cAB", xp: 6200, username: "pdaMaster" },
    { wallet: "8rQT...1yZU", xp: 5800, username: "lamport_lord" },
    { wallet: "2jNK...6wXS", xp: 4900, username: "degen_builder" },
    { wallet: "7xKXt...8mPQ", xp: 4400, username: "sol_maxi" },
    { wallet: "3tQR...7jGH", xp: 3800, username: "spl_enjoyer" },
    { wallet: "0xST...5kIJ", xp: 3300, username: "wagmi_dev" },
    { wallet: "1kMN...4fCD", xp: 2900, username: "zk_curious" },
    { wallet: "6wOP...2hEF", xp: 2500, username: "helius_fan" },
  ];

  const weekly = [
    { wallet: "3tQR...7jGH", xp: 1450, username: "spl_enjoyer" },
    { wallet: "0xST...5kIJ", xp: 1280, username: "wagmi_dev" },
    { wallet: "5vBL...9cAB", xp: 980, username: "pdaMaster" },
    { wallet: "1kMN...4fCD", xp: 820, username: "zk_curious" },
    { wallet: "8rQT...1yZU", xp: 650, username: "lamport_lord" },
  ];

  const mocks = timeframe === "weekly" ? weekly : timeframe === "monthly" ? monthly : allTime;

  return mocks.map((m, i) => ({
    rank: i + 1,
    walletAddress: m.wallet,
    username: m.username,
    xpBalance: m.xp,
    level: xpToLevel(m.xp),
  }));
}
