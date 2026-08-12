/**
 * Event mode: courses a learner may take with NO wallet at all.
 *
 * ## Why this exists
 *
 * At in-person events learners arrive with a phone and nothing else. The normal
 * path asks them to install a wallet app before they can enrol, which loses most
 * of the room — and the no-install answer (Phantom Connect embedded wallets) is
 * blocked on Phantom Portal approval (#1017).
 *
 * So for a named course, enrolment and lesson completion are recorded in
 * Supabase ONLY. Nothing touches the chain during the event. The learner signs
 * in with Google, works through the course on their phone, and later — at home,
 * with a wallet — links it and the whole course is replayed on-chain, which is
 * what makes the credential mintable.
 *
 * ## What this does NOT relax
 *
 * Completion grading. In `/api/lessons/complete` the graders and the sealed
 * attestation checks run BEFORE the wallet lookup, so the offline branch sits
 * after them and inherits every anti-cheat guarantee. Offline mode changes where
 * a completion is *recorded*, never whether it was *earned*.
 *
 * ## Why a constant and not an env var
 *
 * `NEXT_PUBLIC_*` is inlined at build time, and a Vercel redeploy that reuses the
 * build cache silently keeps the old value — that exact trap cost us a live
 * incident when disabling Phantom. A constant is deterministic: it is on in the
 * build that contains it and off in the build that doesn't, with no dashboard
 * state to disagree with the bundle. Turning it off after the event is a one-line
 * revert, which is also a reviewable record of when it was on.
 *
 * Both the client (enrol button, Mark Complete gating) and the server (the two
 * API routes) read this ONE definition — never a second hardcoded id.
 */

/**
 * Course ids in event mode. Keep this SHORT and delete entries when the event
 * ends: every id here is a course whose progress is unverifiable on-chain until
 * its learners link a wallet.
 */
const OFFLINE_ENROLL_COURSE_IDS: readonly string[] = [
  // Solana Speedrun — Superteam Brasil in-person event, August 2026.
  "course-solana-speedrun",
];

/** Whether this course may be enrolled in and completed without a wallet. */
export function isOfflineEnrollCourse(courseId: string | null | undefined) {
  return !!courseId && OFFLINE_ENROLL_COURSE_IDS.includes(courseId);
}

/** True when any course is in event mode — for admin/debug surfaces. */
export function hasOfflineEnrollCourses(): boolean {
  return OFFLINE_ENROLL_COURSE_IDS.length > 0;
}
