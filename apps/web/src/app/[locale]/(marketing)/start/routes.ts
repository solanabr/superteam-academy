import { getCourseById, getCourseLessons } from "@/lib/content/queries";
import {
  SEGMENT_ENTRY_COURSE,
  type LearnerSegment,
} from "@/lib/courses/learner-segment";
import type { SegmentRoute } from "./start-client";

const SEGMENTS: LearnerSegment[] = [1, 2, 3];

/**
 * Resolves each segment's entry course (SEGMENT_ENTRY_COURSE) into a concrete
 * post-intake destination. Runs server-side so the client never imports the
 * content bundle.
 *
 * SYNC-GATED (F1): the destination is the entry course's first lesson ONLY when
 * that course is actually deployed+synced — resolved through `getCourseLessons`,
 * which returns `[]` for a course that is absent, unsynced, OR whose deployment
 * read failed (getActiveDeployments yields an empty map on DB error). Every
 * other funnel destination gates the same way (the lesson page → notFound() on
 * an unsynced course), so deep-linking an unsynced entry course would 404 every
 * /start completer. When the entry course can't be deep-linked we fall back to
 * the always-available catalog (`/courses`), never a course/lesson page that
 * would itself 404.
 */
export async function resolveSegmentRoutes(
  locale: string
): Promise<Record<LearnerSegment, SegmentRoute>> {
  const entries = await Promise.all(
    SEGMENTS.map(async (segment) => {
      const courseId = SEGMENT_ENTRY_COURSE[segment];
      const course = await getCourseById(courseId);
      const slug = course?.slug ?? null;
      // Sync gate: [] when absent / unsynced / deployment-read-failed.
      const lessons = slug ? await getCourseLessons(slug) : [];
      const firstLessonSlug = lessons[0]?.slug ?? null;
      const href =
        slug && firstLessonSlug
          ? `/${locale}/courses/${slug}/lessons/${firstLessonSlug}`
          : `/${locale}/courses`;
      return [segment, { courseId, href }] as const;
    })
  );
  return Object.fromEntries(entries) as Record<LearnerSegment, SegmentRoute>;
}
