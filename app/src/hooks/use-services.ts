"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { courseService } from "@/services";
import { supabaseEnrollmentService } from "@/services";
import { supabaseProgressService } from "@/services";
import { mockXPService } from "@/services";
import { supabaseStreakService } from "@/services";
import { supabaseActivityService } from "@/services";
import { mockLeaderboardService } from "@/services";
import { mockAchievementService } from "@/services";
import { mockCredentialService } from "@/services";
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

export function useEnrollment(courseId: string) {
  const { user } = useAuth();
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !courseId) {
      setLoading(false);
      return;
    }
    supabaseEnrollmentService
      .isEnrolled(user.id, courseId)
      .then(setEnrolled)
      .catch(() => setEnrolled(false))
      .finally(() => setLoading(false));
  }, [user, courseId]);

  const enroll = useCallback(async () => {
    if (!user) return;
    await supabaseEnrollmentService.enroll(user.id, courseId);
    setEnrolled(true);
  }, [user, courseId]);

  return { enrolled, loading, enroll };
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
  const [balance, setBalance] = useState<XPBalance>({
    amount: 0,
    level: 0,
    progress: 0,
    nextLevelXp: 100,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const xp = await mockXPService.getBalanceByUserId(user.id);
    setBalance(xp);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    refresh().finally(() => setLoading(false));
  }, [user, refresh]);

  return { balance, loading, refresh };
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

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    refresh().finally(() => setLoading(false));
  }, [user, refresh]);

  const recordActivity = useCallback(async () => {
    if (!user) return;
    const updated = await supabaseStreakService.recordActivity(user.id);
    setStreak(updated);
    return updated;
  }, [user]);

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
      mockLeaderboardService.getLeaderboard(timeframe, limit),
      mockLeaderboardService.getTotalParticipants(timeframe),
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
    mockAchievementService
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
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile?.walletAddress) {
      setLoading(false);
      return;
    }
    mockCredentialService
      .getCredentials(profile.walletAddress)
      .then(setCredentials)
      .catch(() => setCredentials([]))
      .finally(() => setLoading(false));
  }, [user, profile?.walletAddress]);

  return { credentials, loading };
}
