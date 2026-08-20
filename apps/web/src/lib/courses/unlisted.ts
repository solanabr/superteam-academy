/**
 * TEMPORARY FALLBACK — dies in Part 2 of #1137.
 *
 * Listing visibility now lives on the course document (`unlisted: true`,
 * packages/content-schema/src/course.ts) and is read from the bundle by
 * `isCourseUnlisted` in lib/content/queries.ts. That field lives in the
 * content repo, so the one course hidden this way can only set it once the
 * content PR lands and `content.lock` bumps. Until then this set is the
 * second half of an OR, keeping the course hidden across the gap. At the
 * bump, delete this file and the fallback clause.
 *
 * Do NOT add ids here — hiding a course is a content change.
 *
 * ---
 * Unlisted courses: reachable by direct link, absent from every listing.
 *
 * "Unlisted" is a LISTING property, not an access gate — the course page,
 * its lessons, enrolment, and completion all keep working for anyone who has
 * the URL. What goes away is discovery: the catalog, the landing course
 * count, the sitemap, recommendations, the catalogue filter chips, and path
 * membership. That is the distribution model for event/QR-code courses (the
 * Pílula: handed out at the booth, not browsed to) — a deliberate direct
 * link is exactly the channel unlisting preserves.
 *
 * Admin surfaces must NOT consume this — sync/resync need to see every
 * course (`getAllCoursesIncludingUnlisted` in lib/content/queries.ts), or an
 * unlisted course could never be deployed or repaired again.
 */
export const UNLISTED_COURSE_IDS: ReadonlySet<string> = new Set([
  // Event booth micro-course (academy-courses#37) — QR-code distribution.
  "course-pilula-solana-superteam",
]);

export function isUnlistedCourse(courseId: string): boolean {
  return UNLISTED_COURSE_IDS.has(courseId);
}
