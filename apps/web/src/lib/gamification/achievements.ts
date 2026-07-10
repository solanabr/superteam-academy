import "server-only";

import {
  COMMUNITY_STATS,
  type AwardKind,
  type AwardT,
} from "@superteam-lms/content-schema";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAllAchievements,
  getAllCourseLessonCounts,
  getLearningPathsForAdmin,
} from "@/lib/sanity/queries";

type CommunityStat = (typeof COMMUNITY_STATS)[number];

/** Display shape for the achievement catalog (grid + identity panel). */
export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Short monospace text for octagonal medal display (e.g. "01", "Rs", "A+"). */
  glyph: string;
  /** Uses the iridescent Solana-themed visual treatment. */
  solTier: boolean;
  category: string;
}

/**
 * ONE fully-populated user state (spec §4.10, D9). Merges what
 * `event-handlers.ts` computed (progress) and what `buildCommunityUserState`
 * computed (community) into a single object so a declarative predicate can read
 * both. `perfect-score` is intentionally absent — it has no durable "first-try"
 * signal (block results are transient by design), so the achievement is dropped
 * per the spec open question; it is NOT one of CS-1's 8 AwardKinds and needs no
 * field here.
 */
export interface UserState {
  completedLessons: number;
  /** courseId → count of completed lessons in that course. */
  completedLessonsByCourse: Record<string, number>;
  completedCourseIds: ReadonlySet<string>;
  completedPathIds: ReadonlySet<string>;
  currentStreak: number;
  userNumber: number;
  community: Record<CommunityStat, number>;
}

type Predicate = (award: AwardT, s: UserState) => boolean;

/**
 * The closed set of unlock predicates, one per CS-1 `AwardKind`. `satisfies
 * Record<AwardKind, Predicate>` makes a missing kind a COMPILE error. `award` is
 * the discriminated union, so each branch narrows on `award.kind`. No course id
 * is hardcoded — every course/path is named by content.
 */
export const PREDICATES = {
  "lessons-completed": (a, s) =>
    a.kind === "lessons-completed" && s.completedLessons >= a.gte,
  "lessons-completed-in-course": (a, s) =>
    a.kind === "lessons-completed-in-course" &&
    (s.completedLessonsByCourse[a.course] ?? 0) >= a.gte,
  "course-completed": (a, s) =>
    a.kind === "course-completed" && s.completedCourseIds.has(a.course),
  "path-completed": (a, s) =>
    a.kind === "path-completed" && s.completedPathIds.has(a.path),
  streak: (a, s) => a.kind === "streak" && s.currentStreak >= a.days,
  "user-number": (a, s) => a.kind === "user-number" && s.userNumber <= a.lte,
  "community-stat": (a, s) =>
    a.kind === "community-stat" && (s.community[a.stat] ?? 0) >= a.gte,
  // Admin-granted only (e.g. bug-hunter); never auto-fires from state. Takes the
  // two params (contextually typed) so every predicate is uniformly callable.
  manual: (_award, _state) => false,
} satisfies Record<AwardKind, Predicate>;

/**
 * Returns achievements the user has newly earned. Each achievement carries its
 * declarative `award`; a null award (pre-sync/legacy) or an already-unlocked
 * achievement is skipped. The generic keeps the caller's element type so both
 * `DeployedAchievement` and lighter shapes flow through.
 */
export function checkNewAchievements<
  T extends { id: string; award: AwardT | null },
>(deployed: T[], state: UserState, alreadyUnlocked: string[]): T[] {
  const unlocked = new Set(alreadyUnlocked);
  const newlyUnlocked: T[] = [];

  for (const def of deployed) {
    if (unlocked.has(def.id)) continue;
    if (!def.award) continue; // no rule → cannot auto-earn
    if (PREDICATES[def.award.kind](def.award, state)) {
      newlyUnlocked.push(def);
    }
  }
  return newlyUnlocked;
}

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Build the ONE fully-populated {@link UserState} for a user in a single pass:
 * progress (lessons/courses), path completion (real learningPath membership —
 * no hardcoded course ids), streak, user number, and community stats.
 */
export async function buildUserState(
  admin: AdminClient,
  userId: string
): Promise<UserState> {
  const [
    { data: xpData },
    { data: progressRows },
    { data: enrollmentRows },
    { data: communityStats },
    { data: userProfile },
    courseLessonCounts,
    learningPaths,
  ] = await Promise.all([
    admin
      .from("user_xp")
      .select("current_streak")
      .eq("user_id", userId)
      .single(),
    admin
      .from("user_progress")
      .select("lesson_id, course_id")
      .eq("user_id", userId)
      .eq("completed", true),
    admin
      .from("enrollments")
      .select("course_id, completed_at")
      .eq("user_id", userId),
    admin.from("community_stats").select("*").eq("user_id", userId).single(),
    admin.from("profiles").select("created_at").eq("id", userId).single(),
    getAllCourseLessonCounts(),
    getLearningPathsForAdmin(),
  ]);

  // Per-course completed-lesson counts.
  const completedLessonsByCourse: Record<string, number> = {};
  for (const row of progressRows ?? []) {
    completedLessonsByCourse[row.course_id] =
      (completedLessonsByCourse[row.course_id] ?? 0) + 1;
  }
  const completedLessons = progressRows?.length ?? 0;

  // A course is complete when every Sanity lesson is done, OR the enrollment is
  // flagged complete.
  const totalPerCourse = new Map(
    courseLessonCounts.map((c) => [c._id, c.totalLessons])
  );
  const completedCourseIds = new Set<string>();
  for (const [courseId, done] of Object.entries(completedLessonsByCourse)) {
    const total = totalPerCourse.get(courseId);
    if (total && total > 0 && done >= total) completedCourseIds.add(courseId);
  }
  for (const row of enrollmentRows ?? []) {
    if (row.completed_at) completedCourseIds.add(row.course_id);
  }

  // A path is complete when every course it references is complete (real
  // learningPath membership — replaces the hardcoded SOLANA_DEV_PATH_COURSES).
  const completedPathIds = new Set<string>();
  for (const path of learningPaths) {
    if (
      path.courseIds.length > 0 &&
      path.courseIds.every((cid) => completedCourseIds.has(cid))
    ) {
      completedPathIds.add(path._id);
    }
  }

  // userNumber: how many profiles registered at or before this user.
  const { count: userNumber } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .lte("created_at", userProfile?.created_at ?? new Date().toISOString());

  return {
    completedLessons,
    completedLessonsByCourse,
    completedCourseIds,
    completedPathIds,
    currentStreak: xpData?.current_streak ?? 0,
    userNumber: userNumber ?? 999,
    community: {
      totalThreads: communityStats?.total_threads ?? 0,
      totalAnswers: communityStats?.total_answers ?? 0,
      acceptedAnswers: communityStats?.accepted_answers ?? 0,
      totalCommunityXp: communityStats?.total_community_xp ?? 0,
    },
  };
}

/**
 * Fire-and-forget helper: builds the merged user state, checks for newly earned
 * achievements, and unlocks them via the `unlock_achievement` RPC.
 * Non-critical — callers should swallow errors with `.catch(() => {})`.
 */
export async function checkCommunityAchievements(
  admin: AdminClient,
  userId: string
): Promise<void> {
  const [allAchievements, state, { data: unlocked }] = await Promise.all([
    getAllAchievements(),
    buildUserState(admin, userId),
    admin
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId),
  ]);
  const alreadyUnlocked = (unlocked ?? []).map(
    (r: { achievement_id: string }) => r.achievement_id
  );

  const newAchievements = checkNewAchievements(
    allAchievements,
    state,
    alreadyUnlocked
  );

  for (const achievement of newAchievements) {
    await admin.rpc("unlock_achievement", {
      p_user_id: userId,
      p_achievement_id: achievement.id,
    });
  }
}
