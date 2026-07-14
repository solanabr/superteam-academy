import { registerCheck } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

export function gate4Check(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];
  const lessonIds = new Set(model.lessons.map((l) => l.id));
  const courseIds = new Set(model.courses.map((c) => c.id));

  for (const c of model.courses) {
    for (const m of c.course.modules) {
      for (const lid of m.lessons) {
        if (!lessonIds.has(lid)) {
          out.push(
            diag(
              "gate-4",
              "error",
              c.file,
              `module "${m.key}" references missing lesson "${lid}"`
            )
          );
        }
      }
    }
    if (
      c.course.prerequisiteCourse &&
      !courseIds.has(c.course.prerequisiteCourse)
    ) {
      out.push(
        diag(
          "gate-4",
          "error",
          c.file,
          `references missing prerequisite course "${c.course.prerequisiteCourse}"`
        )
      );
    }
  }

  for (const p of model.paths) {
    for (const cid of p.path.courses) {
      if (!courseIds.has(cid)) {
        out.push(
          diag(
            "gate-4",
            "error",
            p.file,
            `path references missing course "${cid}"`
          )
        );
      }
    }
  }

  return out;
}

registerCheck(gate4Check);
