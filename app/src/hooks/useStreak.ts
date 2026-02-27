"use client";

import { useState } from "react";
import { getStreakData, recordActivity } from "@/services/streak";
import type { StreakData } from "@/types";

export function useStreak(userId?: string) {
  const [streak, setStreak] = useState<StreakData>(() => getStreakData(userId));

  const record = () => {
    const updated = recordActivity(userId);
    setStreak(updated);
    return updated;
  };

  return { streak, record };
}
