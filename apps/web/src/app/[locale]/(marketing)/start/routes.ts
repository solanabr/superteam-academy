import { resolveEntryLessonHref } from "@/lib/courses/entry-lesson";
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
 * The first-lesson destination is SYNC-GATED (F1) by `resolveEntryLessonHref`:
 * an absent/unsynced/deployment-read-failed entry course falls back to the
 * always-available catalog (`/courses`), never a course/lesson page that would
 * itself `notFound()` and 404 the funnel.
 */
export async function resolveSegmentRoutes(
  locale: string
): Promise<Record<LearnerSegment, SegmentRoute>> {
  const entries = await Promise.all(
    SEGMENTS.map(async (segment) => {
      const courseId = SEGMENT_ENTRY_COURSE[segment];
      const href = await resolveEntryLessonHref(locale, courseId);
      return [segment, { courseId, href }] as const;
    })
  );
  return Object.fromEntries(entries) as Record<LearnerSegment, SegmentRoute>;
}
