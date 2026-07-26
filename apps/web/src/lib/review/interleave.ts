import type { QuizBlockData } from "@superteam-lms/types";
import { REVIEW_INTERLEAVING_PAIRS } from "@superteam-lms/content-schema";

/**
 * One item in a rendered review session (LX-B5). Client-serializable: this is
 * the shape the server `/review` page hands to the client session component.
 *
 * `quiz` is the retrieval-close exercise (the lesson's authored quiz blocks).
 * When empty, the lesson has no inline retrieval-close yet and the item renders
 * as a revisit link, never a Monaco editor (the mobile constraint holds because
 * a review item is only ever a quiz or a link — no challenge editor is embedded).
 */
export interface ReviewSessionItem {
  /** Raw lesson `_id` — the substrate `item_key` (PDA-seed convention). */
  itemKey: string;
  /** Current Leitner box (1/3/7/21 schedule), for the progress affordance. */
  box: number;
  lessonTitle: string;
  courseSlug: string;
  lessonSlug: string;
  /** Lesson skill tags — the interleaving key. */
  skills: string[];
  quiz: QuizBlockData[];
}

/** `"a|b"` with the two slugs sorted, so pair membership is order-independent. */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Confusable-concept interleaving, v1 (LX-B5, pedagogy roadmap #12). Ordering
 * lives ONLY here — inside a review set — never in lesson prose.
 *
 * The input order is soonest-due-first (from `getDueReviewItems`). This is a
 * PERMUTATION-ONLY pass: it pulls a confusable partner (two items whose skills
 * span a {@link REVIEW_INTERLEAVING_PAIRS} pair — PDA vs account-model, CPI vs
 * signers, …) to sit immediately after each item, so the learner discriminates
 * the two back-to-back. When no due items form a confusable pair it is a no-op
 * and due order is preserved exactly. It never adds, drops, or duplicates an
 * item, so the session cap (`REVIEW_SESSION_CAP`) is inherently preserved.
 *
 * Deliberately minimal: the full confusable-set BUILDER (choosing WHICH items
 * enter a set) is Wave 3 — this only orders the set the substrate already made
 * due.
 */
export function interleaveReviewSession(
  items: readonly ReviewSessionItem[],
  pairs: readonly (readonly [string, string])[] = REVIEW_INTERLEAVING_PAIRS
): ReviewSessionItem[] {
  const pairSet = new Set(pairs.map(([a, b]) => pairKey(a, b)));

  const confusable = (x: ReviewSessionItem, y: ReviewSessionItem): boolean =>
    x.skills.some((sx) => y.skills.some((sy) => pairSet.has(pairKey(sx, sy))));

  const remaining = [...items];
  const result: ReviewSessionItem[] = [];
  while (remaining.length > 0) {
    const head = remaining.shift() as ReviewSessionItem;
    result.push(head);
    const partnerIdx = remaining.findIndex((r) => confusable(head, r));
    // 0 → already adjacent; <0 → no partner; >0 → pull it up next to `head`.
    if (partnerIdx > 0) {
      const partner = remaining.splice(partnerIdx, 1)[0];
      if (partner) result.push(partner);
    }
  }
  return result;
}
