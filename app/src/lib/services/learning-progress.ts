import { createClient } from "@/lib/supabase/client";
import type {
  LearningProgressService,
  Progress,
  UserXPSummary,
  StreakData,
  LeaderboardEntry,
  Credential,
  Enrollment,
  Achievement,
} from "@/lib/types/learning";
import {
  xpToLevel,
  xpToNextLevel,
  ACHIEVEMENTS,
  XP_REWARDS,
} from "@/lib/types/learning";
import type { PublicKey } from "@solana/web3.js";
import {
  closeEnrollmentViaOnChainBridge,
  completeCourseViaOnChainBridge,
  completeLessonViaOnChainBridge,
  enrollViaOnChainBridge,
  isOnChainBridgeStrict,
  shouldUseOnChainBridge,
} from "@/lib/onchain/client-bridge";
import { getOnChainReadService } from "@/lib/services/onchain-read";

export class SupabaseLearningProgressService
  implements LearningProgressService
{
  private supabase = createClient();
  // Keep bitmap index inside JS number-safe range while lessonProgress is typed as number.
  private static readonly MAX_LESSON_BITMAP_INDEX = 52;

  // ------------------------------------------------------------------
  // Progress
  // ------------------------------------------------------------------

  async getProgress(
    userId: string,
    courseId: string
  ): Promise<Progress | null> {
    const { data, error } = await this.supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (error) {
      if (error.code !== "PGRST116") {
        console.error("[getProgress] Error:", error.message);
      }
      return null;
    }
    if (!data) return null;

    const bitmap = BigInt(data.lesson_progress);
    const completedLessons = this.countBits(bitmap);
    const totalLessons = data.total_lessons || 10;
    const completionPercent = Math.round(
      (completedLessons / totalLessons) * 100
    );

    return {
      courseId: data.course_id,
      userId: data.user_id,
      lessonProgress: Number(data.lesson_progress),
      completedLessons,
      totalLessons,
      completionPercent: Math.min(completionPercent, 100),
      startedAt: data.started_at,
      completedAt: data.completed_at,
    };
  }

  // ------------------------------------------------------------------
  // Complete Lesson
  // ------------------------------------------------------------------

  async completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
    xpAmount: number,
    context?: { onChainCourseId?: string }
  ): Promise<void> {
    if (!Number.isInteger(lessonIndex) || lessonIndex < 0) {
      throw new Error("lessonIndex must be a non-negative integer");
    }
    if (lessonIndex > SupabaseLearningProgressService.MAX_LESSON_BITMAP_INDEX) {
      throw new Error(
        `lessonIndex exceeds bitmap capacity (${SupabaseLearningProgressService.MAX_LESSON_BITMAP_INDEX}).`
      );
    }
    if (!Number.isFinite(xpAmount) || xpAmount < 0) {
      throw new Error("xpAmount must be a non-negative number");
    }

    let bridgeWriteAccepted = false;

    if (shouldUseOnChainBridge()) {
      const bridgeCourseId = this.resolveBridgeCourseId(
        context?.onChainCourseId,
        courseId
      );
      if (bridgeCourseId) {
        const bridge = await completeLessonViaOnChainBridge({
          courseId: bridgeCourseId,
          lessonIndex,
          xpAmount,
        });

        if (bridge.ok) {
          bridgeWriteAccepted = true;
          console.info(
            "[onchain-bridge][complete_lesson] accepted; syncing local projection."
          );
        } else {
          const message = `[onchain-bridge][complete_lesson] ${bridge.code}: ${bridge.message}`;
          if (isOnChainBridgeStrict()) {
            throw new Error(message);
          }
          console.warn(`${message}. Falling back to Supabase write path.`);
        }
      } else {
        console.warn(
          `[onchain-bridge][complete_lesson] No valid on-chain courseId (<=32 bytes). Falling back to Supabase write path.`
        );
      }
    }

    // 1. Update lesson bitmap
    const { data: enrollment, error: fetchError } = await this.supabase
      .from("enrollments")
      .select("lesson_progress, total_lessons, completed_at")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (fetchError) {
      console.error("[completeLesson] Error fetching enrollment:", fetchError.message);
      throw new Error(`Failed to fetch enrollment: ${fetchError.message}`);
    }
    if (!enrollment) {
      throw new Error("Not enrolled in this course");
    }

    const currentBitmap = BigInt(enrollment.lesson_progress);
    const lessonBit = 1n << BigInt(lessonIndex);
    const alreadyCompleted = (currentBitmap & lessonBit) !== 0n;
    if (alreadyCompleted) {
      return;
    }

    const newBitmap = currentBitmap | lessonBit;
    const totalLessons = Math.max(1, Number(enrollment.total_lessons) || 10);
    const completedLessons = this.countBits(newBitmap);
    const completedCourseForFirstTime =
      !enrollment.completed_at && completedLessons >= totalLessons;
    const completedAt = completedCourseForFirstTime
      ? new Date().toISOString()
      : enrollment.completed_at;

    const { error: enrollmentUpdateError } = await this.supabase
      .from("enrollments")
      .update({
        lesson_progress: newBitmap.toString(),
        completed_at: completedAt,
      })
      .eq("user_id", userId)
      .eq("course_id", courseId);
    if (enrollmentUpdateError) {
      throw new Error(`Failed to update enrollment: ${enrollmentUpdateError.message}`);
    }

    // 2. Record XP event
    const { error: lessonXpEventError } = await this.supabase.from("xp_events").insert({
      user_id: userId,
      amount: xpAmount,
      reason: "complete_lesson",
      course_id: courseId,
      lesson_index: lessonIndex,
    });
    if (lessonXpEventError) {
      throw new Error(`Failed to record lesson XP event: ${lessonXpEventError.message}`);
    }

    let completionBonus = 0;
    if (completedCourseForFirstTime) {
      completionBonus = XP_REWARDS.COMPLETE_COURSE;

      if (shouldUseOnChainBridge()) {
        const bridgeCourseId = this.resolveBridgeCourseId(
          context?.onChainCourseId,
          courseId
        );
        if (bridgeCourseId && bridgeWriteAccepted) {
          const bridge = await completeCourseViaOnChainBridge({
            courseId: bridgeCourseId,
          });
          if (!bridge.ok) {
            const message = `[onchain-bridge][complete_course] ${bridge.code}: ${bridge.message}`;
            if (isOnChainBridgeStrict()) {
              throw new Error(message);
            }
            console.warn(`${message}. Continuing with Supabase completion path.`);
          }
        }
      }

      const { error: completionBonusError } = await this.supabase
        .from("xp_events")
        .insert({
          user_id: userId,
          amount: completionBonus,
          reason: "complete_course",
          course_id: courseId,
          lesson_index: null,
        });
      if (completionBonusError) {
        throw new Error(
          `Failed to record course completion XP event: ${completionBonusError.message}`
        );
      }
    }

    // 3. Update XP summary + streak (side effect per spec)
    const today = new Date().toISOString().split("T")[0];
    const { data: xpData, error: xpFetchError } = await this.supabase
      .from("user_xp")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (xpFetchError && xpFetchError.code !== "PGRST116") {
      throw new Error(`Failed to fetch user XP summary: ${xpFetchError.message}`);
    }

    if (xpData) {
      const newTotalXp = xpData.total_xp + xpAmount + completionBonus;

      let newStreak = xpData.current_streak;
      let newLongestStreak = xpData.longest_streak;

      if (xpData.last_active_date !== today) {
        const lastDate = xpData.last_active_date
          ? new Date(xpData.last_active_date)
          : null;
        const todayDate = new Date(today);

        if (
          lastDate &&
          todayDate.getTime() - lastDate.getTime() <= 86400000 * 1.5
        ) {
          // Consecutive day
          newStreak = xpData.current_streak + 1;
        } else {
          // Streak broken
          newStreak = 1;
        }

        newLongestStreak = Math.max(newLongestStreak, newStreak);
      }

      const { error: userXpUpdateError } = await this.supabase
        .from("user_xp")
        .update({
          total_xp: newTotalXp,
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          last_active_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (userXpUpdateError) {
        throw new Error(`Failed to update user XP summary: ${userXpUpdateError.message}`);
      }
      return;
    }

    const initialStreak = 1;
    const { error: xpInitError } = await this.supabase.from("user_xp").upsert({
      user_id: userId,
      total_xp: xpAmount + completionBonus,
      current_streak: initialStreak,
      longest_streak: initialStreak,
      last_active_date: today,
      achievements: 0,
      updated_at: new Date().toISOString(),
    });
    if (xpInitError) {
      throw new Error(`Failed to initialize user XP summary: ${xpInitError.message}`);
    }
  }

  // ------------------------------------------------------------------
  // XP
  // ------------------------------------------------------------------

  async getXP(userId: string): Promise<UserXPSummary> {
    const { data } = await this.supabase
      .from("user_xp")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!data) {
      return {
        totalXp: 0,
        level: 0,
        xpToNextLevel: 100,
        currentStreak: 0,
        longestStreak: 0,
        achievements: 0,
      };
    }

    return {
      totalXp: data.total_xp,
      level: xpToLevel(data.total_xp),
      xpToNextLevel: xpToNextLevel(data.total_xp),
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      achievements: data.achievements,
    };
  }

  // ------------------------------------------------------------------
  // Streaks
  // ------------------------------------------------------------------

  async getStreak(userId: string): Promise<StreakData> {
    const { data } = await this.supabase
      .from("user_xp")
      .select("current_streak, longest_streak, last_active_date")
      .eq("user_id", userId)
      .single();

    // Build last 30 days of streak history from XP events
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: events } = await this.supabase
      .from("xp_events")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString());

    const activeDates = new Set(
      (events || []).map((e) => e.created_at.split("T")[0])
    );

    const streakHistory: { date: string; active: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      streakHistory.push({ date: dateStr, active: activeDates.has(dateStr) });
    }

    return {
      currentStreak: data?.current_streak || 0,
      longestStreak: data?.longest_streak || 0,
      lastActiveDate: data?.last_active_date || null,
      streakHistory,
    };
  }

  // ------------------------------------------------------------------
  // Leaderboard
  // ------------------------------------------------------------------

  async getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime"
  ): Promise<LeaderboardEntry[]> {
    if (timeframe === "alltime") {
      const { data } = await this.supabase
        .from("user_xp")
        .select(
          "user_id, total_xp, current_streak, profiles!inner(display_name, avatar_url)"
        )
        .order("total_xp", { ascending: false })
        .limit(50);

      return (data || []).map((row: Record<string, unknown>, index: number) => {
        const profiles = row.profiles as Record<string, unknown> | Array<Record<string, unknown>> | null;
        const profile = Array.isArray(profiles)
          ? profiles[0]
          : profiles;
        return {
          userId: row.user_id as string,
          displayName: (profile?.display_name as string) || "Anonymous",
          avatarUrl: (profile?.avatar_url as string) || null,
          totalXp: row.total_xp as number,
          level: xpToLevel(row.total_xp as number),
          currentStreak: row.current_streak as number,
          rank: index + 1,
        };
      });
    }

    // For weekly/monthly: aggregate from xp_events
    const daysAgo = timeframe === "weekly" ? 7 : 30;
    const since = new Date();
    since.setDate(since.getDate() - daysAgo);

    const { data } = await this.supabase
      .from("xp_events")
      .select("user_id, amount")
      .gte("created_at", since.toISOString());

    // Aggregate by user
    const totals: Record<string, number> = {};
    for (const row of data || []) {
      totals[row.user_id] = (totals[row.user_id] || 0) + row.amount;
    }

    const userIds = Object.keys(totals);
    if (userIds.length === 0) return [];

    const { data: profiles } = await this.supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50)
      .map(([userId, xp], index) => {
        const profile = profileMap.get(userId);
        return {
          userId,
          displayName: profile?.display_name || "Anonymous",
          avatarUrl: profile?.avatar_url || null,
          totalXp: xp,
          level: xpToLevel(xp),
          currentStreak: 0,
          rank: index + 1,
        };
      });
  }

  // ------------------------------------------------------------------
  // Credentials (read from Devnet via OnChainReadService)
  // ------------------------------------------------------------------

  async getCredentials(wallet: PublicKey): Promise<Credential[]> {
    const onChain = getOnChainReadService();
    return onChain.getCredentials(wallet);
  }

  // ------------------------------------------------------------------
  // Enrollments
  // ------------------------------------------------------------------

  async getEnrollments(userId: string): Promise<Enrollment[]> {
    const { data } = await this.supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    return (data || []).map((row: Record<string, unknown>) => {
        const bitmap = BigInt(row.lesson_progress as string);
        const completedLessons = this.countBits(bitmap);
        const totalLessons = (row.total_lessons as number) || 10;
        return {
          id: row.id as string,
          courseId: row.course_id as string,
          courseTitle: (row.course_title as string) || "",
          courseSlug: (row.course_slug as string) || "",
          lessonProgress: Number(row.lesson_progress),
          completedLessons,
          totalLessons,
          completionPercent: Math.min(
            Math.round((completedLessons / totalLessons) * 100),
            100
          ),
          startedAt: row.started_at as string,
          completedAt: row.completed_at as string | null,
        };
      }
    );
  }

  async enroll(
    userId: string,
    courseId: string,
    meta: {
      courseTitle: string;
      courseSlug: string;
      totalLessons: number;
      onChainCourseId?: string;
      skipOnChainBridge?: boolean;
    }
  ): Promise<void> {
    if (shouldUseOnChainBridge() && !meta.skipOnChainBridge) {
      const bridgeCourseId = this.resolveBridgeCourseId(
        meta.onChainCourseId,
        meta.courseSlug,
        courseId
      );
      if (bridgeCourseId) {
        const bridge = await enrollViaOnChainBridge({
          courseId: bridgeCourseId,
        });

        if (bridge.ok) {
          console.info(
            "[onchain-bridge][enroll] accepted; syncing local projection."
          );
        } else {
          const message = `[onchain-bridge][enroll] ${bridge.code}: ${bridge.message}`;
          if (isOnChainBridgeStrict()) {
            throw new Error(message);
          }
          console.warn(`${message}. Falling back to Supabase write path.`);
        }
      } else {
        console.warn(
          `[onchain-bridge][enroll] No valid on-chain courseId (<=32 bytes). Falling back to Supabase write path.`
        );
      }
    }

    const { error } = await this.supabase.from("enrollments").upsert(
      {
        user_id: userId,
        course_id: courseId,
        lesson_progress: 0,
        course_title: meta.courseTitle,
        course_slug: meta.courseSlug,
        total_lessons: meta.totalLessons,
      },
      { onConflict: "user_id,course_id" }
    );

    if (error) {
      console.error("[enroll] Error:", error.message);
      throw new Error(`Failed to enroll: ${error.message}`);
    }
  }

  async closeEnrollment(
    userId: string,
    courseId: string,
    context?: {
      onChainCourseId?: string;
      skipOnChainBridge?: boolean;
    }
  ): Promise<void> {
    if (shouldUseOnChainBridge() && !context?.skipOnChainBridge) {
      const bridgeCourseId = this.resolveBridgeCourseId(
        context?.onChainCourseId,
        courseId
      );
      if (bridgeCourseId) {
        const bridge = await closeEnrollmentViaOnChainBridge({
          courseId: bridgeCourseId,
        });
        if (!bridge.ok) {
          const message = `[onchain-bridge][close_enrollment] ${bridge.code}: ${bridge.message}`;
          if (isOnChainBridgeStrict()) {
            throw new Error(message);
          }
          console.warn(`${message}. Falling back to Supabase delete path.`);
        } else {
          console.info(
            "[onchain-bridge][close_enrollment] accepted; syncing local projection."
          );
        }
      } else if (isOnChainBridgeStrict()) {
        throw new Error(
          "[onchain-bridge][close_enrollment] No valid on-chain courseId (<=32 bytes)."
        );
      } else {
        console.warn(
          "[onchain-bridge][close_enrollment] No valid on-chain courseId (<=32 bytes). Falling back to Supabase delete path."
        );
      }
    }

    const { error } = await this.supabase
      .from("enrollments")
      .delete()
      .eq("user_id", userId)
      .eq("course_id", courseId);
    if (error) {
      throw new Error(`Failed to close enrollment: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------
  // Achievements
  // ------------------------------------------------------------------

  async getAchievements(userId: string): Promise<Achievement[]> {
    const { data } = await this.supabase
      .from("user_xp")
      .select("achievements")
      .eq("user_id", userId)
      .single();

    const bitmap = BigInt(data?.achievements || 0);

    return ACHIEVEMENTS.map((achievement) => ({
      ...achievement,
      unlockedAt:
        (bitmap & (1n << BigInt(achievement.id))) !== 0n
          ? new Date().toISOString()
          : null,
    }));
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private countBits(n: bigint): number {
    let count = 0;
    let val = n;
    while (val > 0n) {
      count += Number(val & 1n);
      val >>= 1n;
    }
    return count;
  }

  private resolveBridgeCourseId(...candidates: Array<string | undefined>): string | null {
    const encoder = new TextEncoder();
    for (const candidate of candidates) {
      if (!candidate) continue;
      const normalized = candidate.trim();
      if (!normalized) continue;
      if (encoder.encode(normalized).length > 32) continue;
      return normalized;
    }
    return null;
  }
}

// Singleton
let _service: SupabaseLearningProgressService | null = null;

export function getLearningProgressService(): LearningProgressService {
  if (!_service) {
    _service = new SupabaseLearningProgressService();
  }
  return _service;
}
