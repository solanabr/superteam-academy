"use client";

import { useState, useCallback } from "react";
import type { StreakData } from "@/types/gamification";

export function useStreak(initial?: Partial<StreakData>) {
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: initial?.currentStreak ?? 0,
    longestStreak: initial?.longestStreak ?? 0,
    lastActivityDate: initial?.lastActivityDate ?? null,
    streakFreezes: initial?.streakFreezes ?? 0,
    isActiveToday: initial?.isActiveToday ?? false,
  });

  const recordActivity = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];

    setStreak((prev) => {
      if (prev.lastActivityDate === today) return prev;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const isConsecutive = prev.lastActivityDate === yesterdayStr;
      const newStreak = isConsecutive ? prev.currentStreak + 1 : 1;

      return {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, prev.longestStreak),
        lastActivityDate: today,
        streakFreezes: prev.streakFreezes,
        isActiveToday: true,
      };
    });
  }, []);

  const useFreeze = useCallback(() => {
    setStreak((prev) => {
      if (prev.streakFreezes <= 0) return prev;
      return { ...prev, streakFreezes: prev.streakFreezes - 1 };
    });
  }, []);

  return { streak, recordActivity, useFreeze };
}
