import { getCourseLessons, getCourseSlugById } from "@/lib/content/queries";
import { heroEntryCourseFor } from "@/lib/courses/learner-segment";

/**
 * Resolves a content course id into its first-lesson deep-link for `locale`.
 *
 * SYNC-GATED (F1): returns the lesson URL ONLY when the course is present in
 * the content bundle AND deployed+synced — `getCourseLessons` returns `[]` for
 * a course that is absent, unsynced, OR whose deployment read failed
 * (getActiveDeployments yields an empty map on DB error). When the course can't
 * be deep-linked we fall back to the always-available catalog (`/courses`),
 * never a course/lesson page that would itself `notFound()` on an unsynced
 * course. This is the single source of truth for that gate, shared by the
 * landing deep-link (LX-A1) and the /start funnel routes (LX-A2). A `null`
 * course id, the table's "no course fits this visitor", goes to the catalog too.
 */
export async function resolveEntryLessonHref(
  locale: string,
  courseId: string | null
): Promise<string> {
  if (!courseId) return `/${locale}/courses`;
  // Bundle-only slug read (#1050): the old getCourseById here paid a
  // service-role deployment round-trip per landing render for a field this
  // caller discards. The sync gate below (getCourseLessons) is unchanged.
  const slug = getCourseSlugById(courseId);
  const lessons = slug ? await getCourseLessons(slug) : [];
  const firstLessonSlug = lessons[0]?.slug ?? null;
  return slug && firstLessonSlug
    ? `/${locale}/courses/${slug}/lessons/${firstLessonSlug}`
    : `/${locale}/courses`;
}

/**
 * The landing-page CTA target (LX-A1): lesson 1 of this locale's hero course, or
 * the catalog when no course suits an unknown visitor in this language.
 * Sync-gated identically to the funnel routes.
 */
export async function resolveFlagshipLessonHref(
  locale: string
): Promise<string> {
  return resolveEntryLessonHref(locale, heroEntryCourseFor(locale));
}
