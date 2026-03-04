"use client";

import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useXpBalance } from "@/hooks/useXpBalance";
import { useAllEnrollments } from "@/hooks/useEnrollment";
import { useCredentials } from "@/hooks/useCredentials";
import { useSigningMode } from "@/hooks/useSigningMode";
import { useStubXp } from "@/hooks/useStubXp";
import { countCompletedLessons, normalizeFlags } from "@/lib/bitmap";
import { ACHIEVEMENTS, type Achievement } from "@/data/achievements";
import { getCurrentStreak } from "@/lib/streak";

export interface AchievementState {
  achievement: Achievement;
  earned: boolean;
}

interface RuntimeStats {
  totalXp: number;
  totalLessons: number;
  totalCourses: number;
  streakDays: number;
  credentialCount: number;
}

function checkCondition(
  achievement: Achievement,
  stats: RuntimeStats,
): boolean {
  const { condition } = achievement;
  switch (condition.type) {
    case "xp":
      return stats.totalXp >= condition.threshold;
    case "lessons":
      return stats.totalLessons >= condition.threshold;
    case "courses":
      return stats.totalCourses >= condition.threshold;
    case "streak":
      return stats.streakDays >= condition.days;
    case "credential":
      return stats.credentialCount >= condition.count;
    case "manual":
      // Early adopter: always award if wallet connected
      return achievement.id === "early-adopter";
    default:
      return false;
  }
}

/**
 * Returns all achievements with their earned status for the current wallet.
 * Uses real on-chain data if available, else falls back to stub storage.
 */
export function useAchievements(): AchievementState[] {
  const { publicKey } = useWallet();
  const { data: xp } = useXpBalance();
  const { data: enrollments } = useAllEnrollments();
  const { data: credentials } = useCredentials();
  const signingMode = useSigningMode();
  const localXp = useStubXp();

  return useMemo(() => {
    if (!publicKey) {
      return ACHIEVEMENTS.map((a) => ({ achievement: a, earned: false }));
    }

    const isStub = signingMode === "stub";
    const totalXp = isStub ? localXp : (xp?.amount ?? 0);

    const totalLessons = (enrollments ?? []).reduce((sum, e) => {
      const flags = normalizeFlags(e.lessonFlags);
      return sum + countCompletedLessons(flags);
    }, 0);

    const totalCourses = (enrollments ?? []).filter(
      (e) => !!e.completedAt,
    ).length;

    const streakDays = getCurrentStreak();
    const credentialCount = credentials?.length ?? 0;

    const stats: RuntimeStats = {
      totalXp,
      totalLessons,
      totalCourses,
      streakDays,
      credentialCount,
    };

    return ACHIEVEMENTS.map((a) => ({
      achievement: a,
      earned: checkCondition(a, stats),
    }));
  }, [publicKey, xp, enrollments, credentials, signingMode, localXp]);
}

/** Returns only earned achievements */
export function useEarnedAchievements(): Achievement[] {
  const states = useAchievements();
  return useMemo(
    () => states.filter((s) => s.earned).map((s) => s.achievement),
    [states],
  );
}
