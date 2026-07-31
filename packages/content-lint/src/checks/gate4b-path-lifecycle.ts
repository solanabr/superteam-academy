import { registerCheck } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

/**
 * Gate 4b — path lifecycle flags must say what an empty shelf means (#627,
 * owner ruling 2026-07-28).
 *
 * The app hides a path with zero courses and reads neither `draft` nor
 * `retired` (the bundle's LearningPath type carries neither field). So an
 * emptied path is invisible either way, and the flags exist purely to record
 * intent. Before this gate, "retired" was spelled `draft: true` + `courses: []`
 * — indistinguishable from "coming soon", which is how #559 nearly shipped a
 * permanently unearnable `path-completed` achievement: the path looked merely
 * unfinished, so nothing flagged that its last course had been removed for good.
 *
 * Rules:
 *  1. `draft: true` + empty `courses` is an ERROR unless `retired: true`.
 *     "Coming soon" means courses are on the way; if they are not, the path is
 *     retired and must say so. (Gate 4a then treats it as un-completable for
 *     achievement award refs.)
 *  2. `retired: true` with a non-empty `courses` is an ERROR — retirement is
 *     defined as permanently emptied; a retired shelf that still lists courses
 *     would render in the catalog and contradict its own flag.
 *  3. `draft: true` + `retired: true` is a WARNING: retirement already implies
 *     hidden-and-not-coming-back, so `draft` is redundant noise. The schema
 *     accepts either flag alone for an empty path, so drop `draft`.
 *
 * Un-retiring is allowed: clear `retired` and add courses in the same change.
 * Path ids are permanent once live, which is why retired paths stay in the repo
 * rather than being deleted.
 */
export function gate4bCheck(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];

  for (const { file, path } of model.paths) {
    const empty = path.courses.length === 0;

    if (path.retired && !empty) {
      out.push(
        diag(
          "gate-4b",
          "error",
          file,
          `path "${path.id}" is retired: true but still lists ${path.courses.length} course(s) — a retired path is permanently emptied. Remove the courses, or drop retired: true to bring the shelf back.`
        )
      );
    }

    if (empty && path.draft && !path.retired) {
      out.push(
        diag(
          "gate-4b",
          "error",
          file,
          `path "${path.id}" has no courses and is draft: true — implicit retirement is no longer allowed. Set retired: true if the shelf is permanently emptied (its id is preserved), or add the courses it is drafting.`
        )
      );
    }

    if (path.draft && path.retired) {
      out.push(
        diag(
          "gate-4b",
          "warning",
          file,
          `path "${path.id}" sets both draft: true and retired: true — retired already hides the shelf permanently. Drop draft: true.`
        )
      );
    }
  }

  return out;
}

registerCheck(gate4bCheck);
