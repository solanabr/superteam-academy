import type { ParsonsBlockData } from "@superteam-lms/types";
import type { GradeResult, ParsonsProof } from "../types";

function isParsonsProof(proof: unknown): proof is ParsonsProof {
  if (!proof || typeof proof !== "object") return false;
  const order = (proof as { order?: unknown }).order;
  return Array.isArray(order) && order.every((x) => typeof x === "string");
}

function sequenceEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((x, i) => x === b[i]);
}

/**
 * Pure, deterministic parsons grader — never returns 503 for a well-formed
 * block (no executor). Correctness is exact SEQUENCE EQUALITY of the learner's
 * arranged line ids against the block's `correctOrder`. Because `correctOrder`
 * lists exactly the non-distractor lines (CS-1 schema refinement), any wrong
 * order, an included distractor, a missing line, or a length mismatch is a
 * plain inequality → 403. A block missing its `correctOrder` array is the only
 * unjudgeable case → 503.
 */
export async function gradeParsons(
  block: unknown,
  proof: unknown
): Promise<GradeResult> {
  const correctOrder = (block as ParsonsBlockData | undefined)?.correctOrder;
  if (!Array.isArray(correctOrder)) return { ok: false, status: 503 };
  if (!isParsonsProof(proof)) return { ok: false, status: 403 };
  return sequenceEqual(proof.order, correctOrder)
    ? { ok: true }
    : { ok: false, status: 403 };
}
