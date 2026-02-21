"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { courseService } from "@/services";
import { supabaseEnrollmentService } from "@/services";
import { supabaseProgressService } from "@/services";
import { supabaseXPService } from "@/services";
import { supabaseStreakService } from "@/services";
import { supabaseActivityService } from "@/services";
import { supabaseLeaderboardService } from "@/services";
import { supabaseAchievementService } from "@/services";
import {
  useOnChainXP,
  useOnChainEnrollment,
  useEnrollOnChain,
  useOnChainCredentials,
} from "@/hooks/use-onchain";
import type {
  Course,
  CourseProgress,
  XPBalance,
  StreakData,
  ActivityItem,
  LeaderboardEntry,
  LeaderboardTimeframe,
  Achievement,
  Credential,
  SearchParams,
} from "@/types";

// ─── Courses ────────────────────────────────────────────

export function useCourses(params?: SearchParams) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    courseService
      .getCourses(params)
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [params?.difficulty, params?.track, params?.search, params?.page]);

  return { courses, loading };
}

export function useCourse(slug: string) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    courseService
      .getCourseBySlug(slug)
      .then(setCourse)
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [slug]);

  return { course, loading };
}

export function useFeaturedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseService
      .getFeaturedCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  return { courses, loading };
}

// ─── Enrollment ─────────────────────────────────────────

export function useEnrollment(courseId: string, totalLessons?: number) {
  const { user } = useAuth();
  const { publicKey: walletKey } = useWallet();
  const { enrolled: onChainEnrolled, loading: onChainLoading } =
    useOnChainEnrollment(courseId);
  const { enrollOnChain, enrolling } = useEnrollOnChain();
  const [supabaseEnrolled, setSupabaseEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check Supabase enrollment
  useEffect(() => {
    if (!user || !courseId) {
      setLoading(false);
      return;
    }
    supabaseEnrollmentService
      .isEnrolled(user.id, courseId)
      .then(setSupabaseEnrolled)
      .catch(() => setSupabaseEnrolled(false))
      .finally(() => setLoading(false));
  }, [user, courseId]);

  // Enrolled if either on-chain or Supabase says so
  const enrolled = onChainEnrolled || supabaseEnrolled;
  const [localEnrolling, setLocalEnrolling] = useState(false);

  const enroll = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to enroll");
      return;
    }

    setLocalEnrolling(true);
    let onChainSuccess = false;

    try {
      // 1. Try on-chain enrollment if wallet connected
      if (walletKey) {
        try {
          await enrollOnChain(courseId);
          onChainSuccess = true;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          // User rejected = not an error, just cancelled
          if (msg.includes("User rejected")) {
            toast.info("Transaction cancelled");
            return;
          }
          // Already enrolled on-chain is fine
          if (msg.includes("already in use")) {
            onChainSuccess = true;
          } else {
            console.error("On-chain enrollment failed:", msg);
            toast.error("On-chain enrollment failed. Enrolling off-chain only.");
          }
        }
      }

      // 2. Always record in Supabase for progress tracking
      await supabaseEnrollmentService.enroll(user.id, courseId, totalLessons);
      setSupabaseEnrolled(true);

      // Only show generic success if enrollOnChain didn't already toast
      if (!walletKey) {
        toast.success("Enrolled! Connect a wallet for on-chain enrollment.");
      } else if (!onChainSuccess) {
        // On-chain failed but Supabase succeeded — error toast already shown above
      }
      // If onChainSuccess, enrollOnChain already showed a success toast
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Enrollment failed:", msg);
      toast.error("Enrollment failed: " + msg);
    } finally {
      setLocalEnrolling(false);
    }
  }, [user, walletKey, courseId, enrollOnChain, totalLessons]);

  return {
    enrolled,
    loading: loading || onChainLoading,
    enroll,
    enrolling: localEnrolling || enrolling,
  };
}

// ─── Progress ───────────────────────────────────────────

export function useProgress(courseId: string) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !courseId) return;
    const p = await supabaseProgressService.getProgress(user.id, courseId);
    setProgress(p);
  }, [user, courseId]);

  useEffect(() => {
    if (!user || !courseId) {
      setLoading(false);
      return;
    }
    refresh().finally(() => setLoading(false));
  }, [user, courseId, refresh]);

  const completeLesson = useCallback(
    async (lessonIndex: number, xp: number) => {
      if (!user) return;
      const updated = await supabaseProgressService.completeLesson(
        user.id,
        courseId,
        lessonIndex,
        xp,
      );
      setProgress(updated);
      return updated;
    },
    [user, courseId],
  );

  return { progress, loading, completeLesson, refresh };
}

export function useAllProgress() {
  const { user } = useAuth();
  const [progressList, setProgressList] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabaseProgressService
      .getAllProgress(user.id)
      .then(setProgressList)
      .catch(() => setProgressList([]))
      .finally(() => setLoading(false));
  }, [user]);

  return { progressList, loading };
}

// ─── XP ─────────────────────────────────────────────────

export function useXP() {
  const { user } = useAuth();
  const { publicKey: walletKey } = useWallet();
  const {
    balance: onChainXP,
    loading: onChainLoading,
    refresh: refreshOnChain,
  } = useOnChainXP();
  const [supabaseBalance, setSupabaseBalance] = useState<XPBalance>({
    amount: 0,
    level: 0,
    progress: 0,
    nextLevelXp: 100,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (walletKey) {
      await refreshOnChain();
    }
    if (user) {
      const xp = await supabaseXPService.getBalanceByUserId(user.id);
      setSupabaseBalance(xp);
    }
  }, [user, walletKey, refreshOnChain]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    refresh().finally(() => setLoading(false));
  }, [user, refresh]);

  // Prefer on-chain XP when wallet is connected and has a balance
  const useOnChain = walletKey && !onChainLoading && onChainXP > 0;
  const amount = useOnChain ? onChainXP : supabaseBalance.amount;
  const level = Math.floor(Math.sqrt(amount / 100));
  const currentLevelXp = level * level * 100;
  const nextLevelXp = (level + 1) * (level + 1) * 100;
  const progress =
    nextLevelXp > currentLevelXp
      ? (amount - currentLevelXp) / (nextLevelXp - currentLevelXp)
      : 0;

  const balance: XPBalance = { amount, level, progress, nextLevelXp };

  return { balance, loading: loading || onChainLoading, refresh };
}

// ─── Streak ─────────────────────────────────────────────

export function useStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    streakHistory: {},
    hasFreezeAvailable: false,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const s = await supabaseStreakService.getStreak(user.id);
    setStreak(s);
  }, [user]);

  const recordActivity = useCallback(async () => {
    if (!user) return;
    const updated = await supabaseStreakService.recordActivity(user.id);
    setStreak(updated);
    return updated;
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    // Record activity on load so visiting the app counts as an active day
    recordActivity().finally(() => setLoading(false));
  }, [user, recordActivity]);

  return { streak, loading, recordActivity, refresh };
}

// ─── Activity ───────────────────────────────────────────

export function useActivities(limit = 20) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const items = await supabaseActivityService.getActivities(user.id, limit);
    setActivities(items);
  }, [user, limit]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    refresh().finally(() => setLoading(false));
  }, [user, refresh]);

  const log = useCallback(
    async (activity: Omit<ActivityItem, "id">) => {
      if (!user) return;
      const created = await supabaseActivityService.logActivity(
        user.id,
        activity,
      );
      setActivities((prev) => [created, ...prev].slice(0, limit));
      return created;
    },
    [user, limit],
  );

  return { activities, loading, log, refresh };
}

// ─── Leaderboard ────────────────────────────────────────

export function useLeaderboard(
  timeframe: LeaderboardTimeframe = "all-time",
  limit = 50,
) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabaseLeaderboardService.getLeaderboard(timeframe, limit),
      supabaseLeaderboardService.getTotalParticipants(timeframe),
    ])
      .then(([e, t]) => {
        setEntries(e);
        setTotal(t);
      })
      .catch(() => {
        setEntries([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [timeframe, limit]);

  return { entries, total, loading };
}

// ─── Achievements ───────────────────────────────────────

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabaseAchievementService
      .getAchievements(user.id)
      .then(setAchievements)
      .catch(() => setAchievements([]))
      .finally(() => setLoading(false));
  }, [user]);

  return { achievements, loading };
}

// ─── Credentials ────────────────────────────────────────

export function useCredentials() {
  const { user, profile } = useAuth();
  const { publicKey: walletKey } = useWallet();
  const {
    credentials: onChainCredentials,
    loading: onChainLoading,
  } = useOnChainCredentials();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    // On-chain credentials load from Helius DAS automatically
    setLoading(false);
  }, [user]);

  // Map on-chain DAS credentials to our Credential type
  const credentials: Credential[] = onChainCredentials.map((c) => ({
    mintAddress: c.id,
    name: c.name,
    metadataUri: c.uri,
    imageUrl: c.image,
    trackId: parseInt(c.attributes["track"] ?? "0"),
    trackLevel: parseInt(c.attributes["level"] ?? "0"),
    coursesCompleted: parseInt(c.attributes["courses_completed"] ?? "0"),
    totalXp: parseInt(c.attributes["total_xp"] ?? "0"),
    owner: walletKey?.toBase58() ?? profile?.walletAddress ?? "",
    collection: process.env.NEXT_PUBLIC_CREDENTIAL_COLLECTION ?? "",
  }));

  return { credentials, loading: loading || onChainLoading };
}
