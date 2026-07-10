/**
 * A grader's verdict. `403` = a genuine wrong/absent answer; `503` = we could
 * NOT judge (executor outage, unrecognised type) → degrade CLOSED, never grant.
 */
export type GradeResult = { ok: true } | { ok: false; status: 403 | 503 };

/**
 * A grader is deterministic. It takes a projected block (`unknown` so the
 * GRADERS map can be `satisfies Record<GradedBlockType, Grader>`) and the proof
 * carried in the completion payload, and returns a verdict.
 */
export type Grader<B = unknown> = (
  block: B,
  proof: unknown
) => Promise<GradeResult>;

/** Proof for a `code` block: the learner's submitted source. */
export interface CodeProof {
  code: string;
}

/** Proof for a `quiz` block: questionId → chosen option ids. */
export interface QuizProof {
  selections: Record<string, string[]>;
}
