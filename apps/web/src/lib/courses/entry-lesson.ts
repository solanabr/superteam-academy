import {
  getCourseById,
  getCourseIdBySlug,
  getCourseLessons,
} from "@/lib/content/queries";
import {
  DEFAULT_SEGMENT,
  SEGMENT_ENTRY_COURSE,
} from "@/lib/courses/learner-segment";

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
 * landing deep-link (LX-A1) and the /start funnel routes (LX-A2).
 */
export async function resolveEntryLessonHref(
  locale: string,
  courseId: string
): Promise<string> {
  const course = await getCourseById(courseId);
  const slug = course?.slug ?? null;
  const lessons = slug ? await getCourseLessons(slug) : [];
  const firstLessonSlug = lessons[0]?.slug ?? null;
  return slug && firstLessonSlug
    ? `/${locale}/courses/${slug}/lessons/${firstLessonSlug}`
    : `/${locale}/courses`;
}

/**
 * The flagship "Zero to Deployed" path's lesson 1 — the landing-page deep-link
 * target (LX-A1). The flagship entry is the DEFAULT_SEGMENT entry course, so an
 * anonymous landing visitor and a /start segment-1 completer converge on the
 * same first lesson. Sync-gated identically to the funnel routes.
 */
export async function resolveFlagshipLessonHref(
  locale: string
): Promise<string> {
  return resolveEntryLessonHref(locale, SEGMENT_ENTRY_COURSE[DEFAULT_SEGMENT]);
}

/** The event booth micro-course (academy-courses#37). */
const HERO_COURSE_SLUG = "pilula-solana-superteam";

/**
 * The landing hero target: the Pílula COURSE page — the booth audience picks
 * a course, they don't get dropped mid-lesson — but only once that course is
 * deployed+synced (`getCourseIdBySlug` is the sync-gated read; the ungated
 * `getCourseById` would happily link a course whose page 404s). Until the
 * admin sync runs, the hero keeps the flagship lesson deep-link.
 */
export async function resolveHeroHref(locale: string): Promise<string> {
  const synced = await getCourseIdBySlug(HERO_COURSE_SLUG);
  return synced
    ? `/${locale}/courses/${HERO_COURSE_SLUG}`
    : resolveFlagshipLessonHref(locale);
}
