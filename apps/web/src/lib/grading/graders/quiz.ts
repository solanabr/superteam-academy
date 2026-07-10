import type { QuizBlockData, QuizQuestionData } from "@superteam-lms/types";
import type { GradeResult, QuizProof } from "../types";

/** The set of option ids marked correct on a question. */
function correctSet(q: QuizQuestionData): Set<string> {
  return new Set(q.options.filter((o) => o.correct).map((o) => o.id));
}

function isQuizProof(proof: unknown): proof is QuizProof {
  if (!proof || typeof proof !== "object") return false;
  const sel = (proof as { selections?: unknown }).selections;
  if (!sel || typeof sel !== "object") return false;
  return Object.values(sel as Record<string, unknown>).every(
    (v) => Array.isArray(v) && v.every((x) => typeof x === "string")
  );
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

/**
 * Pure, deterministic quiz grader — never returns 503 (no executor). For each
 * question, correctness is SET EQUALITY of the chosen option ids against the
 * correct set (multi-select is a set, per CS-1 QuizBlock). A missing or
 * mismatched selection on any question → 403.
 */
export async function gradeQuiz(
  block: unknown,
  proof: unknown
): Promise<GradeResult> {
  const questions = (block as QuizBlockData | undefined)?.questions;
  if (!Array.isArray(questions)) return { ok: false, status: 503 };
  if (!isQuizProof(proof)) return { ok: false, status: 403 };

  for (const q of questions) {
    const chosen = proof.selections[q.id];
    if (!Array.isArray(chosen)) return { ok: false, status: 403 };
    if (!setsEqual(new Set(chosen), correctSet(q))) {
      return { ok: false, status: 403 };
    }
  }
  return { ok: true };
}
