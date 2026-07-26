/**
 * Learner segments from the Design A /start intake (launch-experience master
 * spec §3 — LX-A2/LX-A3):
 *
 *   1 — CORE web2 ("I build web apps (JS/TS)")
 *   2 — web3 dev  ("I already ship web3 / smart contracts")
 *   3 — beginner  ("I'm new to programming")
 *
 * This module is the SEAM for #566 (LX-A3 segment state). It deliberately
 * contains no storage or routing — only the segment type and the per-segment
 * path-page guidance modality (LX-A7). When #566 lands, the stored segment is
 * read by the page and passed down; nothing here changes.
 */

export type LearnerSegment = 1 | 2 | 3;

/**
 * How the path page frames the same sequenced content (S9 expertise-reversal
 * asymmetry — guidance copy/prominence varies, content never does):
 *
 * - `fixed`       — fixed-path emphasis: later courses render locked until the
 *                   previous one completes (segment 3, high guidance).
 * - `guided-skip` — same sequence, but every course stays reachable with a
 *                   visible "skip ahead" hint (segment 1).
 * - `open`        — open access: the order is presented as a recommendation
 *                   only, no locks or skip hints (segment 2).
 */
export type PathGuidanceModality = "fixed" | "guided-skip" | "open";

/**
 * Default when no segment is stored (anonymous visitor, pre-#566): segment 1.
 * Guidance is present (sequenced list + one start-here card) but skip-ahead is
 * visible — S9 says default to guidance when uncertain without punishing
 * experts.
 */
export const DEFAULT_SEGMENT: LearnerSegment = 1;

export const SEGMENT_PATH_MODALITY: Record<
  LearnerSegment,
  PathGuidanceModality
> = {
  1: "guided-skip",
  2: "open",
  3: "fixed",
};
