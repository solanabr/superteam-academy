/**
 * Catalog filtering — the search box, the difficulty rail and the status rail
 * resolved in one place so the composition rule (AND across every active axis)
 * is testable without mounting the page.
 *
 * "Status" is the signed-in learner's relationship to a course, which the
 * catalog already reads client-side: an `enrollments` row means enrolled, a
 * `completed_at` on that row (written by the on-chain finalize webhook) or a
 * minted certificate means completed. Both completion signals count — a
 * learner holding a credential is finished whether or not the webhook landed.
 */

export type Difficulty = "beginner" | "intermediate" | "advanced";

/** What the card shows. `undefined` = the learner has no relationship. */
export type CourseStatus = "enrolled" | "completed";

/** The status rail's options. `null` is its "All". */
export type StatusFilter = "enrolled" | "not-enrolled" | "completed";

export interface EnrollmentRow {
  course_id: string;
  completed_at: string | null;
}

export interface CatalogCourse {
  _id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
}

/**
 * Course id → status, from the two session-scoped reads the catalog already
 * makes. Courses absent from the map are "not enrolled".
 */
export function buildStatusMap(
  enrollments: readonly EnrollmentRow[],
  certificateCourseIds: readonly string[]
): Map<string, CourseStatus> {
  const statuses = new Map<string, CourseStatus>();
  for (const row of enrollments) {
    statuses.set(row.course_id, row.completed_at ? "completed" : "enrolled");
  }
  for (const courseId of certificateCourseIds) {
    statuses.set(courseId, "completed");
  }
  return statuses;
}

export function matchesStatus(
  status: CourseStatus | undefined,
  filter: StatusFilter | null
): boolean {
  if (!filter) return true;
  if (filter === "not-enrolled") return status === undefined;
  return status === filter;
}

export function matchesSearch(course: CatalogCourse, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    course.title.toLowerCase().includes(q) ||
    course.description.toLowerCase().includes(q)
  );
}

export interface CatalogFilters {
  searchQuery: string;
  difficulty: Difficulty | null;
  status: StatusFilter | null;
}

/** Every active axis must match — the rails compose, they do not replace. */
export function filterCatalogCourses<T extends CatalogCourse>(
  courses: readonly T[],
  filters: CatalogFilters,
  statuses: ReadonlyMap<string, CourseStatus>
): T[] {
  return courses.filter(
    (course) =>
      matchesSearch(course, filters.searchQuery) &&
      (!filters.difficulty || course.difficulty === filters.difficulty) &&
      matchesStatus(statuses.get(course._id), filters.status)
  );
}
