import { z } from "zod";
import { blockBase } from "./base";

const unique = <T>(xs: readonly T[]) => new Set(xs).size === xs.length;

/**
 * One draggable line. Correctness is keyed to a stable `id`, never array
 * position — the `lines` array is the SHUFFLED presentation pool (distractors
 * mixed in), and `correctOrder` (below) is the answer keyed by these ids, so an
 * author reordering the pool cannot silently change the solution — the same
 * invariant QuizOption keeps for options.
 */
export const ParsonsLine = z.object({
  id: z.string().min(1),
  /**
   * The line's text. Leading whitespace IS its displayed indentation (the
   * renderer shows indent guides from it, F13) — indentation is presentational
   * in this version; grading is order-only (see grader). Deeper indent-sensitive
   * grading is a deliberate follow-up seam, not shipped here.
   */
  content: z.string().min(1),
  /** A line that does NOT belong in the solution (F13 paired-distractor). */
  distractor: z.boolean().default(false),
  /**
   * Distractor-only: the id of the correct line this one mimics, so the renderer
   * can pair them (F13 "paired-distractor markers"). Presentational; not graded.
   */
  pairedWith: z.string().min(1).optional(),
});

export const ParsonsBlock = z
  .object({
    type: z.literal("parsons"),
    ...blockBase,
    prompt: z.string().min(1),
    lines: z.array(ParsonsLine).min(2),
    /**
     * The correct sequence, as an ordered list of NON-distractor line ids. This
     * is the sole grading key: a submission grades correct iff its arranged ids
     * deep-equal this array (see the server grader). Must be a permutation of
     * exactly the non-distractor lines — every solution line used once, no
     * distractor present.
     */
    correctOrder: z.array(z.string().min(1)).min(1),
    /** Shown after a check, regardless of outcome. Mirrors QuizQuestion. */
    explanation: z.string().min(1).optional(),
  })
  .refine((b) => unique(b.lines.map((l) => l.id)), {
    message: "line ids must be unique within a parsons block",
    path: ["lines"],
  })
  .refine((b) => unique(b.correctOrder), {
    message: "correctOrder must not repeat a line id",
    path: ["correctOrder"],
  })
  .refine(
    (b) => {
      const byId = new Map(b.lines.map((l) => [l.id, l]));
      return b.correctOrder.every((id) => byId.get(id)?.distractor === false);
    },
    {
      message: "every correctOrder id must reference a non-distractor line",
      path: ["correctOrder"],
    }
  )
  .refine(
    (b) => {
      const solution = new Set(
        b.lines.filter((l) => !l.distractor).map((l) => l.id)
      );
      return (
        solution.size === b.correctOrder.length &&
        b.correctOrder.every((id) => solution.has(id))
      );
    },
    {
      message: "correctOrder must list every non-distractor line exactly once",
      path: ["correctOrder"],
    }
  )
  .refine(
    (b) => {
      const nonDistractorIds = new Set(
        b.lines.filter((l) => !l.distractor).map((l) => l.id)
      );
      return b.lines.every(
        (l) =>
          l.pairedWith === undefined ||
          (l.distractor && nonDistractorIds.has(l.pairedWith))
      );
    },
    {
      message:
        "pairedWith is distractor-only and must reference a non-distractor line",
      path: ["lines"],
    }
  );

export type ParsonsBlockT = z.infer<typeof ParsonsBlock>;
