import { registerCheck } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

/**
 * Gate 4a — achievement award refs must resolve to earnable content.
 *
 * An achievement's `award` rule is its ONLY unlock path. When the rule names a
 * course or path id, that id must resolve against the bundle to something a
 * learner can actually complete — otherwise the achievement is silently minted
 * but permanently un-unlockable, and nothing downstream catches it (the doc is
 * schema-valid, the ref is just dead). This mirrors the runtime consumer,
 * `buildUserState` in lib/gamification/achievements.ts:
 *   - `course-completed` / `lessons-completed-in-course` credit a course only if
 *     it exists (completedCourseIds is keyed by real course ids).
 *   - `path-completed` credits a path only when `path.courseIds.length > 0`
 *     (achievements.ts:164-171) — an empty path is never marked complete, so an
 *     award pointing at one can never fire. Retiring the last course from a path
 *     is exactly how #559 nearly shipped an unearnable achievement.
 *
 * Courses cannot be empty (course schema requires modules.min(1) / lessons.min(1)),
 * so course refs only need existence. Only paths carry the empty-but-present case.
 *
 * The remaining award kinds — lessons-completed, streak, user-number,
 * community-stat, manual — reference no content id and need no resolution here.
 */
export function gate4aCheck(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];
  const courseIds = new Set(model.courses.map((c) => c.id));
  const pathsById = new Map(model.paths.map((p) => [p.path.id, p.path]));

  for (const { file, achievement } of model.achievements) {
    const award = achievement.award;
    switch (award.kind) {
      case "course-completed":
      case "lessons-completed-in-course": {
        if (!courseIds.has(award.course)) {
          out.push(
            diag(
              "gate-4a",
              "error",
              file,
              `achievement "${achievement.id}" award (${award.kind}) references missing course "${award.course}" — it can never be unlocked`
            )
          );
        }
        break;
      }
      case "path-completed": {
        const path = pathsById.get(award.path);
        if (!path) {
          out.push(
            diag(
              "gate-4a",
              "error",
              file,
              `achievement "${achievement.id}" award (path-completed) references missing path "${award.path}" — it can never be unlocked`
            )
          );
        } else if (path.courses.length === 0) {
          out.push(
            diag(
              "gate-4a",
              "error",
              file,
              `achievement "${achievement.id}" award (path-completed) references path "${award.path}", which has no courses — buildUserState only completes a path when courseIds.length > 0, so this achievement can never be unlocked`
            )
          );
        }
        break;
      }
    }
  }

  return out;
}

registerCheck(gate4aCheck);
