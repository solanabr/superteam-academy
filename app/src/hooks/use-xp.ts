"use client";

import { useState, useCallback } from "react";
import { calculateLevel } from "@/types/gamification";

const DAILY_XP_CAP = 2000;

export function useXP(initialXP = 0) {
  const [totalXP, setTotalXP] = useState(initialXP);
  const [dailyXP, setDailyXP] = useState(0);
  const level = calculateLevel(totalXP);

  const awardXP = useCallback(
    (amount: number) => {
      const remaining = DAILY_XP_CAP - dailyXP;
      const awarded = Math.min(amount, remaining);
      if (awarded <= 0) return 0;

      setTotalXP((prev) => prev + awarded);
      setDailyXP((prev) => prev + awarded);
      return awarded;
    },
    [dailyXP],
  );

  const xpToNextLevel = (level.level + 1) ** 2 * 100 - totalXP;

  return {
    totalXP,
    dailyXP,
    level: level.level,
    xpToNextLevel: Math.max(0, xpToNextLevel),
    progress: level.progress,
    awardXP,
    isAtDailyCap: dailyXP >= DAILY_XP_CAP,
  };
}
