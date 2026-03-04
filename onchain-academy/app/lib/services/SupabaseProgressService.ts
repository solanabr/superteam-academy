/**
 * lib/services/SupabaseProgressService.ts
 *
 * Production implementation of ILearningProgressService backed by Supabase.
 *
 * Key design decisions:
 *
 *  1. completeLesson() calls the Edge Function, NOT the DB directly.
 *     The Edge Function reads the XP reward from the DB server-side,
 *     so users cannot manipulate XP values from the browser.
 *
 *  2. All read operations (getProgress, getXP, getLeaderboard) go directly
 *     to the Supabase REST API using the anon key. This is safe because
 *     RLS policies ensure users only see their own data.
 *
 *  3. User profiles are auto-created by the complete_lesson stored procedure
 *     on the first lesson completion — no separate registration step needed.
 *
 *  4. The leaderboard uses the `leaderboard` view (top 100 by XP) which
 *     is publicly readable. Real-time updates are powered by subscribing
 *     to the user_profiles table via Supabase Realtime.
 */

import { supabase, DbLeaderboardEntry } from '@/lib/supabaseClient';

// ─── Result types ──────────────────────────────────────────────────────────────

export interface CompleteLessonResult {
  xpEarned: number;
  newTotalXp: number;
  newLevel: number;
  leveledUp: boolean;
  newStreak: number;
  alreadyCompleted: boolean;
}

export interface CourseProgress {
  courseId: string;
  enrolledAt: string;
  completedAt: string | null;
  completedLessonIds: string[];
  totalXpEarned: number;
}

export interface UserStats {
  totalXp: number;
  level: number;
  streak: number;
  longestStreak: number;
  completedLessons: number;
  achievements: string[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  walletAddress: string | null;
  totalXp: number;
  level: number;
  streak: number;
  completedLessons: number;
  completedCourses: number;
  achievementCount: number;
}

// ─── Service ───────────────────────────────────────────────────────────────────

export class SupabaseProgressService {
  private readonly edgeFunctionUrl: string;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('[SupabaseProgressService] NEXT_PUBLIC_SUPABASE_URL is not set');
    }
    this.edgeFunctionUrl = `${supabaseUrl}/functions/v1/complete-lesson`;
  }

  // ── completeLesson ────────────────────────────────────────────────────────────
  /**
   * Securely marks a lesson as complete via the Edge Function.
   * XP is calculated server-side — the client cannot fake XP rewards.
   *
   * @param walletAddress  The user's Solana wallet public key
   * @param courseId       e.g. "solana-101"
   * @param moduleId       e.g. "module-1"
   * @param lessonId       e.g. "lesson-1"
   */
  async completeLesson(
    walletAddress: string,
    courseId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<CompleteLessonResult> {
    const res = await fetch(this.edgeFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, courseId, moduleId, lessonId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`[completeLesson] ${res.status}: ${body.error ?? JSON.stringify(body)}`);
    }

    return res.json() as Promise<CompleteLessonResult>;
  }

  // ── getUserStats ──────────────────────────────────────────────────────────────
  /**
   * Fetch a user's gamification stats (XP, level, streak, achievements).
   * Returns null if the wallet has never completed a lesson.
   */
  async getUserStats(walletAddress: string): Promise<UserStats | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('total_xp, level, streak, longest_streak, achievements')
      .eq('id', walletAddress)
      .maybeSingle();

    if (error) throw new Error(`[getUserStats] ${error.message}`);
    if (!data) return null;

    const { data: completions, error: lcErr } = await supabase
      .from('lesson_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', walletAddress);

    if (lcErr) throw new Error(`[getUserStats] ${lcErr.message}`);

    return {
      totalXp:          (data as any).total_xp,
      level:            (data as any).level,
      streak:           (data as any).streak,
      longestStreak:    (data as any).longest_streak,
      completedLessons: (completions as unknown as { count: number })?.count ?? 0,
      achievements:     (data as any).achievements ?? [],
    };
  }

  // ── getCourseProgress ─────────────────────────────────────────────────────────
  /**
   * Fetch all completed lesson IDs and enrollment status for a single course.
   */
  async getCourseProgress(
    walletAddress: string,
    courseId: string,
  ): Promise<CourseProgress | null> {
    // Get enrollment record
    const { data: enrollment, error: enrollErr } = await supabase
      .from('course_enrollments')
      .select('enrolled_at, completed_at')
      .eq('user_id', walletAddress)
      .eq('course_id', courseId)
      .maybeSingle();

    if (enrollErr) throw new Error(`[getCourseProgress] ${enrollErr.message}`);
    if (!enrollment) return null;

    // Get all completed lesson IDs + XP for this course
    const { data: completions, error: lcErr } = await supabase
      .from('lesson_completions')
      .select('lesson_id, xp_earned')
      .eq('user_id', walletAddress)
      .eq('course_id', courseId);

    if (lcErr) throw new Error(`[getCourseProgress] ${lcErr.message}`);

    return {
      courseId,
      enrolledAt:          (enrollment as any).enrolled_at,
      completedAt:         (enrollment as any).completed_at,
      completedLessonIds:  (completions ?? []).map((c: any) => c.lesson_id),
      totalXpEarned:       (completions ?? []).reduce((sum: number, c: any) => sum + c.xp_earned, 0),
    };
  }

  // ── getLeaderboard ────────────────────────────────────────────────────────────
  /**
   * Fetch the top-100 leaderboard. Results come from the `leaderboard` view
   * which pre-ranks users by XP descending.
   */
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('rank', { ascending: true });

    if (error) throw new Error(`[getLeaderboard] ${error.message}`);

    return (data ?? []).map((row: DbLeaderboardEntry) => ({
      rank:             row.rank,
      userId:           row.user_id,
      displayName:      row.display_name,
      walletAddress:    row.wallet_address,
      totalXp:          row.total_xp,
      level:            row.level,
      streak:           row.streak,
      completedLessons: row.completed_lessons,
      completedCourses: row.completed_courses,
      achievementCount: row.achievement_count,
    }));
  }

  // ── subscribeToLeaderboard ────────────────────────────────────────────────────
  /**
   * Subscribe to real-time XP changes on user_profiles.
   * The callback fires whenever any user's XP/level/streak updates.
   * Call the returned cleanup function to unsubscribe.
   *
   * Usage:
   *   const unsub = service.subscribeToLeaderboard(() => refetchLeaderboard());
   *   // in useEffect cleanup:
   *   return () => unsub();
   */
  subscribeToLeaderboard(onUpdate: () => void): () => void {
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'user_profiles',
        },
        onUpdate,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // ── updateDisplayName ─────────────────────────────────────────────────────────
  /**
   * Let a user set their display name.
   * RLS ensures users can only update their own profile.
   */
  async updateDisplayName(walletAddress: string, displayName: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      // @ts-ignore
        .update({ display_name: displayName } as any)
      .eq('id', walletAddress);

    if (error) throw new Error(`[updateDisplayName] ${error.message}`);
  }

  // ── getXpHistory ──────────────────────────────────────────────────────────────
  /**
   * Fetch the last N XP transactions for a user. Useful for an XP history feed.
   */
  async getXpHistory(walletAddress: string, limit = 20): Promise<
    Array<{ amount: number; reason: string; createdAt: string }>
  > {
    const { data, error } = await supabase
      .from('xp_transactions')
      .select('amount, reason, created_at')
      .eq('user_id', walletAddress)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`[getXpHistory] ${error.message}`);

    return (data ?? []).map((row) => ({
      amount:    (row as any).amount,
      reason:    (row as any).reason,
      createdAt: (row as any).created_at,
    }));
  }
}

// ─── Singleton export ──────────────────────────────────────────────────────────

let _instance: SupabaseProgressService | null = null;

export function getProgressService(): SupabaseProgressService {
  if (!_instance) _instance = new SupabaseProgressService();
  return _instance;
}
