import { sanityClient } from "@/lib/sanity/client";
import {
  COURSES_QUERY,
  COURSES_BY_IDS_QUERY,
  COURSE_BY_SLUG_QUERY,
  TRACKS_QUERY,
} from "@/lib/sanity/queries";
import {
  COURSE_CARDS,
  TRACKS,
  getCourseBySlug as getMockCourseBySlug,
  getLessonById as getMockLessonById,
} from "@/lib/mock-data";
import type { Course, CourseCardData, Track } from "@/types/course";

const hasSanity = !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== "placeholder";

const hasOnChain = !!process.env.NEXT_PUBLIC_PROGRAM_ID &&
  process.env.NEXT_PUBLIC_PROGRAM_ID !== "11111111111111111111111111111111";

/**
 * Returns the courseIds of all active on-chain Course accounts.
 * Returns null when the program is not configured (dev mode).
 */
async function getOnChainActiveCourseIds(): Promise<string[] | null> {
  if (!hasOnChain) return null;
  try {
    const { program } = await import("@/lib/solana/program");
    const accounts = await program.account.course.all();
    return accounts
      .filter((a) => a.account.isActive)
      .map((a) => a.account.courseId as string);
  } catch {
    return null;
  }
}

/**
 * Build a Sanity CDN URL cropped to 16:9 (800×450).
 * If the editor set a hotspot, the crop focuses around it; otherwise center crop.
 */
function buildThumbnailUrl(
  url: string | null | undefined,
  hotspot?: { x?: number; y?: number } | null,
): string {
  if (!url) return "";
  const params = new URLSearchParams({ w: "800", h: "450", fit: "crop", auto: "format" });
  if (hotspot?.x != null && hotspot?.y != null) {
    params.set("crop", "focalpoint");
    params.set("fp-x", String(hotspot.x));
    params.set("fp-y", String(hotspot.y));
  } else {
    params.set("crop", "center");
  }
  return `${url}?${params.toString()}`;
}

/**
 * Compute XP values from on-chain parameters.
 * - totalXP: xpPerLesson × lessonCount (what learner earns from lessons)
 * - bonusXP: 50% of totalXP (finalize_course bonus, auto-calculated by program)
 */
function computeXP(xpPerLesson: number, lessonCount: number): { totalXP: number; bonusXP: number } {
  const totalXP = xpPerLesson * lessonCount;
  const bonusXP = Math.round(totalXP * 0.5);
  return { totalXP, bonusXP };
}

function sanityCourseToCardData(c: Record<string, unknown>): CourseCardData {
  const track = c.track as Record<string, string> | null;
  const instructor = c.instructor as Record<string, string> | null;
  const xpPerLesson = (c.xpPerLesson as number) || 0;
  const lessonCount = (c.lessonCount as number) || (c.totalLessons as number) || 0;
  const { totalXP, bonusXP } = computeXP(xpPerLesson, lessonCount);
  return {
    id: (c._id as string) || "",
    title: (c.title as string) || "",
    slug: (c.slug as string) || "",
    description: (c.description as string) || "",
    thumbnail: buildThumbnailUrl(c.thumbnailUrl as string, c.thumbnailHotspot as { x?: number; y?: number } | null),
    difficulty: (c.difficulty as CourseCardData["difficulty"]) || "beginner",
    trackName: track?.name || "",
    trackColor: track?.color || "#888",
    instructorName: instructor?.name || "",
    instructorAvatar: "",
    totalLessons: (c.totalLessons as number) || lessonCount,
    totalDuration: (c.totalDuration as number) || 0,
    totalXP,
    bonusXP,
    courseId: c.courseId as string | undefined,
    trackSlug: track?.slug as string | undefined,
  };
}

function sanityCourseToFull(c: Record<string, unknown>): Course {
  const track = c.track as Record<string, unknown> | null;
  const instructor = c.instructor as Record<string, unknown> | null;
  const modules = (c.modules as Record<string, unknown>[] | null) || [];
  const xpPerLesson = (c.xpPerLesson as number) || 0;
  const lessonCount = (c.lessonCount as number) || (c.totalLessons as number) || 0;
  const { totalXP, bonusXP } = computeXP(xpPerLesson, lessonCount);

  return {
    id: (c._id as string) || "",
    title: (c.title as string) || "",
    slug: (c.slug as string) || "",
    description: (c.description as string) || "",
    longDescription: (c.longDescription as string) || "",
    thumbnail: buildThumbnailUrl(c.thumbnailUrl as string, c.thumbnailHotspot as { x?: number; y?: number } | null),
    difficulty: (c.difficulty as Course["difficulty"]) || "beginner",
    track: {
      id: track?.slug as string || "",
      name: track?.name as string || "",
      slug: track?.slug as string || "",
      description: "",
      icon: track?.icon as string || "",
      color: track?.color as string || "#888",
      trackId: track?.trackId as number | undefined,
      collectionAddress: track?.collectionAddress as string | undefined,
    },
    instructor: {
      id: instructor?.name as string || "",
      name: instructor?.name as string || "",
      avatar: "",
      bio: instructor?.bio as string || "",
      twitter: instructor?.twitter as string | undefined,
      github: instructor?.github as string | undefined,
    },
    modules: modules.map((m) => {
      const lessons = (m.lessons as Record<string, unknown>[] | null) || [];
      return {
        id: m._id as string || "",
        title: m.title as string || "",
        description: m.description as string || "",
        order: m.order as number || 0,
        lessons: lessons.map((l) => ({
          id: l._id as string || l.slug as string || "",
          title: l.title as string || "",
          slug: l.slug as string || "",
          type: (l.type as "content" | "challenge") || "content",
          duration: l.duration as number || 0,
          order: l.order as number || 0,
          videoUrl: l.videoUrl as string | undefined,
          content: l.markdownContent as string | undefined,
          challenge: l.challenge as Course["modules"][0]["lessons"][0]["challenge"],
        })),
      };
    }),
    totalLessons: (c.totalLessons as number) || lessonCount,
    totalDuration: (c.totalDuration as number) || 0,
    totalXP,
    bonusXP,
    prerequisite: (c.prerequisite as { id: string; title: string } | null) ?? null,
    tags: (c.tags as string[]) || [],
    published: true,
    createdAt: "",
    updatedAt: "",
    courseId: c.courseId as string | undefined,
    xpPerLesson: xpPerLesson || undefined,
    lessonCount: lessonCount || undefined,
    trackId: c.trackId as number | undefined,
    trackLevel: c.trackLevel as number | undefined,
    creator: c.creator as string | undefined,
    creatorRewardXp: c.creatorRewardXp as number | undefined,
    minCompletionsForReward: c.minCompletionsForReward as number | undefined,
    prerequisiteCourseId: c.prerequisiteCourseId as string | undefined,
  };
}

export async function getCourseCards(): Promise<CourseCardData[]> {
  if (!hasSanity) return COURSE_CARDS;
  try {
    // When program is configured, only show courses registered and active on-chain.
    const onChainIds = await getOnChainActiveCourseIds();
    if (onChainIds !== null) {
      if (onChainIds.length === 0) return [];
      const results = await sanityClient.fetch(COURSES_BY_IDS_QUERY, { courseIds: onChainIds });
      if (!results || results.length === 0) return [];
      return results.map(sanityCourseToCardData);
    }
    // No on-chain program configured — show all published Sanity courses.
    const results = await sanityClient.fetch(COURSES_QUERY);
    if (!results || results.length === 0) return [];
    return results.map(sanityCourseToCardData);
  } catch {
    return [];
  }
}

export async function getTracks(): Promise<Track[]> {
  if (!hasSanity) return TRACKS;
  try {
    const results = await sanityClient.fetch(TRACKS_QUERY);
    if (!results || results.length === 0) return [];
    return results.map((t: Record<string, unknown>) => ({
      id: t.slug as string || t._id as string || "",
      name: t.name as string || "",
      slug: t.slug as string || "",
      description: t.description as string || "",
      icon: t.icon as string || "",
      color: t.color as string || "#888",
      trackId: t.trackId as number | undefined,
      collectionAddress: t.collectionAddress as string | undefined,
    }));
  } catch {
    return [];
  }
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  if (!hasSanity) return getMockCourseBySlug(slug) || null;
  try {
    const result = await sanityClient.fetch(COURSE_BY_SLUG_QUERY, { slug });
    if (!result) return null;
    return sanityCourseToFull(result);
  } catch {
    return null;
  }
}

export function getLessonById(courseSlug: string, lessonId: string) {
  return getMockLessonById(courseSlug, lessonId);
}

export async function getLessonByIdAsync(courseSlug: string, lessonId: string) {
  const course = await getCourseBySlug(courseSlug);
  if (!course) return null;
  for (const mod of course.modules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId || l.slug === lessonId);
    if (lesson) return { lesson, module: mod, course };
  }
  return null;
}
