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
//
// DORMANT until track-1 restores (public alpha, 2026-08-04). C3 is parked under
// `_draft/` in academy-courses, so neither id below is in the compiled bundle
// and the alpha catalog hosts no `deployed-program-card` block at all. The
// constant stays PINNED to C3 on purpose rather than being retargeted or
// emptied:
//   - pinned, both predicates answer `false` for every live course/lesson, so
//     the alpha catalog issues credentials ungated (correct — nothing in it is
//     a graded deploy) and every alpha lesson keeps its AI partner;
//   - the parked C3 id still answers `true`, so if a stale on-chain finalize
//     for C3 reaches a credential path it hits `deploy_required` and is
//     withheld, which is the fail-closed direction;
//   - retargeting it at an alpha course would gate that course's credential on
//     a deploy lesson that does not exist — permanently un-mintable — and would
//     switch AI off on a lesson that is not graded.
// Every credential path is independently fail-closed on a non-bundle course
// (mint route 404s, the webhook returns without issuing, the retry queue
// throws), and `capstone-funnel` reports `dormant` instead of a misleading
// `idle`. Asserted in `__tests__/capstone-gate.test.ts`.

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
