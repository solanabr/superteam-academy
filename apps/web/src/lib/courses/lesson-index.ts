/**
 * Course/lesson structure helpers (pure — safe to unit test and reuse).
 */

interface CourseLike {
  modules?: { lessons?: { _id: string }[] }[] | null;
}

/**
 * Flatten a course's modules into a single ordered lesson list and return the
 * zero-based DISPLAY index of `lessonId`, or -1 if absent.
 *
 * DISPLAY-ONLY. This is the lesson's position in the authored structure and
 * shifts whenever the course is reordered/retired/inserted. It is NOT the
 * on-chain bitmap position — for anything that touches `lesson_flags`,
 * `complete_lesson`, or `user_progress.lesson_index`, use `getLessonSlot`
 * (lesson-slot.ts), which reads the stable slot lock. Conflating the two was the
 * #741 bug: a restructure remapped the array index while the slot stayed put.
 */
export function findLessonIndex(course: CourseLike, lessonId: string): number {
  const allLessons = (course.modules ?? []).flatMap((m) => m.lessons ?? []);
  return allLessons.findIndex((l) => l._id === lessonId);
}
