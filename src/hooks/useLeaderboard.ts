"use client";

import { useQuery } from "@tanstack/react-query";
import type { LeaderboardPeriod, LeaderboardResponse } from "@/types";

async function fetchLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardResponse> {
  const res = await fetch(`/api/leaderboard?timeframe=${period}&limit=20`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch leaderboard");
  }

  return (await res.json()) as LeaderboardResponse;
}

export function useLeaderboard(period: LeaderboardPeriod) {
  return useQuery({
    queryKey: ["leaderboard", period],
    queryFn: () => fetchLeaderboard(period),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

