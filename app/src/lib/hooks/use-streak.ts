'use client';

import { useCallback } from 'react';
import { useUserStore } from '@/lib/stores/user-store';

interface UseStreakReturn {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  recordActivity: () => void;
}

/**
 * Exposes the user's daily activity streak from the user store.
 *
 * `recordActivity()` delegates to `updateStreak` in the store, which
 * handles consecutive-day logic and localStorage persistence. Safe to
 * call multiple times per day -- the store no-ops on duplicate calls.
 */
export function useStreak(): UseStreakReturn {
  const streak = useUserStore((s) => s.streak);
  const updateStreak = useUserStore((s) => s.updateStreak);

  const recordActivity = useCallback(() => {
    updateStreak();
  }, [updateStreak]);

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastActiveDate: streak.lastActiveDate,
    recordActivity,
  };
}
