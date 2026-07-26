import { createHash } from "node:crypto";
import type { Course, QuizQuestionData } from "@superteam-lms/types";

/**
 * Segment-2 "test-out" (launch-experience master spec §3, LX-A5).
 *
 * A learner who already knows a course's material can skip it by passing a
 * short course-level challenge assembled from the course's authored quiz-block
 * retrieval closes (LX-D2 question substrate). Passing batch-completes the
 * course's lessons through the existing per-lesson rails and mints the same
 * retroactive XP the learner would have earned lesson-by-lesson — an OFFER, not
 * a gate, so skipping never costs leaderboard position (I5).
 *
 * This module owns only the pure, deterministic question-selection and grading
 * logic. The on-chain batch completion lives in `lib/lessons/batch-complete.ts`
 * and the HTTP surface in `app/api/courses/test-out/route.ts`.
 */

/**
 * Nominal challenge length (spec: "10-question course challenge"). A course
 * with a smaller authored quiz pool uses its whole pool; the actual count is
 * always reported to the client so the UI never claims 10 when fewer exist.
 */
export const TEST_OUT_QUESTION_COUNT = 10;

/**
 * Fraction of questions that must be correct to pass. The spec fixes the count
 * (10) but not the ratio; 0.8 is the mastery bar (a common test-out standard —
 * you must genuinely know the material to skip it, and there is no reward for
 * gaming it since the XP is exactly what lesson-by-lesson completion grants).
 * Tunable in this one place.
 */
export const TEST_OUT_PASS_RATIO = 0.8;

/**
 * Hard ceiling on the retroactive XP a single test-out may drive, matching the
 * spec acceptance criterion `xpPerLesson × lessonCount ≤ 10000`. A course whose
 * on-chain economics exceed this is refused rather than allowed to mint an
 * absurd retroactive amount through the batch path. Enforced in
 * `batchCompleteCourse`, defined here as the single source of truth.
 */
export const TEST_OUT_MAX_XP = 10_000;

/**
 * A quiz question pulled into a course's test-out pool, tagged with a stable
 * course-unique id. Question `id`s are only unique within their block, so the
 * uid composes lesson id + block key + question id — this is what the client
 * echoes back in its selections and what the server re-grades against.
 */
export interface PooledQuestion {
  uid: string;
  question: QuizQuestionData;
}

/**
 * The client-facing shape of a challenge question: prompt + options with the
 * answer key STRIPPED. `correct`, `feedback`, and `explanation` never leave the
 * server for a test-out (unlike an in-lesson open-book quiz) so the challenge
 * functions as a genuine retrieval attempt; grading re-runs server-side against
 * the full bundle regardless.
 */
export interface TestOutQuestion {
  id: string;
  prompt: string;
  multiSelect: boolean;
  options: { id: string; label: string }[];
}

/** `{ [questionUid]: chosenOptionId[] }` — the learner's whole submission. */
export type TestOutSelections = Record<string, string[]>;

export interface TestOutGrade {
  total: number;
  correct: number;
  /** Minimum correct answers needed to pass (`ceil(total × ratio)`). */
  required: number;
  passed: boolean;
}

/** The set of option ids marked correct on a question. */
function correctSet(q: QuizQuestionData): Set<string> {
  return new Set(q.options.filter((o) => o.correct).map((o) => o.id));
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

/**
 * All quiz-block questions across a course's lessons, in module→lesson→block
 * order, each tagged with its course-unique uid.
 */
export function gatherCourseQuizQuestions(course: Course): PooledQuestion[] {
  const pool: PooledQuestion[] = [];
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      for (const block of lesson.blocks) {
        if (block._type !== "quiz") continue;
        for (const question of block.questions) {
          pool.push({
            uid: `${lesson._id}::${block.key}::${question.id}`,
            question,
          });
        }
      }
    }
  }
  return pool;
}

/** Deterministic 32-bit PRNG (mulberry32) — stable across processes/deploys. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A stable seed for a (user, course) pair. Deriving the shown set deterministically
 * — rather than persisting it — means the GET (fetch questions) and POST (grade)
 * halves independently agree on the exact same set without any stored state, and
 * a learner cannot cherry-pick which questions to submit: the server re-derives
 * the authoritative set and grades those, ignoring any extraneous ids.
 */
function seedFor(userId: string, courseId: string): number {
  const digest = createHash("sha256").update(`${userId}:${courseId}`).digest();
  return digest.readUInt32BE(0);
}

/**
 * The authoritative test-out question set for a (user, course): a deterministic
 * seeded shuffle of the course's quiz pool, truncated to {@link TEST_OUT_QUESTION_COUNT}
 * (or the whole pool if smaller). Returns `[]` for a course with no quiz pool —
 * such a course has no test-out.
 */
export function selectTestOutQuestions(
  course: Course,
  userId: string
): PooledQuestion[] {
  const pool = gatherCourseQuizQuestions(course);
  if (pool.length === 0) return [];
  const rand = mulberry32(seedFor(userId, course._id));
  // Fisher-Yates over a copy — the pool order (content order) is never mutated.
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const a = shuffled[i];
    const b = shuffled[j];
    // i and j are always in range; the guard only satisfies the index checker.
    if (a !== undefined && b !== undefined) {
      shuffled[i] = b;
      shuffled[j] = a;
    }
  }
  return shuffled.slice(0, TEST_OUT_QUESTION_COUNT);
}

/** Strip the answer key from a pooled question for transport to the client. */
export function toPublicQuestion(p: PooledQuestion): TestOutQuestion {
  return {
    id: p.uid,
    prompt: p.question.prompt,
    multiSelect: p.question.multiSelect ?? false,
    options: p.question.options.map((o) => ({ id: o.id, label: o.label })),
  };
}

/**
 * Server-authoritative grade of a test-out submission against the deterministic
 * question set. Per-question correctness is SET EQUALITY of the chosen option
 * ids vs the question's correct set (identical to the in-lesson quiz grader);
 * a missing or malformed selection simply scores that question wrong. The
 * client's own verdict is never consulted.
 */
export function gradeTestOut(
  selected: PooledQuestion[],
  selections: TestOutSelections
): TestOutGrade {
  const total = selected.length;
  let correct = 0;
  for (const { uid, question } of selected) {
    const chosen = selections[uid];
    if (!Array.isArray(chosen)) continue;
    if (setsEqual(new Set(chosen), correctSet(question))) correct++;
  }
  const required = Math.ceil(total * TEST_OUT_PASS_RATIO);
  return { total, correct, required, passed: total > 0 && correct >= required };
}
