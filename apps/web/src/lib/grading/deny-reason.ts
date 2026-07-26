import type { CompletionDenyReason } from "@/lib/lessons/completion-error";
import type { GradedBlockType } from "./graders";

/**
 * The single source of truth for a graded block's 403 deny reason, keyed by the
 * SAME `GradedBlockType` as GRADERS (#703 item 2b). `satisfies Record<…>` makes
 * a new graded block type a COMPILE error here until its reason is declared —
 * closing the silent fork this replaces: two independent hand-kept ternaries
 * each mapped a block type to a reason and had already diverged, one folding a
 * failed `parsons` into `challenge_failed`. The client maps these strings to
 * localized copy in `completion-error.ts`.
 */
export const DENY_REASONS = {
  code: "challenge_failed",
  quiz: "quiz_failed",
  parsons: "parsons_failed",
} satisfies Record<GradedBlockType, CompletionDenyReason>;

/** The graded subset of CompletionDenyReason — the reasons a grader can emit. */
export type GradedDenyReason = (typeof DENY_REASONS)[GradedBlockType];
