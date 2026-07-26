/**
 * Next-incomplete-lesson derivation (LX-B2, issue #551). Pure — no I/O, no
 * schema: everything is computed from data the app already has (enrollments,
 * completed `user_progress` rows, and the content bundle's module→lesson
 * display order).
 */

/** A lesson reference in content-bundle display order. */
export interface OrderedLessonRef {
  _id: string;
  title: string;
  slug: string;
}

/** One enrolled course, with its bundle-ordered lessons. */
export interface ContinueCourseInput {
  courseId: string;
  title: string;
  slug: string;
  /** ISO timestamp of the enrollment row (`enrollments.enrolled_at`). */
  enrolledAt: string | null;
  /**
   * True when the learner already minted this course's credential. Certified
   * courses are never a continue target, but they still count as "enrolled and
   * finished" for the all-complete state.
   */
  certified?: boolean;
  /** Module→lesson display order from the content bundle. */
  lessons: OrderedLessonRef[];
}

/** A completed `user_progress` row (the caller filters on `completed = true`). */
export interface ProgressEntry {
  courseId: string;
  lessonId: string;
  completedAt: string | null;
}

export type ContinueTarget =
  | {
      kind: "lesson";
      courseId: string;
      courseTitle: string;
      courseSlug: string;
      lesson: OrderedLessonRef;
      completedLessons: number;
      totalLessons: number;
    }
  /** Every enrolled course is fully complete — point at the next course. */
  | { kind: "allComplete" };

/**
 * First lesson in bundle order whose `_id` is not in the completed set, or
 * null when the course is fully complete. This is the single rule shared by
 * the dashboard Continue card and the course-detail CTA.
 */
export function findNextIncompleteLesson<T extends { _id: string }>(
  lessons: readonly T[],
  completedLessonIds: ReadonlySet<string>
): T | null {
  return lessons.find((l) => !completedLessonIds.has(l._id)) ?? null;
}

function toEpoch(iso: string | null): number {
  if (!iso) return 0;
  const ts = Date.parse(iso);
  return Number.isNaN(ts) ? 0 : ts;
}

/**
 * Derive the learner's continue target:
 *
 * 1. Rank enrolled courses by last activity — the max of the course's latest
 *    completed-lesson timestamp and its enrollment timestamp (so a freshly
 *    enrolled course with zero progress still ranks by when it was joined).
 * 2. In that order, pick the first non-certified course that still has an
 *    incomplete lesson; the target is its first incomplete lesson in
 *    content-bundle module→lesson order.
 * 3. No such course but at least one enrollment → `allComplete`.
 * 4. No enrollments at all → null (callers keep their existing empty state).
 *
 * Completed counts are measured against the bundle's lesson list, so stale
 * progress rows for removed lessons never inflate the numbers.
 */
export function deriveContinueTarget(
  courses: readonly ContinueCourseInput[],
  progress: readonly ProgressEntry[]
): ContinueTarget | null {
  if (courses.length === 0) return null;

  const completedByCourse = new Map<string, Set<string>>();
  const lastCompletedByCourse = new Map<string, number>();
  for (const row of progress) {
    let set = completedByCourse.get(row.courseId);
    if (!set) {
      set = new Set();
      completedByCourse.set(row.courseId, set);
    }
    set.add(row.lessonId);
    const ts = toEpoch(row.completedAt);
    if (ts > (lastCompletedByCourse.get(row.courseId) ?? 0)) {
      lastCompletedByCourse.set(row.courseId, ts);
    }
  }

  const lastActive = (course: ContinueCourseInput): number =>
    Math.max(
      toEpoch(course.enrolledAt),
      lastCompletedByCourse.get(course.courseId) ?? 0
    );

  // Stable sort: ties keep input order.
  const ranked = [...courses].sort((a, b) => lastActive(b) - lastActive(a));

  const emptySet: ReadonlySet<string> = new Set();
  for (const course of ranked) {
    if (course.certified || course.lessons.length === 0) continue;
    const completed = completedByCourse.get(course.courseId) ?? emptySet;
    const lesson = findNextIncompleteLesson(course.lessons, completed);
    if (lesson) {
      return {
        kind: "lesson",
        courseId: course.courseId,
        courseTitle: course.title,
        courseSlug: course.slug,
        lesson,
        completedLessons: course.lessons.filter((l) => completed.has(l._id))
          .length,
        totalLessons: course.lessons.length,
      };
    }
  }

  return { kind: "allComplete" };
}
