import { sanityFetch } from "./client";
import type { Course, Lesson, LearningPath } from "./types";

// --- GROQ Queries ---

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

const moduleWithLessonsFields = `
  _id,
  title,
  description,
  order,
  lessons[]->{
    _id,
    title,
    "slug": slug.current,
    type,
    language,
    buildType,
    deployable,
    widgets,
    programIdl,
    videoUrl,
    content,
    code,
    tests,
    hints,
    solution,
    order
  } | order(order asc)
`;

// --- Query Functions ---

export async function getAllCourses(): Promise<Course[]> {
  return sanityFetch<Course[]>(
    `*[_type == "course" && onChainStatus.status == "synced"] | order(title asc) {
      ${courseFields},
      "modules": modules[]->{
        _id,
        title,
        description,
        order,
        "lessons": lessons[]->{
          _id,
          title,
          "slug": slug.current,
          type,
          order
        } | order(order asc)
      } | order(order asc)
    }`
  );
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  return sanityFetch<Course | null>(
    `*[_type == "course" && slug.current == $slug && onChainStatus.status == "synced"][0] {
      ${courseFields},
      "modules": modules[]->{
        ${moduleWithLessonsFields}
      } | order(order asc)
    }`,
    { slug }
  );
}

export async function getLessonBySlug(
  courseSlug: string,
  lessonSlug: string
): Promise<Lesson | null> {
  return sanityFetch<Lesson | null>(
    `*[_type == "course" && slug.current == $courseSlug && onChainStatus.status == "synced"][0] {
      "allLessons": modules[]->lessons[]->{
        _id,
        title,
        "slug": slug.current,
        type,
        language,
        buildType,
        deployable,
        widgets,
        programIdl,
        videoUrl,
        content,
        code,
        tests,
        hints,
        solution,
        order
      }
    }.allLessons[slug == $lessonSlug][0]`,
    { courseSlug, lessonSlug }
  );
}

export async function getAllLearningPaths(): Promise<LearningPath[]> {
  return sanityFetch<LearningPath[]>(
    `*[_type == "learningPath"] | order(coalesce(order, 999) asc, title asc) {
      _id,
      title,
      description,
      "slug": slug.current,
      tag,
      order,
      difficulty,
      "courses": *[_type == "course" && _id in ^.courses[]._ref && onChainStatus.status == "synced"] {
        ${courseFields},
        "modules": modules[]->{
          _id,
          title,
          description,
          order,
          "lessons": lessons[]->{
            _id,
            title,
            "slug": slug.current,
            type,
            order
          } | order(order asc)
        } | order(order asc)
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
      "modules": modules[]->{
        ${moduleWithLessonsFields}
      } | order(order asc)
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
  return sanityFetch<{ _id: string; xpPerLesson: number } | null>(
    `*[_type == "course" && slug.current == $slug && onChainStatus.status == "synced"][0] {
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
): Promise<Pick<Lesson, "_id" | "title" | "slug" | "type">[]> {
  return sanityFetch<Pick<Lesson, "_id" | "title" | "slug" | "type">[]>(
    `*[_type == "course" && slug.current == $courseSlug && onChainStatus.status == "synced"][0] {
      "lessons": modules[]->lessons[]-> {
        _id,
        title,
        "slug": slug.current,
        type
      }
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
  return sanityFetch<CourseSummary[]>(
    `*[_type == "course" && _id in $ids && onChainStatus.status == "synced"] {
      _id,
      title,
      "slug": slug.current,
      "thumbnail": thumbnail.asset->url,
      tags,
      difficulty,
      "totalLessons": count(modules[]->lessons[]),
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
  return sanityFetch<RecommendedCourse[]>(
    `*[_type == "course" && !(_id in $excludeIds) && onChainStatus.status == "synced"] | order(title asc) {
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
      "totalLessons": count(modules[]->lessons[]),
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
  return sanityFetch<
    { _id: string; title: string; tags: string[]; totalLessons: number }[]
  >(
    `*[_type == "course" && onChainStatus.status == "synced" && defined(tags)] {
      _id,
      title,
      tags,
      "totalLessons": count(modules[]->lessons[])
    }`
  );
}

/**
 * Fetch total lesson count per course (used for accurate course-completion detection).
 * Returns a map-friendly array of { _id, totalLessons }.
 */
export async function getAllCourseLessonCounts(): Promise<
  { _id: string; totalLessons: number }[]
> {
  return sanityFetch<{ _id: string; totalLessons: number }[]>(
    `*[_type == "course" && onChainStatus.status == "synced"] {
      _id,
      "totalLessons": count(modules[]->lessons[])
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
}

/**
 * Returns full achievement definitions for achievements deployed on-chain.
 * Only achievements with an on-chain PDA are included — these are the only ones
 * that can be minted as NFTs.
 */
export async function getDeployedAchievements(): Promise<
  DeployedAchievement[]
> {
  const raw = await sanityFetch<
    Array<{
      _id: string;
      name: string;
      description: string;
      icon: string;
      glyph: string | null;
      solTier: boolean | null;
      category: string;
      xpReward: number;
    }>
  >(
    `*[_type == "achievement" && defined(onChainStatus.achievementPda)] | order(name asc) {
      _id, name, description, icon, glyph, solTier, category, xpReward
    }`
  );
  return raw.map((a) => ({
    id: a._id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    glyph: a.glyph ?? a._id.slice(-2).toUpperCase(),
    solTier: a.solTier ?? false,
    category: a.category,
    xpReward: a.xpReward ?? 0,
  }));
}

/**
 * Returns all achievement definitions from Sanity regardless of on-chain status.
 * Used for achievement unlock checking — Supabase records achievements even before
 * on-chain PDAs are deployed. On-chain minting is attempted separately and is non-fatal.
 */
export async function getAllAchievements(): Promise<DeployedAchievement[]> {
  const raw = await sanityFetch<
    Array<{
      _id: string;
      name: string;
      description: string;
      icon: string;
      glyph: string | null;
      solTier: boolean | null;
      category: string;
      xpReward: number;
    }>
  >(
    `*[_type == "achievement"] | order(name asc) {
      _id, name, description, icon, glyph, solTier, category, xpReward
    }`
  );
  return raw.map((a) => ({
    id: a._id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    glyph: a.glyph ?? a._id.slice(-2).toUpperCase(),
    solTier: a.solTier ?? false,
    category: a.category,
    xpReward: a.xpReward ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Admin queries (server-side only, includes on-chain status fields)
// ---------------------------------------------------------------------------

export interface AdminCourse {
  _id: string;
  title: string;
  slug: string;
  difficulty: string;
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
      "lessonCount": count(modules[]->lessons[]),
      "trackCollectionAddress": onChainStatus.trackCollectionAddress,
      onChainStatus
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
