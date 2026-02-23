"use client";

import { useQuery } from "@tanstack/react-query";

export interface LeaderboardEntry {
  wallet: string;
  xp: number;
  rank: number;
}

export function useLeaderboard() {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
    staleTime: 60_000,
  });
}
