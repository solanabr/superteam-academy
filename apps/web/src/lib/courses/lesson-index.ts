/**
 * Course/lesson structure helpers (pure — safe to unit test and reuse).
 */

interface CourseLike {
  modules?: { lessons?: { _id: string }[] }[] | null;
}

/**
 * Flatten a course's modules into a single ordered lesson list and return the
 * zero-based index of `lessonId`, or -1 if absent. This index is the lesson's
 * on-chain bitmap position, so its ordering must match the course structure.
 */
export function findLessonIndex(course: CourseLike, lessonId: string): number {
  const allLessons = (course.modules ?? []).flatMap((m) => m.lessons ?? []);
  return allLessons.findIndex((l) => l._id === lessonId);
}
