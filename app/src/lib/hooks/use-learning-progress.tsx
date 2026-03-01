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
  onChainLessonSig: string | null;
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
  walletAddress: string | null;
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
    onChainLessonSig: null,
  });

  const loadAll = useCallback(async () => {
    const uid = activeUserId;
    const [xpRes, streakRes, achievementsRes, allProgressRes] = await Promise.allSettled([
      progressService.getXP(uid),
      progressService.getStreak(uid),
      progressService.getAchievements(uid),
      progressService.getAllProgress(uid),
    ]);

    const progressMap: Record<string, Progress> = {};
    const enrolledCourseIds: string[] = [];
    const allProgress = allProgressRes.status === "fulfilled" ? allProgressRes.value : [];
    for (const p of allProgress) {
      progressMap[p.courseId] = p;
      enrolledCourseIds.push(p.courseId);
    }

    setState((prev) => ({
      ...prev,
      userId: uid,
      xp: xpRes.status === "fulfilled" ? xpRes.value : prev.xp,
      streak: streakRes.status === "fulfilled" ? streakRes.value : prev.streak,
      achievements: achievementsRes.status === "fulfilled" ? achievementsRes.value : prev.achievements,
      enrolledCourseIds,
      progressMap,
      isLoaded: true,
      isOnChain: !!walletUserId,
      onChainLessonSig: null,
    }));
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
      const uid = activeUserId;
      const [xpRes, streakRes, achievementsRes, allProgressRes] = await Promise.allSettled([
        progressService.getXP(uid),
        progressService.getStreak(uid),
        progressService.getAchievements(uid),
        progressService.getAllProgress(uid),
      ]);
      if (cancelled) return;

      const pMap: Record<string, Progress> = {};
      const eIds: string[] = [];
      const allProgressVal = allProgressRes.status === "fulfilled" ? allProgressRes.value : [];
      for (const p of allProgressVal) {
        pMap[p.courseId] = p;
        eIds.push(p.courseId);
      }

      setState((prev) => ({
        ...prev,
        userId: uid,
        xp: xpRes.status === "fulfilled" ? xpRes.value : prev.xp,
        streak: streakRes.status === "fulfilled" ? streakRes.value : prev.streak,
        achievements: achievementsRes.status === "fulfilled" ? achievementsRes.value : prev.achievements,
        enrolledCourseIds: eIds,
        progressMap: pMap,
        isLoaded: true,
        isOnChain: !!walletUserId,
        onChainLessonSig: null,
      }));
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

      // Fire on-chain complete_lesson (non-blocking — failure does not affect UI)
      if (walletUserId) {
        fetch("/api/onchain/complete-lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId, lessonIndex, learnerWallet: walletUserId }),
        })
          .then((res) => {
            if (!res.ok) throw new Error(`${res.status}`);
            return res.json();
          })
          .then((data: { success?: boolean; signature?: string }) => {
            if (data.signature) {
              setState((prev) => ({ ...prev, onChainLessonSig: data.signature ?? null }));
            }
          })
          .catch((err) => console.warn("[onchain/complete-lesson]", err));
      }

      // Check if course was just completed
      const updatedProgress = await progressService.getProgress(state.userId, courseId);
      if (updatedProgress?.percentage === 100 && !state.progressMap[courseId]?.completedAt) {
        recordActivity(state.userId, "course_completed", {
          course: meta?.courseTitle ?? courseId,
          courseSlug: courseId,
        });

        // Fire on-chain finalize_course + issue_credential cascade (non-blocking)
        if (walletUserId) {
          fetch("/api/onchain/finalize-course", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId, learnerWallet: walletUserId }),
          })
            .then((res) => {
              if (!res.ok) throw new Error(`finalize-course ${res.status}`);
              return res.json();
            })
            .then((data: { success?: boolean }) => {
              if (!data.success) throw new Error("finalize-course returned failure");
              return fetch("/api/onchain/issue-credential", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  courseId,
                  learnerWallet: walletUserId,
                  name: meta?.courseTitle ?? courseId,
                }),
              });
            })
            .then((res) => {
              if (res && !res.ok) throw new Error(`issue-credential ${res.status}`);
            })
            .catch((err) => console.warn("[onchain/finalize+issue-credential]", err));
        }
      }

      await loadAll();
    },
    [state.userId, state.progressMap, walletUserId, loadAll],
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
      walletAddress: walletUserId,
    }),
    [state, enrollInCourse, completeLesson, getLeaderboard, claimAchievement, loadAll, walletUserId],
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
