import { useQuery } from "@tanstack/react-query";
import type { LeaderboardEntry } from "@/lib/services/learning-progress";

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch("/api/leaderboard?timeframe=all-time");
  const data = (await res.json()) as { entries?: LeaderboardEntry[]; error?: string };
  if (!res.ok || data.error) return [];
  return data.entries ?? [];
}

/**
 * Returns the all-time leaderboard rank for a wallet, or null if not found.
 */
export function useLeaderboardRank(walletAddress: string | undefined): number | null {
  const { data: entries = [] } = useQuery({
    queryKey: ["leaderboard", "all-time"],
    queryFn: fetchLeaderboard,
    enabled: !!walletAddress,
  });

  if (!walletAddress) return null;
  const entry = entries.find((e) => e.wallet === walletAddress);
  return entry?.rank ?? null;
}
