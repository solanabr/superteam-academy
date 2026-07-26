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

/**
 * Whether a course is eligible for test-out (LX-A5 server-side scope).
 *
 * The spec frames test-out around the flagship "Zero to Deployed" path (segment
 * 2 skipping foundational path courses), so the offer is scoped to courses that
 * are BOTH live and part of a structured learning path — never a standalone or
 * held/trimmed course (e.g. the held defi module, #711). `getAllLearningPaths`
 * already filters its members through the catalog's synced+active predicate, so
 * a course that appears as a path member here is necessarily live; a
 * deactivated, unsynced, or path-less course is not eligible. This is the single
 * server-side gate — UI-only scoping would be bypassable — and it is not
 * hardcoded to one course id, so the per-module follow-on and a future JS/TS
 * entry-rung course remain in scope automatically.
 */
export async function isCourseTestOutEligible(
  courseId: string
): Promise<boolean> {
  const paths = await getAllLearningPaths();
  return paths.some((path) => path.courses.some((c) => c._id === courseId));
}
