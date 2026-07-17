import "server-only";

import type { AwardT } from "@superteam-lms/content-schema";
import type { Course, Lesson, LearningPath } from "@superteam-lms/types";
import {
  getActiveDeployments,
  getDeploymentById,
  getDeploymentByIdSafe,
  isSynced,
  type OnchainDeploymentRow,
} from "./deployments";
import {
  countCourseLessons,
  parseAward,
  projectAchievement,
  projectCourse,
  projectCourseSummary,
  projectLearningPath,
  projectLesson,
  projectLessonSummary,
  projectQuestData,
  projectRecommended,
} from "./project";
import { resolveRefs } from "./resolve-refs";
import {
  achievementsById,
  coursesById,
  coursesBySlug,
  lessonsById,
  pathsById,
  questsById,
} from "./store";
import type {
  AchievementDoc,
  CourseDoc,
  LearningPathDoc,
  LessonDoc,
} from "./types";

/**
 * The flipped query layer (SP2-B Task 5). Every fn that used to run a GROQ query
 * against Sanity now composes three server-only seams:
 *
 *  - CONTENT comes from the committed bundle store (`./store` maps).
 *  - ON-CHAIN STATUS comes from Supabase via `./deployments`
 *    (`getActiveDeployments` for the cached public gate map, `getDeploymentById`
 *    for the uncached full row on reward/admin paths).
 *  - SHAPE comes from the Task-4 projectors (`./project`), which reproduce the
 *    old GROQ projections field-for-field.
 *
 * Names and return types are IDENTICAL to the pre-flip `lib/sanity/queries.ts`,
 * so `lib/sanity/queries.ts` can become a thin re-export barrel and none of its
 * 33 import sites change (plan §ambiguity 2). The visibility gate that GROQ
 * expressed as `onChainStatus.status == "synced" && coalesce(isActive, true)`
 * now lives entirely in `isSynced` (one place).
 */

// Shared Next.js cache tag for the public course catalog. Canonical home (moved
// here from `lib/sanity/queries.ts` so the Supabase read seam in `deployments.ts`
// can depend on it without pulling in the Sanity client graph). The barrel
// re-exports it; an admin course sync purges the tagged group via
// `revalidateTag(COURSES_CACHE_TAG)`.
export const COURSES_CACHE_TAG = "courses";

// --- local coercion helpers (GROQ null-for-absent semantics) ---

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}

function strArr(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}

function refId(v: unknown): string | null {
  if (typeof v === "object" && v !== null && "_ref" in v) {
    const r = (v as { _ref?: unknown })._ref;
    return typeof r === "string" ? r : null;
  }
  return null;
}

/**
 * Code-unit (`<`/`>`) ordering — the house preference standing in for GROQ's
 * `order(title asc)`. Faithful to GROQ's byte-ordered sort (not locale-aware
 * collation), and stable/deterministic across runtimes.
 */
function byField<T>(pick: (x: T) => string | null) {
  return (a: T, b: T): number => {
    const av = pick(a) ?? "";
    const bv = pick(b) ?? "";
    return av < bv ? -1 : av > bv ? 1 : 0;
  };
}

const byTitle = byField<{ title: string | null }>((x) => x.title);
const byName = byField<{ name: string | null }>((x) => x.name);

const projectionDeps = { lessonsById };

// --- store traversal helpers ---

/** A course doc's `creator` wallet (issue #478), or null when unset. */
function courseCreatorWallet(doc: CourseDoc): string | null {
  return str(doc.creator);
}

/** Raw module objects on a course, in display (array) order. */
interface RawModule {
  key?: unknown;
  lessons?: unknown;
}

function courseModules(doc: CourseDoc): RawModule[] {
  return Array.isArray(doc.modules) ? (doc.modules as RawModule[]) : [];
}

/**
 * The course's lesson docs, in module→lesson display order, weak refs
 * dereferenced through the store and unresolvable ones dropped (#405 hardening —
 * the explicit mirror of GROQ `(modules[].lessons[]->{…})[defined(_id)]`).
 */
function courseLessonDocs(doc: CourseDoc): LessonDoc[] {
  const out: LessonDoc[] = [];
  for (const m of courseModules(doc)) {
    const refs = Array.isArray(m.lessons) ? m.lessons : [];
    for (const ref of refs) {
      const id = refId(ref);
      const lesson = id ? lessonsById.get(id) : undefined;
      if (lesson) out.push(lesson);
    }
  }
  return out;
}

/** Ref ids of a learning path's `courses[]` (weak refs), preserving GROQ `coalesce(courses[]._ref, [])`. */
function pathCourseRefIds(doc: LearningPathDoc): string[] {
  const refs = Array.isArray(doc.courses) ? doc.courses : [];
  return refs.map((r) => refId(r)).filter((x): x is string => !!x);
}

/**
 * Title of the first learning path that references `courseId`, else null —
 * the `*[_type=="learningPath" && references(^._id)][0].title` cross-doc join.
 * Iterates the store in doc order so `[0]` picks the same path GROQ would.
 */
function learningPathTitleFor(courseId: string): string | null {
  for (const p of pathsById.values()) {
    if (pathCourseRefIds(p).includes(courseId)) return str(p.title);
  }
  return null;
}

/** GROQ `order(coalesce(order, 999) asc, title asc)` for learning paths. */
function byPathOrder(a: LearningPathDoc, b: LearningPathDoc): number {
  const ao = num(a.order) ?? 999;
  const bo = num(b.order) ?? 999;
  if (ao !== bo) return ao - bo;
  const at = str(a.title) ?? "";
  const bt = str(b.title) ?? "";
  return at < bt ? -1 : at > bt ? 1 : 0;
}

/** All bundle courses that pass the public gate (synced + active). */
async function gatedCourses(): Promise<CourseDoc[]> {
  const map = await getActiveDeployments();
  return [...coursesById.values()].filter((c) => isSynced(map.get(c._id)));
}

// --- Public / catalog queries (gated: synced + active) ---

export async function getAllCourses(): Promise<Course[]> {
  const courses = await gatedCourses();
  return courses.map((c) => projectCourse(c, projectionDeps)).sort(byTitle);
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const doc = coursesBySlug.get(slug);
  if (!doc) return null;
  const map = await getActiveDeployments();
  if (!isSynced(map.get(doc._id))) return null;
  return projectCourse(doc, projectionDeps, { fullLessons: true });
}

export async function getLessonBySlug(
  courseSlug: string,
  lessonSlug: string
): Promise<Lesson | null> {
  const course = coursesBySlug.get(courseSlug);
  if (!course) return null;
  const map = await getActiveDeployments();
  if (!isSynced(map.get(course._id))) return null;
  const lesson = courseLessonDocs(course).find(
    (l) => l.slug?.current === lessonSlug
  );
  return lesson ? projectLesson(lesson) : null;
}

/**
 * Server-authoritative lesson lookup by Sanity `_id` of the course and lesson
 * (the identifiers `/api/lessons/complete` uses). Intentionally UNGATED (no
 * synced/active filter) — the completion gate must grade a lesson independent of
 * catalog visibility, so a deactivated course's lesson still resolves for
 * grading. Bundle-only, uncached (the store read is synchronous).
 */
export async function getLessonByIdForGrading(
  courseId: string,
  lessonId: string
): Promise<Lesson | null> {
  const course = coursesById.get(courseId);
  if (!course) return null;
  const inCourse = courseLessonDocs(course).some((l) => l._id === lessonId);
  if (!inCourse) return null;
  const lesson = lessonsById.get(lessonId);
  return lesson ? projectLesson(lesson) : null;
}

export async function getAllLearningPaths(): Promise<LearningPath[]> {
  const map = await getActiveDeployments();
  const paths = [...pathsById.values()].sort(byPathOrder);
  return paths.map((p) => {
    const memberIds = new Set(pathCourseRefIds(p));
    // Iterate the store (doc order) so member ordering matches GROQ's
    // `*[_type=="course" && _id in ^.courses[]._ref && …]` document order.
    const members = [...coursesById.values()].filter(
      (c) => memberIds.has(c._id) && isSynced(map.get(c._id))
    );
    return projectLearningPath(p, members, projectionDeps);
  });
}

/**
 * Fetch a course by its Sanity `_id`. UNGATED (API routes pass the raw `_id`).
 * `trackCollectionAddress` comes from the full Supabase deployment row via
 * `getDeploymentById` (service-role, uncached) — this is a reward-path read.
 */
export async function getCourseById(id: string): Promise<Course | null> {
  const doc = coursesById.get(id);
  if (!doc) return null;
  const dep = await getDeploymentById(id);
  return projectCourse(doc, projectionDeps, {
    fullLessons: true,
    trackCollectionAddress: dep?.track_collection_address ?? null,
  });
}

export async function getCourseIdBySlug(
  slug: string
): Promise<{ _id: string; xpPerLesson: number } | null> {
  const doc = coursesBySlug.get(slug);
  if (!doc) return null;
  const map = await getActiveDeployments();
  if (!isSynced(map.get(doc._id))) return null;
  return { _id: doc._id, xpPerLesson: num(doc.xpPerLesson) ?? 0 };
}

export async function getCourseLessons(
  courseSlug: string
): Promise<Pick<Lesson, "_id" | "title" | "slug">[]> {
  const doc = coursesBySlug.get(courseSlug);
  if (!doc) return [];
  const map = await getActiveDeployments();
  if (!isSynced(map.get(doc._id))) return [];
  return courseLessonDocs(doc).map(projectLessonSummary);
}

// --- Dashboard & Profile Queries ---

export interface CourseSummary {
  _id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  tags: string[] | null;
  difficulty: string;
  totalLessons: number;
  learningPath: string | null;
}

export async function getCoursesByIds(ids: string[]): Promise<CourseSummary[]> {
  if (ids.length === 0) return [];
  const idSet = new Set(ids);
  const map = await getActiveDeployments();
  return [...coursesById.values()]
    .filter((c) => idSet.has(c._id) && isSynced(map.get(c._id)))
    .map((c) => projectCourseSummary(c, learningPathTitleFor(c._id)));
}

export interface LessonSummary {
  _id: string;
  title: string;
  slug: string;
}

export async function getLessonsByIds(ids: string[]): Promise<LessonSummary[]> {
  if (ids.length === 0) return [];
  const idSet = new Set(ids);
  return [...lessonsById.values()]
    .filter((l) => idSet.has(l._id))
    .map(projectLessonSummary);
}

export interface RecommendedCourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  duration: number;
  thumbnail: string | null;
  /** The on-chain `Course.creator` wallet (issue #478), or null when unset. */
  creator: string | null;
  tags: string[] | null;
  xpReward: number;
  totalLessons: number;
  trackId?: number;
  trackLevel?: number;
  learningPath: string | null;
}

export async function getRecommendedCourses(
  excludeIds: string[]
): Promise<RecommendedCourse[]> {
  const exclude = new Set(excludeIds);
  const map = await getActiveDeployments();
  return [...coursesById.values()]
    .filter((c) => !exclude.has(c._id) && isSynced(map.get(c._id)))
    .map((c) => projectRecommended(c, learningPathTitleFor(c._id)))
    .sort(byTitle);
}

export async function getAllCourseTags(): Promise<
  { _id: string; title: string; tags: string[]; totalLessons: number }[]
> {
  const courses = await gatedCourses();
  return courses
    .filter((c) => Array.isArray(c.tags))
    .map((c) => ({
      _id: c._id,
      title: str(c.title) as string,
      tags: c.tags as string[],
      totalLessons: countCourseLessons(c),
    }));
}

/**
 * Per-lesson skill tags across all gated (synced + active) courses, keyed by
 * lesson id — the per-lesson attribution the profile Skills radar tallies
 * against completed `user_progress.lesson_id` rows (#466 C3). Replaces the old
 * course-tag smear, where a single completed lesson credited ALL of its
 * course's tags equally instead of just the skills it actually taught.
 */
export async function getAllLessonSkills(): Promise<
  { _id: string; skills: string[] }[]
> {
  const courses = await gatedCourses();
  const seen = new Set<string>();
  const out: { _id: string; skills: string[] }[] = [];
  for (const c of courses) {
    for (const lesson of courseLessonDocs(c)) {
      if (seen.has(lesson._id)) continue;
      seen.add(lesson._id);
      out.push({ _id: lesson._id, skills: strArr(lesson.skills) });
    }
  }
  return out;
}

export async function getAllCourseLessonCounts(): Promise<
  { _id: string; totalLessons: number }[]
> {
  const courses = await gatedCourses();
  return courses.map((c) => ({
    _id: c._id,
    totalLessons: countCourseLessons(c),
  }));
}

export interface DeployedAchievement {
  /** Full Sanity _id (e.g. "achievement-first-steps"). */
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Short monospace text for octagonal medal display (e.g. "01", "Rs", "A+"). */
  glyph: string;
  /** Uses the iridescent Solana-themed visual treatment. */
  solTier: boolean;
  category: string;
  /** XP minted alongside the achievement NFT on-chain (0 = no XP). */
  xpReward: number;
  /**
   * Declarative unlock rule (spec §4.10, D9). `null` for a pre-sync/legacy doc —
   * such an achievement never auto-fires (the predicate has nothing to evaluate).
   */
  award: AwardT | null;
}

/**
 * Full achievement definitions for achievements deployed on-chain — those whose
 * Supabase deployment row carries an `achievement_pda`. Only these can be minted.
 */
export async function getDeployedAchievements(): Promise<
  DeployedAchievement[]
> {
  const map = await getActiveDeployments();
  return [...achievementsById.values()]
    .filter((a) => !!map.get(a._id)?.achievement_pda)
    .map(projectAchievement)
    .sort(byName);
}

/**
 * All achievement definitions regardless of on-chain status. Used for unlock
 * checking — Supabase records achievements even before on-chain PDAs deploy.
 */
export async function getAllAchievements(): Promise<DeployedAchievement[]> {
  return [...achievementsById.values()].map(projectAchievement).sort(byName);
}

/* ── Daily Quests ──────────────────────────────────────────────── */

export interface ContentQuest {
  id: string;
  name: string;
  description: string;
  type: "lesson" | "lesson_batch" | "challenge" | "login_streak" | "module";
  icon: string;
  xpReward: number;
  targetValue: number;
  resetType: "daily" | "multi_day";
}

export interface QuestData {
  quests: ContentQuest[];
  challengeLessonIds: string[];
  moduleLessonMap: Array<{ id: string; lessonIds: string[] }>;
}

/**
 * All active quest definitions, challenge lesson ids, and module→lesson mappings.
 * Bundle-only (quests, lessons, courses from the store); the projector reproduces
 * the exact `active == true` filter, code-block lesson detection, and
 * `"<courseId>:<key>"` module map the old single-round-trip GROQ emitted.
 */
export async function getAllQuests(): Promise<QuestData> {
  return projectQuestData(
    [...questsById.values()],
    [...lessonsById.values()],
    [...coursesById.values()]
  );
}

// ---------------------------------------------------------------------------
// Admin queries (server-side only, includes on-chain status fields)
// ---------------------------------------------------------------------------

export interface AdminCourse {
  _id: string;
  title: string;
  slug: string;
  difficulty: string;
  /** `course.creator` (issue #478): the on-chain Course.creator wallet. */
  creatorWallet: string | null;
  xpPerLesson: number | null;
  trackId: number | null;
  trackLevel: number | null;
  prerequisiteCourse: { _id: string; slug: string; title: string } | null;
  creatorRewardXp: number | null;
  minCompletionsForReward: number | null;
  lessonCount: number;
  trackCollectionAddress: string | null;
  onChainStatus: {
    status: string | null;
    coursePda: string | null;
    lastSynced: string | null;
    txSignature: string | null;
  } | null;
  /**
   * True when the Supabase deployment-row read for this course failed (#436 —
   * network/DB outage), as opposed to a genuinely absent row (never deployed,
   * which also reads `onChainStatus: null` but `deploymentReadFailed: false`).
   * Only ever set by {@link getAllCoursesAdminSafe}; {@link getAllCoursesAdmin}
   * throws instead (fail-closed, for mutating callers).
   */
  deploymentReadFailed?: boolean;
}

export interface AdminAchievement {
  _id: string;
  name: string;
  category: string | null;
  xpReward: number | null;
  maxSupply: number | null;
  metadataUri: string | null;
  onChainStatus: {
    status: string | null;
    achievementPda: string | null;
    collectionAddress: string | null;
    lastSynced: string | null;
  } | null;
  /** See {@link AdminCourse.deploymentReadFailed}. */
  deploymentReadFailed?: boolean;
  /**
   * The achievement's declarative unlock rule (#513 WS-C) — lets the admin
   * Content tab optionally surface `award.course`/`award.path` next to the
   * achievement, instead of only its own status. `null` for a pre-sync/legacy
   * doc, same as {@link DeployedAchievement.award}.
   */
  award: AwardT | null;
}

/** Resolve a course's `prerequisiteCourse` ref to its `{_id, slug, title}` summary. */
function prerequisiteSummary(
  doc: CourseDoc
): { _id: string; slug: string; title: string } | null {
  const id = refId(doc.prerequisiteCourse);
  const pre = id ? coursesById.get(id) : undefined;
  if (!pre) return null;
  return { _id: pre._id, slug: pre.slug.current, title: str(pre.title) ?? "" };
}

function toAdminCourse(
  c: CourseDoc,
  dep: OnchainDeploymentRow | null,
  deploymentReadFailed: boolean
): AdminCourse {
  return {
    _id: c._id,
    title: str(c.title) as string,
    slug: c.slug.current,
    difficulty: str(c.difficulty) as string,
    creatorWallet: courseCreatorWallet(c),
    xpPerLesson: num(c.xpPerLesson),
    trackId: num(c.trackId),
    trackLevel: num(c.trackLevel),
    prerequisiteCourse: prerequisiteSummary(c),
    creatorRewardXp: num(c.creatorRewardXp),
    minCompletionsForReward: num(c.minCompletionsForReward),
    lessonCount: countCourseLessons(c),
    trackCollectionAddress: dep?.track_collection_address ?? null,
    onChainStatus: dep
      ? {
          status: dep.status,
          coursePda: dep.course_pda,
          lastSynced: dep.last_synced,
          txSignature: dep.tx_signature,
        }
      : null,
    deploymentReadFailed,
  };
}

/**
 * All courses with on-chain sync fields for the admin dashboard. Bundle content
 * joined per-course with the full Supabase deployment row (`getDeploymentById`,
 * service-role, uncached). The bundle carries only managed docs (no drafts).
 * Fail-closed: a Supabase read failure throws (mutating admin routes — e.g.
 * course sync — should not silently proceed on stale/absent deployment data).
 */
export async function getAllCoursesAdmin(): Promise<AdminCourse[]> {
  const docs = [...coursesById.values()].sort(byField((c) => str(c.title)));
  return Promise.all(
    docs.map(async (c) =>
      toAdminCourse(c, await getDeploymentById(c._id), false)
    )
  );
}

/**
 * Same as {@link getAllCoursesAdmin}, but never throws (#436) — a per-course
 * Supabase read failure degrades that course's `deploymentReadFailed: true`
 * (onChainStatus null) instead of rejecting the whole batch. For the
 * display-only `/api/admin/status` route.
 */
export async function getAllCoursesAdminSafe(): Promise<AdminCourse[]> {
  const docs = [...coursesById.values()].sort(byField((c) => str(c.title)));
  return Promise.all(
    docs.map(async (c) => {
      const { row, failed } = await getDeploymentByIdSafe(c._id);
      return toAdminCourse(c, row, failed);
    })
  );
}

export interface AdminLearningPath {
  _id: string;
  title: string;
  courseIds: string[];
}

/**
 * Learning paths + their current course membership, for the admin panel
 * (issue #323). Bundle-only, uncached (edits reflect on next recompile).
 */
export async function getLearningPathsForAdmin(): Promise<AdminLearningPath[]> {
  return [...pathsById.values()].sort(byPathOrder).map((p) => ({
    _id: p._id,
    title: str(p.title) as string,
    courseIds: pathCourseRefIds(p),
  }));
}

export interface AdminLearningPathCourseRef {
  _id: string;
  title: string;
  slug: string;
}

export interface AdminLearningPathWithRefs extends AdminLearningPath {
  /** `courseIds` resolved to display info, in path order. */
  resolvedCourses: AdminLearningPathCourseRef[];
  /**
   * `courseIds` entries that matched no course in the bundle (#513 WS-C). The
   * plain `courseIds` array from {@link getLearningPathsForAdmin} already
   * includes these — `pathCourseRefIds` only drops malformed ref *objects*,
   * not refs that point at a nonexistent course — so without this the admin
   * Paths view would render them as blanks instead of flagging the break.
   */
  danglingCourseIds: string[];
}

/**
 * {@link getLearningPathsForAdmin}, with each path's course refs resolved
 * against the bundle via {@link resolveRefs} instead of silently dropped. The
 * admin Paths view (#513 WS-C) needs course titles to display, and needs to
 * flag loudly — not drop — any ref a path carries that no longer resolves.
 */
export async function getLearningPathsForAdminWithRefs(): Promise<
  AdminLearningPathWithRefs[]
> {
  const paths = await getLearningPathsForAdmin();
  return paths.map((p) => {
    const { resolved, dangling } = resolveRefs(p.courseIds, coursesById);
    return {
      ...p,
      resolvedCourses: resolved.map((c) => ({
        _id: c._id,
        title: str(c.title) as string,
        slug: c.slug.current,
      })),
      danglingCourseIds: dangling,
    };
  });
}

function toAdminAchievement(
  a: AchievementDoc,
  dep: OnchainDeploymentRow | null,
  deploymentReadFailed: boolean
): AdminAchievement {
  return {
    _id: a._id,
    name: str(a.name) as string,
    category: str(a.category),
    xpReward: num(a.xpReward),
    maxSupply: num(a.maxSupply),
    metadataUri: str(a.metadataUri),
    onChainStatus: dep
      ? {
          status: dep.status,
          achievementPda: dep.achievement_pda,
          collectionAddress: dep.collection_address,
          lastSynced: dep.last_synced,
        }
      : null,
    deploymentReadFailed,
    award: parseAward(a.award),
  };
}

/**
 * All achievements with on-chain sync fields for the admin dashboard. Bundle
 * content joined per-achievement with the full Supabase deployment row.
 * Fail-closed: a Supabase read failure throws (mutating admin routes should
 * not silently proceed on stale/absent deployment data).
 */
export async function getAllAchievementsAdmin(): Promise<AdminAchievement[]> {
  const docs = [...achievementsById.values()].sort(byField((a) => str(a.name)));
  return Promise.all(
    docs.map(async (a) =>
      toAdminAchievement(a, await getDeploymentById(a._id), false)
    )
  );
}

/**
 * Same as {@link getAllAchievementsAdmin}, but never throws (#436) — see
 * {@link getAllCoursesAdminSafe}. For the display-only `/api/admin/status`
 * route.
 */
export async function getAllAchievementsAdminSafe(): Promise<
  AdminAchievement[]
> {
  const docs = [...achievementsById.values()].sort(byField((a) => str(a.name)));
  return Promise.all(
    docs.map(async (a) => {
      const { row, failed } = await getDeploymentByIdSafe(a._id);
      return toAdminAchievement(a, row, failed);
    })
  );
}

// ---------------------------------------------------------------------------
// Instructor (wallet-keyed, read-only) queries — /teach viewer
// ---------------------------------------------------------------------------

export interface InstructorCourseSummary {
  _id: string;
  title: string;
  slug: string;
}

/**
 * Courses whose `creator` wallet (issue #478) matches, for the read-only
 * `/teach` viewer. Deliberately gated ONLY on `status == "synced"` (NOT
 * active) — unlike the public catalog, a creator must still see their own
 * deactivated courses; a course that never synced has no on-chain stats to
 * view.
 */
export async function getInstructorCourses(
  wallet: string
): Promise<InstructorCourseSummary[]> {
  const map = await getActiveDeployments();
  return [...coursesById.values()]
    .filter(
      (c) =>
        courseCreatorWallet(c) === wallet && map.get(c._id)?.status === "synced"
    )
    .map((c) => ({
      _id: c._id,
      title: str(c.title) as string,
      slug: c.slug.current,
    }));
}

/**
 * Whether a wallet is the `creator` of any course (gates the header's "Teach"
 * nav item). Bundle-only.
 */
export async function isInstructorWallet(wallet: string): Promise<boolean> {
  return [...coursesById.values()].some(
    (c) => courseCreatorWallet(c) === wallet
  );
}
