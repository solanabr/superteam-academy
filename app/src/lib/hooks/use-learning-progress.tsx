"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useWalletCompat as useWallet } from "@/lib/hooks/use-wallet-compat";
import { progressService } from "@/lib/services";
import type {
  Progress,
  StreakData,
  LeaderboardEntry,
  Achievement,
} from "@/types";
import { trackEvent } from "@/lib/analytics";
import { recordActivity } from "@/lib/services/activity-log";

// Default user ID — used when no wallet is connected
const DEFAULT_USER_ID = "local-learner";

interface LearningProgressState {
  userId: string;
  xp: number;
  streak: StreakData;
  achievements: Achievement[];
  enrolledCourseIds: string[];
  progressMap: Record<string, Progress>;
  isLoaded: boolean;
  isOnChain: boolean;
}

interface ActivityMeta {
  lessonTitle?: string;
  courseTitle?: string;
}

interface LearningProgressActions {
  enrollInCourse(courseId: string, totalLessons: number, meta?: ActivityMeta): Promise<void>;
  completeLesson(courseId: string, lessonIndex: number, xpReward: number, meta?: ActivityMeta): Promise<void>;
  getLeaderboard(timeframe: "weekly" | "monthly" | "alltime", courseId?: string): Promise<LeaderboardEntry[]>;
  claimAchievement(achievementId: number): Promise<void>;
  refreshAll(): Promise<void>;
}

type LearningProgressCtx = LearningProgressState & LearningProgressActions;

const Context = createContext<LearningProgressCtx | null>(null);

export function LearningProgressProvider({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet();
  const walletUserId = publicKey?.toBase58() ?? null;
  const activeUserId = walletUserId ?? DEFAULT_USER_ID;

  const [state, setState] = useState<LearningProgressState>({
    userId: DEFAULT_USER_ID,
    xp: 0,
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: "",
      streakFreezes: 0,
      activityCalendar: {},
    },
    achievements: [],
    enrolledCourseIds: [],
    progressMap: {},
    isLoaded: false,
    isOnChain: false,
  });

  const loadAll = useCallback(async () => {
    try {
      const uid = activeUserId;
      const [xp, streak, achievements, allProgress] = await Promise.all([
        progressService.getXP(uid),
        progressService.getStreak(uid),
        progressService.getAchievements(uid),
        progressService.getAllProgress(uid),
      ]);

      const progressMap: Record<string, Progress> = {};
      const enrolledCourseIds: string[] = [];
      for (const p of allProgress) {
        progressMap[p.courseId] = p;
        enrolledCourseIds.push(p.courseId);
      }

      setState({
        userId: uid,
        xp,
        streak,
        achievements,
        enrolledCourseIds,
        progressMap,
        isLoaded: true,
        isOnChain: !!walletUserId,
      });
    } catch {
      setState((prev) => ({ ...prev, isLoaded: true }));
    }
  }, [activeUserId, walletUserId]);

  useEffect(() => {
    if (walletUserId) {
      trackEvent({ name: "wallet_connected", params: { wallet_type: "solana" } });
    }
  }, [walletUserId]);

  // Load all progress data when user identity changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const uid = activeUserId;
        const [xpVal, streakVal, achievementsVal, allProgressVal] = await Promise.all([
          progressService.getXP(uid),
          progressService.getStreak(uid),
          progressService.getAchievements(uid),
          progressService.getAllProgress(uid),
        ]);
        if (cancelled) return;

        const pMap: Record<string, Progress> = {};
        const eIds: string[] = [];
        for (const p of allProgressVal) {
          pMap[p.courseId] = p;
          eIds.push(p.courseId);
        }

        setState({
          userId: uid,
          xp: xpVal,
          streak: streakVal,
          achievements: achievementsVal,
          enrolledCourseIds: eIds,
          progressMap: pMap,
          isLoaded: true,
          isOnChain: !!walletUserId,
        });
      } catch {
        if (!cancelled) {
          setState((prev) => ({ ...prev, isLoaded: true }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [activeUserId, walletUserId]);

  const enrollInCourse = useCallback(
    async (courseId: string, totalLessons: number, meta?: ActivityMeta) => {
      await progressService.enrollInCourse(state.userId, courseId);
      trackEvent({ name: "course_enrolled", params: { course_slug: courseId, course_title: courseId } });
      recordActivity(state.userId, "course_enrolled", {
        course: meta?.courseTitle ?? courseId,
        courseSlug: courseId,
      });
      await loadAll();
    },
    [state.userId, loadAll],
  );

  const completeLesson = useCallback(
    async (courseId: string, lessonIndex: number, xpReward: number, meta?: ActivityMeta) => {
      await progressService.completeLesson(state.userId, courseId, lessonIndex);
      await progressService.addXP(state.userId, xpReward);
      await progressService.recordActivity(state.userId);
      trackEvent({ name: "lesson_completed", params: { course_slug: courseId, lesson_id: String(lessonIndex), xp_earned: xpReward } });
      recordActivity(state.userId, "lesson_completed", {
        lesson: meta?.lessonTitle ?? `Lesson ${lessonIndex + 1}`,
        course: meta?.courseTitle ?? courseId,
        courseSlug: courseId,
      });
      // Check if course was just completed
      const updatedProgress = await progressService.getProgress(state.userId, courseId);
      if (updatedProgress?.percentage === 100 && !state.progressMap[courseId]?.completedAt) {
        recordActivity(state.userId, "course_completed", {
          course: meta?.courseTitle ?? courseId,
          courseSlug: courseId,
        });
      }
      await loadAll();
    },
    [state.userId, state.progressMap, loadAll],
  );

  const getLeaderboard = useCallback(
    async (timeframe: "weekly" | "monthly" | "alltime", courseId?: string) => {
      return progressService.getLeaderboard(timeframe, courseId);
    },
    [],
  );

  const claimAchievement = useCallback(
    async (achievementId: number) => {
      await progressService.claimAchievement(state.userId, achievementId);
      trackEvent({ name: "achievement_claimed", params: { achievement_id: achievementId, achievement_name: `achievement_${achievementId}` } });
      const achievementName = state.achievements.find((a) => a.id === achievementId)?.name ?? `Achievement #${achievementId}`;
      recordActivity(state.userId, "achievement_earned", { achievement: achievementName });
      await loadAll();
    },
    [state.userId, state.achievements, loadAll],
  );

  const ctx = useMemo<LearningProgressCtx>(
    () => ({
      ...state,
      enrollInCourse,
      completeLesson,
      getLeaderboard,
      claimAchievement,
      refreshAll: loadAll,
    }),
    [state, enrollInCourse, completeLesson, getLeaderboard, claimAchievement, loadAll],
  );

  return <Context.Provider value={ctx}>{children}</Context.Provider>;
}

export function useLearningProgress(): LearningProgressCtx {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useLearningProgress must be used within LearningProgressProvider");
  }
  return ctx;
}
