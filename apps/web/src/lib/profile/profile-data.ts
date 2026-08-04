import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Achievement, Certificate } from "@superteam-lms/types";
import type { Database } from "@/lib/supabase/types";
import {
  getAllAchievements,
  getAllLessonSkills,
  getCoursesByIds,
} from "@/lib/content/queries";
import type { DeployedAchievement } from "@/lib/content/queries";
import { completedLessonsToRadar } from "@/lib/gamification";
import { getProgressService } from "@/lib/services";
import { calculateLevel } from "@/lib/gamification/xp";

type DB = SupabaseClient<Database>;

export interface ProfileUser {
  id: string;
  username: string;
  /** Admin-set editorial name shown instead of `username` (#997), or null. */
  displayName: string | null;
  /** Admin-granted verified-teacher badge (#997). */
  verified: boolean;
  bio: string;
  avatarUrl: string;
  joinedAt: Date;
  socialLinks: {
    twitter?: string;
    github?: string;
    discord?: string;
  };
  isPublic?: boolean;
}

export interface ProfileStats {
  totalXp: number;
  level: number;
  coursesCompleted: number;
  certificatesCount: number;
}

export interface ProfileSkillItem {
  label: string;
  value: number;
  lessonCount: number;
}

export interface ProfileCompletedCourse {
  title: string;
  slug: string;
  completedAt: string;
  xpEarned: number;
}

/** Everything on a profile that is derived from the content bundle + own rows. */
export interface ProfileContent {
  achievements: Achievement[];
  deployedAchievements: DeployedAchievement[];
  certificates: Certificate[];
  completedCourses: ProfileCompletedCourse[];
  skills: ProfileSkillItem[];
  totalLessons: number;
}

interface AchievementRow {
  achievement_id: string;
  unlocked_at: string | null;
  asset_address: string | null;
  tx_signature: string | null;
}

interface ProgressRow {
  course_id: string;
  lesson_id: string;
}

interface EnrollmentRow {
  course_id: string;
  enrolled_at: string | null;
}

interface ShapeInput {
  achievementRows: AchievementRow[];
  certRows: unknown[];
  progressRows: ProgressRow[];
  enrollmentRows: EnrollmentRow[];
}

function mapCertificates(certRows: unknown[]): Certificate[] {
  return (certRows as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    userId: (row.user_id as string) ?? "",
    courseId: row.course_id as string,
    courseTitle: row.course_title as string,
    mintAddress: (row.mint_address as string) ?? "",
    metadataUri: (row.metadata_uri as string) ?? "",
    mintedAt: new Date((row.minted_at as string) ?? Date.now()),
  }));
}

/**
 * Shared profile shaping (server-side). The public profile and the owner's
 * profile fetch the same four row sets — achievements, certificates, completed
 * progress, enrollments — and derive achievements, completed courses, and the
 * skill radar from them identically; only the profile row and XP source differ
 * (see fetchPublicProfile / fetchOwnProfile).
 */
async function shapeProfileContent(input: ShapeInput): Promise<ProfileContent> {
  const { achievementRows, certRows, progressRows, enrollmentRows } = input;

  const certificates = mapCertificates(certRows);

  // Total unique completed lessons (one row per lesson).
  const totalLessons = progressRows.length;

  // Build a map of course_id -> completed lesson count.
  const courseProgressMap = new Map<string, number>();
  for (const row of progressRows) {
    courseProgressMap.set(
      row.course_id,
      (courseProgressMap.get(row.course_id) ?? 0) + 1
    );
  }

  const enrolledIds = enrollmentRows.map((e) => e.course_id);
  const [courseSummaries, allLessonSkills, allAchievements] = await Promise.all(
    [
      enrolledIds.length > 0
        ? getCoursesByIds(enrolledIds)
        : Promise.resolve([]),
      getAllLessonSkills(),
      getAllAchievements(),
    ]
  );

  const achievementMap = new Map(allAchievements.map((a) => [a.id, a]));

  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
  const cluster = network === "mainnet" ? "mainnet-beta" : network;

  const achievements: Achievement[] = achievementRows.map((row) => {
    const def = achievementMap.get(row.achievement_id);
    const explorerUrl = row.asset_address
      ? `https://explorer.solana.com/address/${row.asset_address}?cluster=${cluster}`
      : row.tx_signature
        ? `https://explorer.solana.com/tx/${row.tx_signature}?cluster=${cluster}`
        : undefined;
    return {
      id: row.achievement_id,
      name: def?.name ?? row.achievement_id,
      description: def?.description ?? "",
      icon: def?.icon ?? "Award",
      category: (def?.category as Achievement["category"]) ?? "special",
      unlockedAt: new Date(row.unlocked_at ?? Date.now()),
      explorerUrl,
      assetAddress: row.asset_address ?? undefined,
    };
  });

  const courseMap = new Map(courseSummaries.map((c) => [c._id, c]));

  const completedCourses: ProfileCompletedCourse[] = [];
  for (const enrollment of enrollmentRows) {
    const completedCount = courseProgressMap.get(enrollment.course_id) ?? 0;
    if (completedCount > 0) {
      const courseInfo = courseMap.get(enrollment.course_id);
      completedCourses.push({
        title: courseInfo?.title ?? enrollment.course_id,
        slug: courseInfo?.slug ?? enrollment.course_id,
        completedAt: new Date(
          enrollment.enrolled_at ?? Date.now()
        ).toLocaleDateString(),
        xpEarned: 0,
      });
    }
  }

  // Compute skill radar — per-lesson attribution (#466 C3): a completed lesson
  // credits ONLY its own skills, not every tag its course carries.
  const completedLessonIds = progressRows.map((r) => r.lesson_id);
  const lessonSkillsMap = new Map(
    allLessonSkills.map((l) => [l._id, l.skills])
  );
  const skills = completedLessonsToRadar(completedLessonIds, lessonSkillsMap);

  return {
    achievements,
    deployedAchievements: allAchievements,
    certificates,
    completedCourses,
    skills,
    totalLessons,
  };
}

function socialLinksOf(value: unknown): ProfileUser["socialLinks"] {
  return (value ?? {}) as ProfileUser["socialLinks"];
}

function statsFrom(
  totalXp: number,
  level: number,
  content: ProfileContent
): ProfileStats {
  return {
    totalXp,
    level,
    coursesCompleted: content.completedCourses.length,
    certificatesCount: content.certificates.length,
  };
}

export interface PublicProfileResult {
  user: ProfileUser;
  stats: ProfileStats;
  content: ProfileContent;
  isOwnProfile: boolean;
}

/**
 * Public profile by username (server-side). Reads through the `public_profiles`
 * view (#493): the base `profiles` table has no cross-user read path anymore —
 * the view is the sole public surface and never exposes google_id/github_id. A
 * private (or missing) profile yields no row -> null (the page renders its
 * not-found state); the owner views their own private profile from /profile.
 */
export async function fetchPublicProfile(
  supabase: DB,
  username: string,
  currentUserId: string | null
): Promise<PublicProfileResult | null> {
  const { data: profile, error: profileError } = await supabase
    .from("public_profiles")
    .select(
      "id, username, display_name, verified, bio, avatar_url, social_links, created_at"
    )
    .eq("username", username)
    .single();

  if (profileError || !profile || !profile.id) {
    return null;
  }

  const userId = profile.id;

  const [
    xpResult,
    achievementResult,
    certResult,
    progressResult,
    enrollmentResult,
  ] = await Promise.all([
    supabase
      .from("public_user_xp")
      .select("total_xp, level")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at, asset_address, tx_signature")
      .eq("user_id", userId),
    supabase.from("certificates").select("*").eq("user_id", userId),
    supabase
      .from("user_progress")
      .select("course_id, lesson_id, completed")
      .eq("user_id", userId)
      .eq("completed", true),
    supabase
      .from("enrollments")
      .select("course_id, enrolled_at")
      .eq("user_id", userId),
  ]);

  const content = await shapeProfileContent({
    achievementRows: achievementResult.data ?? [],
    certRows: certResult.data ?? [],
    progressRows: progressResult.data ?? [],
    enrollmentRows: enrollmentResult.data ?? [],
  });

  const user: ProfileUser = {
    id: profile.id,
    username: profile.username ?? username,
    displayName: profile.display_name ?? null,
    // Default false, never a nullable passthrough: wrongly badging an
    // unverified teacher is worse than briefly missing a badge.
    verified: profile.verified ?? false,
    bio: profile.bio ?? "",
    avatarUrl: profile.avatar_url ?? "",
    joinedAt: new Date(profile.created_at ?? Date.now()),
    socialLinks: socialLinksOf(profile.social_links),
  };

  return {
    user,
    stats: statsFrom(
      xpResult.data?.total_xp ?? 0,
      xpResult.data?.level ?? 0,
      content
    ),
    content,
    isOwnProfile: currentUserId === profile.id,
  };
}

export interface OwnProfileResult {
  user: ProfileUser;
  stats: ProfileStats;
  content: ProfileContent;
  streak: { currentStreak: number; longestStreak: number; available: boolean };
}

/**
 * The signed-in user's own profile (server-side). Reads the base `profiles`
 * row (own-row RLS) and resolves XP + streak through the service layer
 * (on-chain first, Supabase fallback). Returns null when no profile row exists.
 */
export async function fetchOwnProfile(
  supabase: DB,
  userId: string
): Promise<OwnProfileResult | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const service = getProgressService(supabase);
  const [
    totalXp,
    streakData,
    achievementResult,
    certResult,
    progressResult,
    enrollmentResult,
  ] = await Promise.all([
    service.getXP(userId),
    service.getStreak(userId),
    supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at, asset_address, tx_signature")
      .eq("user_id", userId),
    supabase.from("certificates").select("*").eq("user_id", userId),
    supabase
      .from("user_progress")
      .select("course_id, lesson_id, completed")
      .eq("user_id", userId)
      .eq("completed", true),
    supabase
      .from("enrollments")
      .select("course_id, enrolled_at")
      .eq("user_id", userId),
  ]);

  const content = await shapeProfileContent({
    achievementRows: achievementResult.data ?? [],
    certRows: certResult.data ?? [],
    progressRows: progressResult.data ?? [],
    enrollmentRows: enrollmentResult.data ?? [],
  });

  const user: ProfileUser = {
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name ?? null,
    verified: profile.verified ?? false,
    bio: profile.bio ?? "",
    avatarUrl: profile.avatar_url ?? "",
    joinedAt: new Date(profile.created_at ?? Date.now()),
    socialLinks: socialLinksOf(profile.social_links),
    isPublic: profile.is_public ?? true,
  };

  return {
    user,
    stats: statsFrom(totalXp, calculateLevel(totalXp), content),
    content,
    streak: {
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      // #731: propagate the degraded flag so the hero renders em-dash on a
      // failed read instead of a misleading 0.
      available: streakData.available,
    },
  };
}
