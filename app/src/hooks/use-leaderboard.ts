"use client";

import { useState, useEffect } from "react";
import type { LeaderboardEntry } from "@/types/gamification";
import { leaderboardService } from "@/services/leaderboard";

type Timeframe = "weekly" | "monthly" | "alltime";

export function useLeaderboard(timeframe: Timeframe = "alltime") {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    leaderboardService
      .getLeaderboard(timeframe)
      .then((data) => {
        if (!cancelled) {
          setEntries(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [timeframe]);

  return { entries, loading };
}
