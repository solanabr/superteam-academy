"use client";

import { useState, useEffect } from "react";
import type { StreakData } from "@/types/gamification";
import { PublicKey } from "@solana/web3.js";

export interface PlayerStats {
  xp: number;
  level: number;
  streak: StreakData | null;
  loading: boolean;
}

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  streakFreezes: 0,
  isActiveToday: false,
};

/**
 * Shared hook that fetches on-chain XP (Token-2022 ATA) and off-chain streak.
 * Used by both Dashboard and Profile pages for consistent stats.
 */
export function usePlayerStats(walletAddress?: string | null): PlayerStats {
  const [stats, setStats] = useState<PlayerStats>({
    xp: 0,
    level: 0,
    streak: null,
    loading: true,
  });

  useEffect(() => {
    // undefined = session still loading, keep skeleton; null = no wallet linked
    if (walletAddress === undefined) return;
    if (walletAddress === null) {
      setStats({ xp: 0, level: 0, streak: null, loading: false });
      return;
    }

    let cancelled = false;

    async function fetchStats() {
      try {
        const [xpResult, apiResult] = await Promise.all([
          import("@/lib/solana/on-chain").then(({ getXPBalance }) =>
            getXPBalance(new PublicKey(walletAddress!)).catch(() => 0),
          ),
          fetch("/api/gamification?type=stats")
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null),
        ]);

        if (cancelled) return;

        const xp = xpResult;
        const level = Math.floor(Math.sqrt(xp / 100));
        const streak: StreakData = apiResult?.streak ?? DEFAULT_STREAK;

        setStats({ xp, level, streak, loading: false });
      } catch {
        if (!cancelled) {
          setStats({ xp: 0, level: 0, streak: null, loading: false });
        }
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, [walletAddress]);

  return stats;
}
