"use client";

import { useState, useEffect, useCallback } from "react";
import type { LeaderboardEntry } from "@/types/progress";

type LeaderboardTimeframe = "weekly" | "monthly" | "alltime";

interface EnrichedEntry extends LeaderboardEntry {
  onChainXP?: number;
}

interface LeaderboardData {
  entries: EnrichedEntry[];
  userRank?: number;
  onChainAvailable: boolean;
}

interface UseLeaderboardReturn {
  entries: EnrichedEntry[];
  userRank: number | null;
  isLoading: boolean;
  error: Error | null;
  timeframe: LeaderboardTimeframe;
  setTimeframe: (tf: LeaderboardTimeframe) => void;
  courseSlug: string | null;
  setCourseSlug: (courseSlug: string | null) => void;
  limit: number;
  setLimit: (limit: number) => void;
  refresh: () => void;
  onChainAvailable: boolean;
  showOnChain: boolean;
  setShowOnChain: (show: boolean) => void;
}

/**
 * Hook for fetching leaderboard data
 */
export function useLeaderboard(initialLimit = 50): UseLeaderboardReturn {
  const [entries, setEntries] = useState<EnrichedEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>("alltime");
  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const [limit, setLimit] = useState(initialLimit);
  const [refreshKey, setRefreshKey] = useState(0);
  const [onChainAvailable, setOnChainAvailable] = useState(false);
  const [showOnChain, setShowOnChain] = useState(false);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchLeaderboard() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          timeframe,
          limit: limit.toString(),
        });
        if (courseSlug) {
          params.set("course", courseSlug);
        }

        const response = await fetch(`/api/leaderboard?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
        }

        const result = (await response.json()) as { data: LeaderboardData };
        const data = result.data;

        if (!cancelled) {
          setEntries(data.entries ?? []);
          setUserRank(data.userRank ?? null);
          setOnChainAvailable(data.onChainAvailable ?? false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setEntries([]);
          setUserRank(null);
          setOnChainAvailable(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [courseSlug, timeframe, limit, refreshKey]);

  return {
    entries,
    userRank,
    isLoading,
    error,
    timeframe,
    setTimeframe,
    courseSlug,
    setCourseSlug,
    limit,
    setLimit,
    refresh,
    onChainAvailable,
    showOnChain,
    setShowOnChain,
  };
}
