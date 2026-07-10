import { MAX_XP_PER_MINT } from "@superteam-lms/content-schema";
import { registerCheck } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

const CEILING = 2 * MAX_XP_PER_MINT; // 10000 — finalize bonus = xp/lesson * count / 2 <= MAX_XP_PER_MINT

export function gate5aCheck(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const c of model.courses) {
    const count = c.course.modules.flatMap((m) => m.lessons).length;
    const product = c.course.xpPerLesson * count;
    if (product > CEILING) {
      out.push(
        diag(
          "gate-5a",
          "error",
          c.file,
          `xpPerLesson (${c.course.xpPerLesson}) × liveLessonCount (${count}) = ${product} > ${CEILING}; finalize_course would revert forever — no learner could ever complete this course (spec §5.2)`
        )
      );
    }
  }
  return out;
}

registerCheck(gate5aCheck);
