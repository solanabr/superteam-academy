'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  XPBalance,
  StreakData,
  UserAchievement,
  LeaderboardEntry,
  UserGamificationProfile,
  getXPBalance,
} from '@/types/gamification';

interface GamificationDataState {
  profile: UserGamificationProfile | null;
  xp: XPBalance | null;
  streak: StreakData | null;
  achievements: UserAchievement[];
  leaderboard: LeaderboardEntry[];
  userRank: number | null;
  isLoading: boolean;
  error: string | null;
}

interface UseGamificationReturn extends GamificationDataState {
  refetch: () => Promise<void>;
  recordActivity: () => Promise<{ success: boolean; newAchievements?: UserAchievement[] }>;
  awardXP: (
    amount: number,
    reason?: string
  ) => Promise<{ success: boolean; xp?: number; newAchievements?: UserAchievement[] }>;
  completeLesson: (
    resourceId: string,
    title: string,
    xpAmount?: number
  ) => Promise<{ success: boolean; xp?: number; newAchievements?: UserAchievement[] }>;
  completeCourse: (
    resourceId: string,
    title: string,
    xpAmount?: number
  ) => Promise<{ success: boolean; xp?: number; newAchievements?: UserAchievement[] }>;
  completeChallenge: (
    resourceId: string,
    title: string,
    xpAmount?: number
  ) => Promise<{ success: boolean; xp?: number; newAchievements?: UserAchievement[] }>;
  syncXP: () => Promise<{ success: boolean; synced?: boolean; onChainXP?: number }>;
}

/**
 * Hook for fetching and managing gamification data
 */
export function useGamification(): UseGamificationReturn {
  const [state, setState] = useState<GamificationDataState>({
    profile: null,
    xp: null,
    streak: null,
    achievements: [],
    leaderboard: [],
    userRank: null,
    isLoading: true,
    error: null,
  });

  const fetchProfile = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/gamification');

      if (!response.ok) {
        throw new Error('Failed to fetch gamification profile');
      }

      const data = await response.json();

      const normalizedXP =
        data.xp ||
        (data.profile
          ? getXPBalance(data.profile.totalXP ?? data.profile.totalXp ?? 0)
          : null);

      const normalizedStreak =
        data.streak ||
        data.profile?.streak ||
        null;

      const normalizedAchievements =
        data.achievements?.unlocked ||
        data.profile?.achievements ||
        [];

      setState((prev) => ({
        ...prev,
        profile: data.profile || null,
        xp: normalizedXP,
        streak: normalizedStreak,
        achievements: normalizedAchievements,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/gamification/leaderboard?limit=10');

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        leaderboard: data.leaderboard || [],
        userRank: data.userRank || null,
      }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  }, []);

  const refetch = useCallback(async () => {
    await Promise.all([fetchProfile(), fetchLeaderboard()]);
  }, [fetchProfile, fetchLeaderboard]);

  // Record daily activity
  const recordActivity = useCallback(async () => {
    try {
      const response = await fetch('/api/gamification/activity', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to record activity');
      }

      const data = await response.json();

      // Update local state with new streak data
      if (data.streak) {
        setState((prev) => ({
          ...prev,
          streak: data.streak,
        }));
      }

      return {
        success: true,
        newAchievements: data.newAchievements,
      };
    } catch (error) {
      console.error('Error recording activity:', error);
      return { success: false };
    }
  }, []);

  // Award XP directly (used for inline challenge completion)
  const awardXP = useCallback(async (amount: number, reason?: string) => {
    try {
      const response = await fetch('/api/gamification/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason: reason || 'activity' }),
      });

      if (!response.ok) {
        throw new Error('Failed to award XP');
      }

      const data = await response.json();

      // Update local state with new XP
      if (data.xp) {
        setState((prev) => ({
          ...prev,
          xp: getXPBalance(data.xp.totalXP),
          profile: prev.profile ? { ...prev.profile, totalXP: data.xp.totalXP } : prev.profile,
        }));
      }

      return {
        success: true,
        xp: data.xp?.totalXP,
        newAchievements: data.newAchievements,
      };
    } catch (error) {
      console.error('Error awarding XP:', error);
      return { success: false };
    }
  }, []);

  // Complete a lesson
  const completeLesson = useCallback(
    async (resourceId: string, title: string, xpAmount?: number) => {
      try {
        const response = await fetch('/api/gamification/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'lesson', resourceId, title, xpAmount }),
        });

        if (!response.ok) {
          throw new Error('Failed to complete lesson');
        }

        const data = await response.json();

        // Refetch profile to get updated XP
        await fetchProfile();

        return {
          success: true,
          xp: data.xp?.totalXP,
          newAchievements: data.newAchievements,
        };
      } catch (error) {
        console.error('Error completing lesson:', error);
        return { success: false };
      }
    },
    [fetchProfile]
  );

  // Complete a course
  const completeCourse = useCallback(
    async (resourceId: string, title: string, xpAmount?: number) => {
      try {
        const response = await fetch('/api/gamification/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'course', resourceId, title, xpAmount }),
        });

        if (!response.ok) {
          throw new Error('Failed to complete course');
        }

        const data = await response.json();

        // Refetch profile to get updated XP
        await fetchProfile();

        return {
          success: true,
          xp: data.xp?.totalXP,
          newAchievements: data.newAchievements,
        };
      } catch (error) {
        console.error('Error completing course:', error);
        return { success: false };
      }
    },
    [fetchProfile]
  );

  // Complete a challenge
  const completeChallenge = useCallback(
    async (resourceId: string, title: string, xpAmount?: number) => {
      try {
        const response = await fetch('/api/gamification/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'challenge',
            resourceId,
            title,
            xpAmount,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to complete challenge');
        }

        const data = await response.json();

        // Refetch profile to get updated XP
        await fetchProfile();

        return {
          success: true,
          xp: data.xp?.totalXP,
          newAchievements: data.newAchievements,
        };
      } catch (error) {
        console.error('Error completing challenge:', error);
        return { success: false };
      }
    },
    [fetchProfile]
  );

  // Sync on-chain XP
  const syncXP = useCallback(async () => {
    try {
      const response = await fetch('/api/gamification/sync', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sync XP');
      }

      const data = await response.json();

      // Refetch profile to get updated XP
      await fetchProfile();

      return {
        success: true,
        synced: data.inSync,
        onChainXP: data.onChain?.balance,
      };
    } catch (error) {
      console.error('Error syncing XP:', error);
      return { success: false };
    }
  }, [fetchProfile]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    ...state,
    refetch,
    recordActivity,
    awardXP,
    completeLesson,
    completeCourse,
    completeChallenge,
    syncXP,
  };
}
