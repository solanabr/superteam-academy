"use client";

import { levelFromXp } from "@/lib/solana/constants";
import { useUserStore } from "@/lib/store/user-store";
import type { StreakData, StreakDay } from "@/types";
import { useMemo } from "react";
import { useOnChainXp } from "./use-on-chain";

interface XpState {
  totalXp: number;
  onChainXp: number;
  level: number;
  streak: StreakData;
  loading: boolean;
}

function computeStreak(activeDays: string[]): StreakData {
  const set = new Set(activeDays);
  const today = new Date();
  const days: StreakDay[] = [];

  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, active: set.has(key) });
  }

  let currentStreak = 0;
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (set.has(d.toISOString().slice(0, 10))) {
      currentStreak++;
    } else {
      break;
    }
  }

  let longestStreak = 0;
  let run = 0;
  const sorted = [...activeDays].sort();
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      run = 1;
    } else {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      run = diff === 1 ? run + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, run);
  }

  return { currentStreak, longestStreak, days };
}

export const useXp = (walletAddress?: string, _userId = "u-local"): XpState => {
  const { data: onChainXp, isLoading } = useOnChainXp(walletAddress);
  const xp = onChainXp ?? 0;
  const streakDays = useUserStore((s) => s.streakDays);
  const streak = useMemo(() => computeStreak(streakDays), [streakDays]);

  return {
    totalXp: xp,
    onChainXp: xp,
    level: levelFromXp(xp),
    streak,
    loading: isLoading,
  };
};
