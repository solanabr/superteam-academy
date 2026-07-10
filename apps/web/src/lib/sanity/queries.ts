import type { QueryParams } from "next-sanity";
import type { AwardT } from "@superteam-lms/content-schema";
import { Award } from "@superteam-lms/content-schema";
import { sanityFetch } from "./client";
import type { Course, Lesson, LearningPath } from "./types";

// --- GROQ Queries ---

// Authoring-workflow gate for PUBLIC/catalog queries (issue #263). A course is
// only publicly visible once an admin has approved it. LENIENT on purpose:
// legacy course docs predate the `authoringStatus` field, so `!defined(...)`
// admits them — a bare `== "approved"` would hide the entire live catalog until
// the backfill runs. Combine with the existing on-chain "synced" gate. This is
// applied ONLY to public queries; admin/Studio queries must keep seeing drafts.
const publicAuthoringGate = `(authoringStatus == "approved" || !defined(authoringStatus))`;

// A course drops out of EVERY public surface the moment an admin deactivates it
// (issue #321). The deactivate/reactivate routes mirror the on-chain is_active
// flag into `onChainStatus.isActive`; legacy course docs predate the field, so
// `coalesce(..., true)` keeps them visible. Combined into the shared synced gate
// so catalog, detail, lesson, and dashboard reads all hide inactive courses
// consistently (same reasoning as the #313 tag rollout).
const activeGate = `coalesce(onChainStatus.isActive, true)`;

// Shared Next.js cache tag for the public course catalog. Public catalog reads
// are tagged with this so an admin action that changes what the catalog should
// show (course sync) can purge them on demand via `revalidateTag(COURSES_CACHE_TAG)`
// instead of waiting for the 1h ISR window.
export const COURSES_CACHE_TAG = "courses";

/**
 * Fetch wrapper for PUBLIC catalog queries. EVERY query gated on
 * `publicAuthoringGate` (i.e. `onChainStatus.status == "synced" && ...`) MUST go
 * through this instead of `sanityFetch` directly, so its cache entry is tagged
 * with COURSES_CACHE_TAG and gets purged as a group by
 * `revalidateTag(COURSES_CACHE_TAG)` when an admin syncs a course. Centralizing
 * the tag here is what keeps a newly-synced course from being visible on some
 * pages but stale/404 on others (issue #312): a gated call site can't silently
 * opt out of revalidation by forgetting to pass the tag.
 */
function catalogFetch<T>(
  query: string,
  params?: QueryParams,
  revalidate = 3600
): Promise<T> {
  return sanityFetch<T>(query, params, revalidate, [COURSES_CACHE_TAG]);
}

const courseFields = `
  _id,
  title,
  "slug": slug.current,
  description,
  difficulty,
  duration,
  "thumbnail": thumbnail.asset->url,
  instructor->{
    name,
    "avatar": avatar.asset->url,
    bio,
    socialLinks
  },
  tags,
  xpReward,
  trackId,
  trackLevel
`;

// One literal lesson projection (spec §10.2). Post-D4 no block holds a secret and
// no block holds a reference, so there is NO per-_type conditional stripping — the
// `code` grader reads `solution`/`tests` from the same public projection everyone
// gets. `block.key` is the array item `_key`. `sanity typegen` types `blocks[]` as
// a discriminated union over `_type`.
const lessonFields = `
  _id,
  title,
  "slug": slug.current,
  blocks[]{
    "key": _key,
    _type,
    produces,
    consumes,
    src,
    url,
    language,
    buildType,
    deployable,
    starter,
    solution,
    tests[]{ id, description, input, expectedOutput },
    hints,
    questions[]{
      id,
      prompt,
      multiSelect,
      options[]{ id, label, correct, feedback },
      explanation
    },
    prompt,
    maxWords,
    amount,
    network,
    idl
  }
`;

// Inline modules (spec §10.1): array position is display order, so no
// `| order(order asc)`; lesson refs are weak, dereferenced with `lessons[]->`.
const moduleWithLessonsFields = `
  key,
  title,
  description,
  "lessons": (lessons[]->{
    ${lessonFields}
  })[defined(_id)]
`;

// --- Query Functions ---

export async function getAllCourses(): Promise<Course[]> {
  return catalogFetch<Course[]>(
    `*[_type == "course" && onChainStatus.status == "synced" && ${activeGate} && ${publicAuthoringGate}] | order(title asc) {
      ${courseFields},
      "modules": modules[]{
        key,
        title,
        description,
        "lessons": (lessons[]->{
          _id,
          title,
          "slug": slug.current
        })[defined(_id)]
      }
    }`
  );
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  return catalogFetch<Course | null>(
    `*[_type == "course" && slug.current == $slug && onChainStatus.status == "synced" && ${activeGate} && ${publicAuthoringGate}][0] {
      ${courseFields},
      "modules": modules[]{
        ${moduleWithLessonsFields}
      }
    }`,
    { slug }
  );
}

export async function getLessonBySlug(
  courseSlug: string,
  lessonSlug: string
): Promise<Lesson | null> {
  // One literal blocks[] projection (spec §10.2). Post-D4 every block is public —
  // the `code` grader reads `solution`/`tests` from this same projection, so
  // there is no per-_type conditional stripping and no separate answer-key query.
  return catalogFetch<Lesson | null>(
    `*[_type == "course" && slug.current == $courseSlug && onChainStatus.status == "synced" && ${activeGate} && ${publicAuthoringGate}][0] {
      "allLessons": (modules[].lessons[]->{
        ${lessonFields}
      })[defined(_id)]
    }.allLessons[slug == $lessonSlug][0]`,
    { courseSlug, lessonSlug }
  );
}

/**
 * Server-authoritative lesson lookup by Sanity `_id` of the course and lesson
 * (the identifiers `/api/lessons/complete` uses). Intentionally UNGATED (no
 * synced/active/authoring filter) — the completion gate must grade a lesson
 * independent of catalog visibility, so a deactivated/unapproved course's lesson
 * still resolves for grading. Post-D4 the projection is the same public
 * `blocks[]` shape every reader gets; there is no secret to withhold.
 * revalidate=0: always fresh, never via the public Sanity CDN.
 */
export async function getLessonByIdForGrading(
  courseId: string,
  lessonId: string
): Promise<Lesson | null> {
  return sanityFetch<Lesson | null>(
    `*[_type == "course" && _id == $courseId][0] {
      "allLessons": (modules[].lessons[]->{
        ${lessonFields}
      })[defined(_id)]
    }.allLessons[_id == $lessonId][0]`,
    { courseId, lessonId },
    0
  );
}

export async function getAllLearningPaths(): Promise<LearningPath[]> {
  return catalogFetch<LearningPath[]>(
    `*[_type == "learningPath"] | order(coalesce(order, 999) asc, title asc) {
      _id,
      title,
      description,
      "slug": slug.current,
      tag,
      order,
      difficulty,
      "courses": *[_type == "course" && _id in ^.courses[]._ref && onChainStatus.status == "synced" && ${activeGate} && ${publicAuthoringGate}] {
        ${courseFields},
        "modules": modules[]{
          key,
          title,
          description,
          "lessons": (lessons[]->{
            _id,
            title,
            "slug": slug.current
          })[defined(_id)]
        }
      }
    }`
  );
}

/**
 * Fetch a course by its Sanity _id (not slug).
 * Used by API routes where courseId is the Sanity document _id.
 */
export async function getCourseById(id: string): Promise<Course | null> {
  return sanityFetch<Course | null>(
    `*[_type == "course" && _id == $id][0] {
      ${courseFields},
      "trackCollectionAddress": onChainStatus.trackCollectionAddress,
      "modules": modules[]{
        ${moduleWithLessonsFields}
      }
    }`,
    { id }
  );
}

/**
 * Get a course's Sanity _id and xpPerLesson from its slug (lightweight, no content fetched).
 * xpPerLesson is the on-chain uniform XP reward for completing any lesson in this course.
 */
export async function getCourseIdBySlug(
  slug: string
): Promise<{ _id: string; xpPerLesson: number } | null> {
  return catalogFetch<{ _id: string; xpPerLesson: number } | null>(
    `*[_type == "course" && slug.current == $slug && onChainStatus.status == "synced" && ${activeGate} && ${publicAuthoringGate}][0] {
      _id,
      "xpPerLesson": coalesce(xpPerLesson, 0)
    }`,
    { slug }
  );
}

/**
 * Get all lessons for a course (flat list with slugs, used for lesson navigation).
 */
export async function getCourseLessons(
  courseSlug: string
): Promise<Pick<Lesson, "_id" | "title" | "slug">[]> {
  return catalogFetch<Pick<Lesson, "_id" | "title" | "slug">[]>(
    `*[_type == "course" && slug.current == $courseSlug && onChainStatus.status == "synced" && ${activeGate} && ${publicAuthoringGate}][0] {
      // (...)[defined(_id)] drops unresolvable derefs: a stale cache entry or a
      // legacy-shaped course doc must degrade to fewer nav items, never emit
      // nulls that crash every lesson page of the course (issue #405).
      "lessons": (modules[].lessons[]-> {
        _id,
        title,
        "slug": slug.current
      })[defined(_id)]
    }.lessons`,
    { courseSlug }
  );
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

/**
 * Fetch course summaries by their Sanity _id values.
 * Used to resolve course titles/thumbnails for enrolled courses on the dashboard.
 */
export async function getCoursesByIds(ids: string[]): Promise<CourseSummary[]> {
  if (ids.length === 0) return [];
  return catalogFetch<CourseSummary[]>(
    `*[_type == "course" && _id in $ids && onChainStatus.status == "synced" && ${activeGate} && ${publicAuthoringGate}] {
      _id,
      title,
      "slug": slug.current,
      "thumbnail": thumbnail.asset->url,
      tags,
      difficulty,
      "totalLessons": count(modules[].lessons[]),
      "learningPath": *[_type == "learningPath" && references(^._id)][0].title
    }`,
    { ids }
  );
}

export interface LessonSummary {
  _id: string;
  title: string;
  slug: string;
}

/**
 * Fetch lesson summaries by their Sanity _id values.
 * Used to resolve lesson titles/slugs for recent activity on the dashboard.
 */
export async function getLessonsByIds(ids: string[]): Promise<LessonSummary[]> {
  if (ids.length === 0) return [];
  return sanityFetch<LessonSummary[]>(
    `*[_type == "lesson" && _id in $ids] {
      _id,
      title,
      "slug": slug.current
    }`,
    { ids }
  );
}

export interface RecommendedCourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  duration: number;
  thumbnail: string | null;
  instructor: { name: string; avatar: string | null } | null;
  tags: string[] | null;
  xpReward: number;
  totalLessons: number;
  trackId?: number;
  trackLevel?: number;
  learningPath: string | null;
}

/**
 * Fetch courses the user is NOT enrolled in, for the dashboard "Recommended" section.
 * Excludes courses whose _id is in the provided array.
 */
export async function getRecommendedCourses(
  excludeIds: string[]
): Promise<RecommendedCourse[]> {
  return catalogFetch<RecommendedCourse[]>(
    `*[_type == "course" && !(_id in $excludeIds) && onChainStatus.status == "synced" && ${activeGate} && ${publicAuthoringGate}] | order(title asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      difficulty,
      duration,
      "thumbnail": thumbnail.asset->url,
      instructor->{ name, "avatar": avatar.asset->url },
      tags,
      xpReward,
      trackId,
      trackLevel,
      "totalLessons": count(modules[].lessons[]),
      "learningPath": *[_type == "learningPath" && references(^._id)][0].title
    }`,
    { excludeIds }
  );
}

/**
 * Fetch all course tags from Sanity (used for profile skill radar).
 * Returns each course's _id, title, and tags array.
 */
export async function getAllCourseTags(): Promise<
  { _id: string; title: string; tags: string[]; totalLessons: number }[]
> {
  return catalogFetch<
    { _id: string; title: string; tags: string[]; totalLessons: number }[]
  >(
    `*[_type == "course" && onChainStatus.status == "synced" && ${activeGate} && ${publicAuthoringGate} && defined(tags)] {
      _id,
      title,
      tags,
      "totalLessons": count(modules[].lessons[])
    }`
  );
}

export interface ManagedCourseTag {
  _id: string;
  name: string;
}

/**
 * The managed course-tag vocabulary (issue #322). Teachers pick course tags
 * from these values; admins add/remove them. Read fresh (revalidate=0) so a
 * newly-added tag shows up immediately in the teacher form + admin panel.
 */
export async function getManagedCourseTags(): Promise<ManagedCourseTag[]> {
  return sanityFetch<ManagedCourseTag[]>(
    `*[_type == "courseTag" && defined(name)] | order(name asc) { _id, name }`,
    undefined,
    0
  );
}

/**
 * Fetch total lesson count per course (used for accurate course-completion detection).
 * Returns a map-friendly array of { _id, totalLessons }.
 */
export async function getAllCourseLessonCounts(): Promise<
  { _id: string; totalLessons: number }[]
> {
  return catalogFetch<{ _id: string; totalLessons: number }[]>(
    `*[_type == "course" && onChainStatus.status == "synced" && ${activeGate} && ${publicAuthoringGate}] {
      _id,
      "totalLessons": count(modules[].lessons[])
    }`
  );
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
   * Declarative unlock rule (spec §4.10, D9). CS-9 sync writes it from
   * content-schema. `null` for a pre-sync/legacy doc — such an achievement never
   * auto-fires (the declarative predicate has nothing to evaluate).
   */
  award: AwardT | null;
}

/** Raw award projection shape, validated into the CS-1 discriminated union. */
const achievementProjection = `_id, name, description, icon, glyph, solTier, category, xpReward,
      "award": award{ kind, gte, lte, days, course, path, stat }`;

interface RawAchievement {
  _id: string;
  name: string;
  description: string;
  icon: string;
  glyph: string | null;
  solTier: boolean | null;
  category: string;
  xpReward: number;
  award: unknown;
}

/** Validate the projected award against CS-1 `Award`; unparseable → null. */
function parseAward(raw: unknown): AwardT | null {
  const parsed = Award.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function mapAchievement(a: RawAchievement): DeployedAchievement {
  return {
    id: a._id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    glyph: a.glyph ?? a._id.slice(-2).toUpperCase(),
    solTier: a.solTier ?? false,
    category: a.category,
    xpReward: a.xpReward ?? 0,
    award: parseAward(a.award),
  };
}

/**
 * Returns full achievement definitions for achievements deployed on-chain.
 * Only achievements with an on-chain PDA are included — these are the only ones
 * that can be minted as NFTs.
 */
export async function getDeployedAchievements(): Promise<
  DeployedAchievement[]
> {
  const raw = await sanityFetch<RawAchievement[]>(
    `*[_type == "achievement" && defined(onChainStatus.achievementPda)] | order(name asc) {
      ${achievementProjection}
    }`
  );
  return raw.map(mapAchievement);
}

/**
 * Returns all achievement definitions from Sanity regardless of on-chain status.
 * Used for achievement unlock checking — Supabase records achievements even before
 * on-chain PDAs are deployed. On-chain minting is attempted separately and is non-fatal.
 */
export async function getAllAchievements(): Promise<DeployedAchievement[]> {
  const raw = await sanityFetch<RawAchievement[]>(
    `*[_type == "achievement"] | order(name asc) {
      ${achievementProjection}
    }`
  );
  return raw.map(mapAchievement);
}

/* ── Daily Quests ──────────────────────────────────────────────── */

export interface SanityQuest {
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
  quests: SanityQuest[];
  challengeLessonIds: string[];
  moduleLessonMap: Array<{ id: string; lessonIds: string[] }>;
}

/**
 * Fetches all active quest definitions, challenge lesson IDs, and module→lesson
 * mappings in a single Sanity round trip. Used by the /api/quests/daily route.
 */
export async function getAllQuests(): Promise<QuestData> {
  const raw = await sanityFetch<{
    quests: Array<{
      _id: string;
      name: string;
      description: string | null;
      type: string;
      icon: string | null;
      xpReward: number;
      targetValue: number;
      resetType: string;
    }>;
    challengeLessonIds: string[];
    // The flattened `.m[]` can contain a null element for a module-less course.
    moduleLessonMap: Array<{
      _id: string | null;
      lessonIds: (string | null)[];
    } | null>;
  }>(
    `{
      "quests": *[_type == "quest" && active == true && !(_id in path("drafts.**"))] {
        _id, name, description, type, icon, xpReward, targetValue, resetType
      },
      "challengeLessonIds": *[_type == "lesson" && count(blocks[_type == "code"]) > 0]._id,
      "moduleLessonMap": *[_type == "course" && !(_id in path("drafts.**"))]{
        "m": modules[]{
          "_id": ^._id + ":" + key,
          "lessonIds": lessons[]->_id
        }
      }.m[]
    }`
  );

  return {
    quests: (raw.quests ?? []).map((q) => ({
      id: q._id,
      name: q.name,
      description: q.description ?? "",
      type: q.type as SanityQuest["type"],
      icon: q.icon ?? "CircleDashed",
      xpReward: q.xpReward,
      targetValue: q.targetValue,
      resetType: q.resetType as SanityQuest["resetType"],
    })),
    challengeLessonIds: (raw.challengeLessonIds ?? []).filter(
      Boolean
    ) as string[],
    moduleLessonMap: (raw.moduleLessonMap ?? [])
      // Guard the null element a module-less course injects into the flattened
      // `.m[]` (would otherwise throw and 500 /api/quests/daily), plus modules
      // with no resolvable lessons.
      .filter(
        (m): m is { _id: string | null; lessonIds: (string | null)[] } =>
          !!m && !!m.lessonIds && m.lessonIds.length > 0
      )
      .map((m) => ({
        id: m._id ?? "",
        lessonIds: m.lessonIds.filter(Boolean) as string[],
      })),
  };
}

// ---------------------------------------------------------------------------
// Admin queries (server-side only, includes on-chain status fields)
// ---------------------------------------------------------------------------

export interface AdminCourse {
  _id: string;
  title: string;
  slug: string;
  difficulty: string;
  /** Resolved from `course.instructor -> instructor.wallet`: the on-chain Course.creator. */
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
}

/**
 * Fetch all courses with on-chain sync fields for the admin dashboard.
 * Includes drafts — filter by `_id.startsWith("drafts.")` on the client side.
 */
export async function getAllCoursesAdmin(): Promise<AdminCourse[]> {
  return sanityFetch<AdminCourse[]>(
    `*[_type == "course"] | order(title asc) {
      _id,
      title,
      "slug": slug.current,
      difficulty,
      xpPerLesson,
      trackId,
      trackLevel,
      "prerequisiteCourse": prerequisiteCourse->{
        _id,
        title,
        "slug": slug.current
      },
      creatorRewardXp,
      minCompletionsForReward,
      "creatorWallet": instructor->wallet,
      "lessonCount": count(modules[].lessons[]),
      "trackCollectionAddress": onChainStatus.trackCollectionAddress,
      onChainStatus
    }`,
    undefined,
    0
  );
}

export interface AdminLearningPath {
  _id: string;
  title: string;
  courseIds: string[];
}

/**
 * Learning paths + their current course membership, for the admin panel
 * (issue #323). Read fresh (revalidate=0) so edits reflect immediately.
 */
export async function getLearningPathsForAdmin(): Promise<AdminLearningPath[]> {
  return sanityFetch<AdminLearningPath[]>(
    `*[_type == "learningPath"] | order(coalesce(order, 999) asc, title asc) {
      _id,
      title,
      "courseIds": coalesce(courses[]._ref, [])
    }`,
    undefined,
    0
  );
}

export interface PathPickerCourse {
  _id: string;
  title: string;
  slug: string | null;
}

/**
 * Non-draft courses the admin can assign to a learning path (issue #323).
 */
export async function getCoursesForPathPicker(): Promise<PathPickerCourse[]> {
  return sanityFetch<PathPickerCourse[]>(
    `*[_type == "course" && !(_id in path("drafts.**"))] | order(title asc) {
      _id,
      title,
      "slug": slug.current
    }`,
    undefined,
    0
  );
}

/**
 * A course awaiting admin review (issue #268). Minimal metadata for the admin
 * review queue — the admin approves (→ on-chain sync) or rejects (→ draft +
 * feedback) from this list.
 */
export interface PendingReviewCourse {
  _id: string;
  title: string;
  slug: string | null;
  difficulty: string | null;
  author: string | null;
  authoringStatus: string;
}

/**
 * Fetch courses with `authoringStatus == "pending_review"` for the admin review
 * queue. Excludes Sanity drafts. Server-side only (admin panel); reads fresh
 * (revalidate=0) so a just-submitted course appears without CDN lag.
 */
export async function getPendingReviewCourses(): Promise<
  PendingReviewCourse[]
> {
  return sanityFetch<PendingReviewCourse[]>(
    `*[_type == "course" && authoringStatus == "pending_review" && !(_id in path("drafts.**"))] | order(title asc) {
      _id,
      title,
      "slug": slug.current,
      difficulty,
      author,
      authoringStatus
    }`,
    undefined,
    0
  );
}

/**
 * Fetch all achievements with on-chain sync fields for the admin dashboard.
 */
export async function getAllAchievementsAdmin(): Promise<AdminAchievement[]> {
  return sanityFetch<AdminAchievement[]>(
    `*[_type == "achievement"] | order(name asc) {
      _id,
      name,
      category,
      xpReward,
      maxSupply,
      metadataUri,
      onChainStatus
    }`,
    undefined,
    0
  );
}
