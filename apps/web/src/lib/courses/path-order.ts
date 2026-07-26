import { getAllLearningPaths } from "@/lib/content/queries";

/**
 * The course that follows `courseId` in its learning path (LX-A5 onward routing).
 *
 * A learner who tests out of a course should be routed to the next course in the
 * same path — "route the learner onward per the segment flow". Learning paths
 * carry their members in display order (`byPathOrder`), so the next course is the
 * immediate successor within the first path that contains `courseId`. Returns
 * `null` when the course is the last in its path, belongs to no path, or the
 * bundle read fails — the caller then falls back to a neutral destination.
 */
export async function nextCourseAfter(
  courseId: string
): Promise<string | null> {
  const paths = await getAllLearningPaths();
  for (const path of paths) {
    const idx = path.courses.findIndex((c) => c._id === courseId);
    if (idx === -1) continue;
    const next = path.courses[idx + 1];
    return next ? next._id : null;
  }
  return null;
}
