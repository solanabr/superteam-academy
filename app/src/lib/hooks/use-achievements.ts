'use client';

import { useCallback } from 'react';
import { useUserStore } from '@/lib/stores/user-store';

interface UseAchievementsReturn {
  achievements: string[];
  hasAchievement: (id: string) => boolean;
  isLoading: boolean;
}

/**
 * Provides the user's earned achievement IDs from the user store
 * and a lookup helper for checking individual achievements.
 *
 * The `hasAchievement` callback is stable across renders for a given
 * achievements array (memoized via useCallback with the array dep).
 */
export function useAchievements(): UseAchievementsReturn {
  const achievements = useUserStore((s) => s.achievements);
  const isLoading = useUserStore((s) => s.isLoading);

  const hasAchievement = useCallback(
    (id: string): boolean => achievements.includes(id),
    [achievements],
  );

  return {
    achievements,
    hasAchievement,
    isLoading,
  };
}
