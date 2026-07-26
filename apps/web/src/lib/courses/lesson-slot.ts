import "server-only";

import { slotsByCourseId } from "@/lib/content/store";

/**
 * Resolve a lesson's permanent on-chain bitmap SLOT from the committed
 * `slots.lock.json` (exposed as `slotsByCourseId`).
 *
 * A slot is "assigned once, never renumbered, never reused" — the whole point of
 * the slot lock is to keep an enrollment's `lesson_flags` bit stable across
 * reorders/retirements. This is therefore the ONLY correct index to send to
 * `complete_lesson`, to test against the enrollment bitmap, or to record as
 * `user_progress.lesson_index`. It is NOT the same as `findLessonIndex` (the
 * lesson's position in the flattened module array), which shifts whenever the
 * course is restructured — using array position was the #741 bug: after a
 * restructure the same lessonId maps to a different bit, silently completing a
 * different (possibly retired) lesson.
 *
 * FAIL-CLOSED: a missing course lock or an unslotted lessonId throws. There is
 * deliberately NO array-index fallback — a wrong slot corrupts on-chain state
 * (double XP, wrong bit set) or bricks a credential, so refusing is the only
 * safe answer. Every deployed course has a slot lock generated at compile time
 * (`pnpm content:slots`); a miss here means a course/bundle mismatch, i.e. a
 * genuine server fault, not a learner error.
 */
export function getLessonSlot(courseId: string, lessonId: string): number {
  const lock = slotsByCourseId.get(courseId);
  if (!lock) {
    throw new Error(`No slot lock for course: ${courseId}`);
  }
  const slot = lock.slots[lessonId];
  if (slot === undefined) {
    throw new Error(
      `Lesson ${lessonId} has no slot in course ${courseId} (retired or unknown)`
    );
  }
  return slot;
}

/**
 * Reverse map slot → lessonId for a course's LIVE lessons only (the `slots` map
 * never contains retired lessons — they move to `retired`). Used to reconstruct
 * `user_progress` from an on-chain bitmap (admin resync): iterate live slots and
 * test each bit, rather than assuming bit position equals array position. A
 * retired slot's set bit has no entry here, so it is correctly ignored.
 *
 * Returns an empty map when the course has no lock, so callers degrade to
 * "nothing to sync" rather than throwing mid-batch.
 */
export function slotToLiveLessonId(courseId: string): Map<number, string> {
  const map = new Map<number, string>();
  const lock = slotsByCourseId.get(courseId);
  if (!lock) return map;
  for (const [lessonId, slot] of Object.entries(lock.slots)) {
    map.set(slot, lessonId);
  }
  return map;
}
