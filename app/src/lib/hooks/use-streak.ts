'use client';

import { useCallback } from 'react';
import { useUserStore } from '@/lib/stores/user-store';

interface UseStreakReturn {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  freezesAvailable: number;
  isFreezeActiveToday: boolean;
  recordActivity: () => void;
  useFreeze: () => boolean;
}

/**
 * Exposes the user's daily activity streak and freeze capabilities
 * from the user store.
 *
 * `recordActivity()` delegates to `updateStreak` in the store, which
 * handles consecutive-day logic and localStorage persistence. Safe to
 * call multiple times per day -- the store no-ops on duplicate calls.
 *
 * `useFreeze()` consumes one available freeze to preserve the streak
 * for the current day. Returns `true` on success, `false` if no
 * freezes are available or a freeze is already active today.
 *
 * Users earn a new freeze at every 7-day streak milestone.
 */
export function useStreak(): UseStreakReturn {
  const streak = useUserStore((s) => s.streak);
  const updateStreak = useUserStore((s) => s.updateStreak);
  const storeUseFreeze = useUserStore((s) => s.useFreeze);

  const recordActivity = useCallback(() => {
    updateStreak();
  }, [updateStreak]);

  const handleUseFreeze = useCallback(() => {
    return storeUseFreeze();
  }, [storeUseFreeze]);

  const today = new Date().toISOString().split('T')[0]!;

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastActiveDate: streak.lastActiveDate,
    freezesAvailable: streak.freezesAvailable,
    isFreezeActiveToday: streak.freezeActiveDate === today,
    recordActivity,
    useFreeze: handleUseFreeze,
  };
}
