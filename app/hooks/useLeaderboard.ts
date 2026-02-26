"use client";

import { useEffect, useState } from "react";
import { HELIUS_RPC, XP_MINT } from "@/lib/constants";
import { getLevelFromXP, shortenAddress } from "@/lib/utils";
import { LeaderboardEntry } from "@/types";
import { mockLeaderboard } from "@/lib/mockData";

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(mockLeaderboard);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    setLoading(true);
    try {
      const response = await fetch(HELIUS_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "leaderboard",
          method: "getTokenAccounts",
          params: {
            mint: XP_MINT.toBase58(),
            limit: 20,
          },
        }),
      });

      const data = await response.json();

      if (data?.result?.token_accounts?.length > 0) {
        const sorted = data.result.token_accounts
          .sort((a: any, b: any) => b.amount - a.amount)
          .slice(0, 20)
          .map((account: any, index: number) => ({
            wallet: account.owner,
            xp: Number(account.amount),
            level: getLevelFromXP(Number(account.amount)),
            rank: index + 1,
          }));
        setEntries(sorted);
      }
    } catch {
      // Fall back to mock data
      setEntries(mockLeaderboard);
    } finally {
      setLoading(false);
    }
  }

  return { entries, loading, refetch: fetchLeaderboard };
}