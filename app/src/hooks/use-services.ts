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
import { supabaseCommentService } from "@/services";
import {
  useOnChainXP,
  useOnChainEnrollment,
  useEnrollOnChain,
  useOnChainCredentials,
} from "@/hooks/use-onchain";
import type {
  Course,
  CourseProgress,
  CourseReview,
  ReviewSummary,
  XPBalance,
  StreakData,
  ActivityItem,
  LeaderboardEntry,
  LeaderboardTimeframe,
  Achievement,
  Credential,
  Comment,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const { user, profile } = useAuth();
  const { publicKey: walletKey } = useWallet();
  // Read on-chain enrollment using the linked wallet, not the connected one
  const { enrolled: onChainEnrolled, loading: onChainLoading } =
    useOnChainEnrollment(courseId, profile?.walletAddress);
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

  const enrolled = onChainEnrolled || supabaseEnrolled;
  const [localEnrolling, setLocalEnrolling] = useState(false);

  const enroll = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to enroll");
      return;
    }

    setLocalEnrolling(true);
    let _onChainSuccess = false;

    try {
      // 1. Try on-chain enrollment if wallet connected
      if (walletKey) {
        try {
          await enrollOnChain(courseId);
          _onChainSuccess = true;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          // User rejected = not an error, just cancelled
          if (msg.includes("User rejected")) {
            toast.info("Transaction cancelled");
            return;
          }
          // Already enrolled on-chain is fine
          if (msg.includes("already in use")) {
            _onChainSuccess = true;
          } else {
            console.error("On-chain enrollment failed:", msg);
            toast.error("On-chain enrollment failed. Please try again.");
            return;
          }
        }
      }

      // 2. Record in Supabase only after on-chain succeeds (or no wallet)
      await supabaseEnrollmentService.enroll(user.id, courseId, totalLessons);
      setSupabaseEnrolled(true);

      if (!walletKey) {
        toast.success("Enrolled! Connect a wallet for on-chain enrollment.");
      }
      // If _onChainSuccess, enrollOnChain already showed a success toast
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
  const { user, profile } = useAuth();
  // Read on-chain XP using the linked wallet, not the connected one
  const linkedWallet = profile?.walletAddress ?? null;
  const {
    balance: onChainXP,
    loading: onChainLoading,
    refresh: refreshOnChain,
  } = useOnChainXP(linkedWallet);
  const [supabaseBalance, setSupabaseBalance] = useState<XPBalance>({
    amount: 0,
    level: 0,
    progress: 0,
    nextLevelXp: 100,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (linkedWallet) {
      await refreshOnChain();
    }
    if (user) {
      const xp = await supabaseXPService.getBalanceByUserId(user.id);
      setSupabaseBalance(xp);
    }
  }, [user, linkedWallet, refreshOnChain]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    refresh().finally(() => setLoading(false));
  }, [user, refresh]);

  // Auto-refresh when other components signal XP changed (e.g. achievement mint, course finalize)
  useEffect(() => {
    const handler = () => { refresh(); };
    window.addEventListener("xp-updated", handler);
    return () => window.removeEventListener("xp-updated", handler);
  }, [refresh]);

  // Auto-refresh when navigating back to the dashboard tab
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [refresh]);

  // Prefer on-chain XP from the linked wallet when available
  const useOnChain = !!linkedWallet && !onChainLoading && onChainXP > 0;
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
  // Read on-chain credentials using the linked wallet, not the connected one
  const linkedWallet = profile?.walletAddress ?? null;
  const {
    credentials: onChainCredentials,
    loading: onChainLoading,
  } = useOnChainCredentials(linkedWallet);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(false);
  }, [user]);

  const credentials: Credential[] = onChainCredentials.map((c) => ({
    mintAddress: c.id,
    name: c.name,
    metadataUri: c.uri,
    imageUrl: c.image,
    trackId: parseInt(c.attributes["track_id"] ?? "0"),
    trackLevel: parseInt(c.attributes["level"] ?? "0"),
    coursesCompleted: parseInt(c.attributes["courses_completed"] ?? "0"),
    totalXp: parseInt(c.attributes["total_xp"] ?? "0"),
    owner: linkedWallet ?? "",
    collection: process.env.NEXT_PUBLIC_CREDENTIAL_COLLECTION ?? "",
  }));

  return { credentials, loading: loading || onChainLoading };
}

// ─── Reviews ────────────────────────────────────────────

export function useReviews(courseId: string) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({ count: 0, avgRating: 0 });
  const [userReview, setUserReview] = useState<CourseReview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(() => {
    if (!courseId) return;
    setLoading(true);
    fetch(`/api/reviews?courseId=${encodeURIComponent(courseId)}`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(data.reviews ?? []);
        setSummary(data.summary ?? { count: 0, avgRating: 0 });
        if (user) {
          const mine = (data.reviews ?? []).find(
            (r: CourseReview) => r.userId === user.id,
          );
          setUserReview(mine ?? null);
        }
      })
      .catch(() => {
        setReviews([]);
        setSummary({ count: 0, avgRating: 0 });
      })
      .finally(() => setLoading(false));
  }, [courseId, user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = useCallback(
    async (rating: number, content: string) => {
      if (!user) return;
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, rating, content }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to submit review");
      }

      fetchReviews();
    },
    [user, courseId, fetchReviews],
  );

  const deleteReview = useCallback(
    async (reviewId: string) => {
      const res = await fetch(`/api/reviews?id=${reviewId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete review");
      setUserReview(null);
      fetchReviews();
    },
    [fetchReviews],
  );

  return { reviews, summary, userReview, loading, submitReview, deleteReview };
}

// ─── Comments ───────────────────────────────────────────

export function useComments(courseId: string, lessonIndex: number) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabaseCommentService
      .getComments(courseId, lessonIndex)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [courseId, lessonIndex]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const postComment = useCallback(
    async (content: string, parentId?: string) => {
      if (!user) return;
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          lessonIndex,
          content,
          parentId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to post comment");
      }

      const data = await res.json();

      if (data.achievementAwarded === "first-comment") {
        toast.success("Achievement unlocked: First Comment!");
      }

      fetchComments();
    },
    [user, courseId, lessonIndex, fetchComments],
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete comment");
      fetchComments();
    },
    [fetchComments],
  );

  const markHelpful = useCallback(
    async (commentId: string) => {
      const res = await fetch("/api/comments/helpful", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to mark as helpful");
      }

      const data = await res.json();

      if (data.achievementAwarded === "helper") {
        toast.success("The comment author earned the Helper achievement!");
      }

      if (data.alreadyMarked) {
        toast.info("Already marked as helpful");
        return;
      }

      toast.success("Marked as helpful!");
      fetchComments();
    },
    [fetchComments],
  );

  return { comments, loading, postComment, deleteComment, markHelpful };
}
