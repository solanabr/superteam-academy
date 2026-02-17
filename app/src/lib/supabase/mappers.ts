import type { UserProfile, UserStats, Enrollment } from "@/types/user";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function rowToProfile(row: any): UserProfile {
  return {
    id: row.id,
    username: row.username ?? "",
    displayName: row.display_name ?? "",
    email: row.email ?? "",
    bio: row.bio ?? "",
    avatarUrl: row.avatar_url ?? "",
    socialLinks: row.social_links ?? {},
    walletAddress: row.wallet_address ?? undefined,
    isPublic: row.is_public ?? true,
    emailNotifications: row.email_notifications ?? true,
    preferredLanguage: row.preferred_language ?? "en",
    preferredTheme: row.preferred_theme ?? "dark",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToUserStats(row: any): UserStats {
  return {
    userId: row.user_id,
    totalXP: row.total_xp ?? 0,
    level: row.level ?? 0,
    currentStreak: row.current_streak ?? 0,
    longestStreak: row.longest_streak ?? 0,
    lastActivityDate: row.last_activity_date ?? null,
    streakFreezes: row.streak_freezes ?? 0,
    coursesCompleted: row.courses_completed ?? 0,
    lessonsCompleted: row.lessons_completed ?? 0,
    challengesCompleted: row.challenges_completed ?? 0,
    achievementFlags: row.achievement_flags ?? [0, 0, 0, 0],
    updatedAt: row.updated_at,
  };
}

export function rowToEnrollment(row: any): Enrollment {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    enrolledAt: row.enrolled_at,
    completedAt: row.completed_at ?? null,
    progressPct: row.progress_pct ?? 0,
    lessonFlags: row.lesson_flags ?? [0, 0, 0, 0],
  };
}
