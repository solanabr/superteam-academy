// ---------------------------------------------------------------------------
// Capstone identity — the ONE definition site (#867, unified spec item 33)
// ---------------------------------------------------------------------------
//
// `CAPSTONE_CREDENTIAL` names the graded capstone: the course whose credential
// is deploy-gated (item 14) and the lesson that hosts that graded deploy. Two
// independent systems key off it and MUST NOT be able to drift:
//
//   1. the credential gate — `./capstone-gate` (server-only): withholds the
//      credential until a verified `deployed_programs` row exists for this
//      lesson;
//   2. the AI hard-off — `/api/ai/partner`, `/api/lessons/reflect`, and the
//      lesson client: no AI turn is served on this lesson at all.
//
// (2) exists BECAUSE of (1): the credential attests that the learner shipped
// the program themselves, so it certifies nothing if a tutor could have written
// it. Forking the identity string would silently re-enable AI on the very
// lesson the credential rests on — so both legs import from here.
//
// This module is deliberately NOT `server-only`: the lesson client renders the
// AI-free state from the same constant, and a client-importable definition is
// what keeps that from becoming a second hardcoded id. It holds constants and
// pure predicates only — no I/O, no secrets. The gate's database logic stays in
// `./capstone-gate`, which re-exports these for its existing callers.
//
// SHAPE (single-valued, on purpose): exactly one course mints a deploy-gated
// credential today (C3). The multi-course future (C1/EVM capstones) turns this
// into a lookup — a readonly array of `{ courseId, deployLessonId }`, or a
// content-schema flag on the lesson, with `isCapstoneCourse`/`isCapstoneLesson`
// becoming membership tests. Every consumer already goes through those two
// predicates rather than comparing the constant inline, so that change is local
// to this file. Do NOT pre-build a registry for one entry.

export const CAPSTONE_CREDENTIAL = {
  courseId: "course-building-first-program",
  deployLessonId: "lesson-bfsp-m4-capstone",
} as const;

/** Whether a course's credential is subject to the capstone deploy gate. */
export function isCapstoneCourse(courseId: string): boolean {
  return courseId === CAPSTONE_CREDENTIAL.courseId;
}

/**
 * Whether a lesson is THE graded capstone — the AI hard-off predicate.
 *
 * Takes a lesson `_id` (the same value the deploy panel writes to
 * `deployed_programs.lesson_id`), not a slug: slugs are display-layer and can
 * be re-derived, ids are the on-chain/PDA-stable identity.
 */
export function isCapstoneLesson(lessonId: string): boolean {
  return lessonId === CAPSTONE_CREDENTIAL.deployLessonId;
}

/**
 * The typed reason an AI route refuses on the capstone. Shared so the route's
 * response and the client's copy selection cannot drift, and so the refusal is
 * distinguishable from a rate limit, a spend cap, or an outage — this one is
 * permanent and intended, and the UI must say so honestly rather than showing
 * an error shape.
 */
export const CAPSTONE_AI_OFF_CODE = "capstone_ai_off" as const;
