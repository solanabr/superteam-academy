import { QuizBlock } from "@superteam-lms/content-schema";
import { discover } from "../loader";
import { registerCheck } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

function checkQuiz(file: string, value: unknown): Diagnostic[] {
  const parsed = QuizBlock.safeParse(
    value && typeof value === "object" && !("type" in value)
      ? { type: "quiz", ...(value as Record<string, unknown>) }
      : value
  );
  if (parsed.success) return [];
  return parsed.error.issues.map((i) =>
    diag(
      "gate-7",
      "error",
      file,
      `quiz ${i.path.filter((p) => p !== "type").join(".") || "block"}: ${i.message}`
    )
  );
}

/**
 * Gate 7 re-reads every quiz — standalone `*.quiz.yaml` and inline `quiz` blocks
 * — straight from disk (via `discover`, NOT the typed model) because the whole
 * point is to surface a quiz that FAILED Gate 1, and a lesson with an invalid
 * quiz never made it into `model.lessons`. For a valid quiz `checkQuiz` is a
 * no-op; for a broken one it emits a quiz-specific message alongside Gate 1's
 * structural error (the duplication is intentional).
 */
export function gate7Check(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];

  for (const doc of discover(model.root)) {
    if (doc.parseError) continue; // parse error already reported by the loader

    if (doc.kind === "quiz") {
      out.push(...checkQuiz(doc.path, doc.data));
      continue;
    }

    if (doc.kind === "lesson") {
      const blocks = (doc.data as { blocks?: unknown[] })?.blocks ?? [];
      for (const b of blocks) {
        if (
          b &&
          typeof b === "object" &&
          (b as { type?: unknown }).type === "quiz"
        ) {
          out.push(...checkQuiz(doc.path, b));
        }
      }
    }
  }

  return out;
}

registerCheck(gate7Check);
