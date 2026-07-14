import type {
  CourseSummary,
  DeployedAchievement,
  LessonSummary,
  RecommendedCourse,
} from "@/lib/content/queries";

/**
 * Browser-side content queries (SP2-B). Pre-flip, client components called the
 * query fns directly and next-sanity ran the GROQ over Sanity's public CDN from
 * the browser. Post-flip the query layer is `server-only` (the bundle store
 * carries lesson solutions), so client components call these fetch wrappers
 * against the public `/api/content/*` routes instead.
 *
 * Fn names, signatures, and return types are IDENTICAL to their server
 * counterparts in `@/lib/content/queries`, so swapping a client component over
 * is an import-line change only. Only summary-safe shapes cross this boundary —
 * there is deliberately NO client-side counterpart for full-`Lesson` reads.
 *
 * Failure semantics match the old direct calls: a non-OK response or network
 * error rejects, and the caller's existing error handling takes over.
 */

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Content request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

function idsParam(ids: string[]): string {
  return encodeURIComponent(ids.join(","));
}

export async function getCoursesByIds(ids: string[]): Promise<CourseSummary[]> {
  if (ids.length === 0) return [];
  const data = await getJson<{ courses: CourseSummary[] }>(
    `/api/content/courses?ids=${idsParam(ids)}`
  );
  return data.courses;
}

export async function getLessonsByIds(ids: string[]): Promise<LessonSummary[]> {
  if (ids.length === 0) return [];
  const data = await getJson<{ lessons: LessonSummary[] }>(
    `/api/content/lessons-summary?ids=${idsParam(ids)}`
  );
  return data.lessons;
}

export async function getRecommendedCourses(
  excludeIds: string[]
): Promise<RecommendedCourse[]> {
  const query = excludeIds.length > 0 ? `?exclude=${idsParam(excludeIds)}` : "";
  const data = await getJson<{ courses: RecommendedCourse[] }>(
    `/api/content/recommended${query}`
  );
  return data.courses;
}

export async function getAllCourseTags(): Promise<
  { _id: string; title: string; tags: string[]; totalLessons: number }[]
> {
  const data = await getJson<{
    tags: {
      _id: string;
      title: string;
      tags: string[];
      totalLessons: number;
    }[];
  }>("/api/content/tags");
  return data.tags;
}

export async function getAllLessonSkills(): Promise<
  { _id: string; skills: string[] }[]
> {
  const data = await getJson<{ skills: { _id: string; skills: string[] }[] }>(
    "/api/content/lesson-skills"
  );
  return data.skills;
}

export async function getAllAchievements(): Promise<DeployedAchievement[]> {
  const data = await getJson<{ achievements: DeployedAchievement[] }>(
    "/api/content/achievements"
  );
  return data.achievements;
}

export async function isInstructorWallet(wallet: string): Promise<boolean> {
  const data = await getJson<{ isInstructor: boolean }>(
    `/api/content/is-instructor?wallet=${encodeURIComponent(wallet)}`
  );
  return data.isInstructor;
}
