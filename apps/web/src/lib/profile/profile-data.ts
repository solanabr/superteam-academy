import { getLocale } from "next-intl/server";
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
import { isEventAchievementId, type EventBadge } from "@/lib/events/events";
import {
  toVerifiedKind,
  type VerifiedKind,
} from "@/lib/profiles/public-profile";
import { getProgressService } from "@/lib/services";
import { calculateLevel } from "@/lib/gamification/xp";
import { explorerUrl } from "@/lib/solana/network";

type DB = SupabaseClient<Database>;

export interface ProfileUser {
  id: string;
  username: string;
  /** Admin-set editorial name shown instead of `username` (#997), or null. */
  displayName: string | null;
  /** Admin-granted verified-teacher badge (#997). */
  verified: boolean;
  /** Which badge to wear (#1234) — Superteam member or verified partner. */
  verifiedKind: VerifiedKind | null;
  bio: string;
  avatarUrl: string;
  joinedAt: Date;
  socialLinks: {
    twitter?: string;
    github?: string;
    discord?: string;
  };
  /** Admin-set X handle of a verified author, or null. */
  xUsername: string | null;
  isPublic?: boolean;
}

export interface ProfileStats {
  totalXp: number;
  level: number;
  coursesCompleted: number;
  certificatesCount: number;
  /** Completed lessons — the always-meaningful volume stat (04-08); the
   *  certificates count lives with the certificates section instead. */
  lessonsCompleted: number;
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
  /** Events and workshops attended, newest first. */
  events: EventBadge[];
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

/** One attended event, as either profile read returns it. */
interface EventRow {
  event_id: string | null;
  achievement_id: string | null;
  name: string | null;
  description: string | null;
  image_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  redeemed_at: string | null;
}

interface ShapeInput {
  achievementRows: AchievementRow[];
  certRows: unknown[];
  progressRows: ProgressRow[];
  enrollmentRows: EnrollmentRow[];
  eventRows: EventRow[];
}

/**
 * Event badges, newest event first. The NFT address comes from the same
 * user_achievements row the queue writes when the award lands.
 */
function mapEventBadges(
  eventRows: EventRow[],
  achievementRows: AchievementRow[]
): EventBadge[] {
  const assets = new Map(
    achievementRows.map((r) => [r.achievement_id, r.asset_address])
  );
  return eventRows
    .filter(
      (
        r
      ): r is EventRow & {
        event_id: string;
        achievement_id: string;
        name: string;
        starts_at: string;
        ends_at: string;
        redeemed_at: string;
      } =>
        Boolean(
          r.event_id &&
          r.achievement_id &&
          r.name &&
          r.starts_at &&
          r.ends_at &&
          r.redeemed_at
        )
    )
    .map((r) => ({
      eventId: r.event_id,
      achievementId: r.achievement_id,
      name: r.name,
      description: r.description ?? "",
      imageUrl: r.image_url,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      redeemedAt: r.redeemed_at,
      assetAddress: assets.get(r.achievement_id) ?? null,
    }))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}

const EVENT_BADGE_COLUMNS =
  "event_id, achievement_id, name, description, image_url, starts_at, ends_at, redeemed_at";

/**
 * The signed-in learner's own events. Read from their own attendance rows
 * (own-row RLS) rather than public_event_badges, which hides private profiles.
 */
async function fetchOwnEventRows(
  supabase: DB,
  userId: string
): Promise<EventRow[]> {
  const { data: attendances, error } = await supabase
    .from("event_attendances")
    .select("event_id, redeemed_at")
    .eq("user_id", userId);
  if (error || !attendances?.length) return [];

  const { data: events } = await supabase
    .from("public_events")
    .select(
      "id, achievement_id, name, description, image_url, starts_at, ends_at"
    )
    .in(
      "id",
      attendances.map((a) => a.event_id)
    );
  const byId = new Map((events ?? []).map((e) => [e.id, e]));
  return attendances.map((a) => {
    const e = byId.get(a.event_id);
    return {
      event_id: a.event_id,
      achievement_id: e?.achievement_id ?? null,
      name: e?.name ?? null,
      description: e?.description ?? null,
      image_url: e?.image_url ?? null,
      starts_at: e?.starts_at ?? null,
      ends_at: e?.ends_at ?? null,
      redeemed_at: a.redeemed_at,
    };
  });
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
  const { certRows, progressRows, enrollmentRows, eventRows } = input;
  // Event awards land in user_achievements too, but they are not part of the
  // course achievement set: they show in the Events section instead.
  const achievementRows = input.achievementRows.filter(
    (r) => !isEventAchievementId(r.achievement_id)
  );
  const events = mapEventBadges(eventRows, input.achievementRows);

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
        ? getCoursesByIds(enrolledIds, await getLocale())
        : Promise.resolve([]),
      getAllLessonSkills(),
      getAllAchievements(),
    ]
  );

  const achievementMap = new Map(allAchievements.map((a) => [a.id, a]));

  const achievements: Achievement[] = achievementRows.map((row) => {
    const def = achievementMap.get(row.achievement_id);
    const explorerLink = row.asset_address
      ? explorerUrl("address", row.asset_address)
      : row.tx_signature
        ? explorerUrl("tx", row.tx_signature)
        : undefined;
    return {
      id: row.achievement_id,
      name: def?.name ?? row.achievement_id,
      description: def?.description ?? "",
      icon: def?.icon ?? "Award",
      category: (def?.category as Achievement["category"]) ?? "special",
      unlockedAt: new Date(row.unlocked_at ?? Date.now()),
      explorerUrl: explorerLink,
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
    events,
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
    lessonsCompleted: content.totalLessons,
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
      "id, username, display_name, verified, verified_kind, bio, avatar_url, social_links, x_username, created_at"
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
    eventResult,
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
    supabase
      .from("public_event_badges")
      .select(EVENT_BADGE_COLUMNS)
      .eq("user_id", userId),
  ]);

  const content = await shapeProfileContent({
    achievementRows: achievementResult.data ?? [],
    certRows: certResult.data ?? [],
    progressRows: progressResult.data ?? [],
    enrollmentRows: enrollmentResult.data ?? [],
    eventRows: eventResult.data ?? [],
  });

  const user: ProfileUser = {
    id: profile.id,
    username: profile.username ?? username,
    displayName: profile.display_name ?? null,
    // Default false, never a nullable passthrough: wrongly badging an
    // unverified teacher is worse than briefly missing a badge.
    verified: profile.verified ?? false,
    verifiedKind: toVerifiedKind(profile.verified_kind),
    bio: profile.bio ?? "",
    avatarUrl: profile.avatar_url ?? "",
    joinedAt: new Date(profile.created_at ?? Date.now()),
    socialLinks: socialLinksOf(profile.social_links),
    xUsername: profile.x_username ?? null,
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
    eventRows,
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
    fetchOwnEventRows(supabase, userId),
  ]);

  const content = await shapeProfileContent({
    achievementRows: achievementResult.data ?? [],
    certRows: certResult.data ?? [],
    progressRows: progressResult.data ?? [],
    enrollmentRows: enrollmentResult.data ?? [],
    eventRows,
  });

  const user: ProfileUser = {
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name ?? null,
    verified: profile.verified ?? false,
    verifiedKind: toVerifiedKind(profile.verified_kind),
    bio: profile.bio ?? "",
    avatarUrl: profile.avatar_url ?? "",
    joinedAt: new Date(profile.created_at ?? Date.now()),
    socialLinks: socialLinksOf(profile.social_links),
    xUsername: profile.x_username ?? null,
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
