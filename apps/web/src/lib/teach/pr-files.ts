/**
 * Pure helpers for scoping the teacher preview to the courses a PR actually
 * touches (#831): teachers preview THEIR course, not the whole catalogue.
 *
 * Dependency-free so the client and the API route share one implementation
 * (same reasoning as `pr-url.ts` — the ad-hoc duplicate is how the last bug
 * happened).
 */

/**
 * Course directory names touched by a PR, from its changed file paths.
 *
 * Matches `courses/<dir>/...` only: repo-root files (`skills.yaml`), course
 * catalogue files (`courses/README.md` — no trailing slash), and `_`-prefixed
 * dirs (`courses/_template/`) are all ignored.
 */
export function changedCourseDirs(paths: readonly string[]): Set<string> {
  const dirs = new Set<string>();
  for (const p of paths) {
    const m = /^courses\/([^/_][^/]*)\//.exec(p);
    if (m?.[1]) dirs.add(m[1]);
  }
  return dirs;
}

/**
 * Maps touched course dirs to compiled course ids via the dir == slug
 * convention (`courses/_template` is copied to `courses/<your-slug>/`).
 *
 * FAIL OPEN: returns `[]` — meaning "don't filter" — unless every touched dir
 * matched a compiled course. A rename, a deleted course, or a dir that breaks
 * the convention must degrade to showing everything, never to hiding the
 * teacher's course behind a silently-empty filter.
 */
export function changedCourseIds(
  courses: readonly { _id: string; slug: string }[],
  dirs: ReadonlySet<string>
): string[] {
  if (dirs.size === 0) return [];
  const ids: string[] = [];
  for (const dir of dirs) {
    const course = courses.find((c) => c.slug === dir);
    if (!course) return [];
    ids.push(course._id);
  }
  return ids;
}
