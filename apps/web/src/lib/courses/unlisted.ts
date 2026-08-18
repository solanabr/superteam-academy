/**
 * Unlisted courses: reachable by direct link, absent from every listing.
 *
 * "Unlisted" is a LISTING property, not an access gate — the course page,
 * its lessons, enrolment, and completion all keep working for anyone who has
 * the URL. What goes away is discovery: the catalog, the landing course
 * count, the sitemap, and recommendations. That is the distribution model
 * for event/QR-code courses (the Pílula: handed out at the booth, not
 * browsed to), and it is why the landing hero may still deep-link an
 * unlisted course — a deliberate direct link is exactly the channel
 * unlisting preserves.
 *
 * App-side constant on purpose, same reasoning as SEGMENT_ENTRY_COURSE
 * (lib/courses/learner-segment.ts): listing changes ship with a code deploy,
 * not a content.lock bump through the two-repo staging cycle.
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
