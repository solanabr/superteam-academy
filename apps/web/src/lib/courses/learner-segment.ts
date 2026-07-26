/**
 * Learner segments from the Design A /start intake (launch-experience master
 * spec §3 — LX-A2/LX-A3):
 *
 *   1 — CORE web2 ("I build web apps (JS/TS)")
 *   2 — web3 dev  ("I already ship web3 / smart contracts")
 *   3 — beginner  ("I'm new to programming")
 *
 * This module is the SEAM for #566 (LX-A3 segment state). #566 extends it with
 * the launch routing table (`SEGMENT_ENTRY_COURSE`) and the learner-goal
 * framing (`GoalId` / `GOAL_FRAMING_KEY`); the localStorage/profiles storage
 * lives next door in `lib/onboarding`. This file stays the single source of
 * truth for the segment/goal TYPES and the app-side routing constant.
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

/**
 * Launch routing table (LX-A3): each segment → the content course id it enters
 * after /start. This is an APP-SIDE constant on purpose — the spec rules out
 * path-schema metadata to avoid the two-repo content-staging cycle, so routing
 * changes ship with a code deploy, not a content.lock bump.
 *
 * Grounded in the "Zero to Deployed" flagship path ordering
 * (fundamentals → rust → anchor → building-first-program):
 *
 *   1 — CORE web2 (ships JS/TS, new to Solana) → Solana Fundamentals (path course 1)
 *   2 — web3 dev (already ships on-chain)       → Anchor Framework (skips fundamentals)
 *   3 — beginner (new to programming)           → Solana Fundamentals (most foundational)
 *
 * Segment 3 shares the fundamentals entry until the dedicated JS/TS entry-rung
 * course (LX-D3, P2 fast-follow) exists; when it lands, only this line moves.
 * The acknowledged §3.5 deferral applies: launch segmentation is topic-routing,
 * not guidance-level differentiation.
 */
export const SEGMENT_ENTRY_COURSE: Record<LearnerSegment, string> = {
  1: "course-solana-fundamentals",
  2: "course-anchor-framework",
  3: "course-solana-fundamentals",
};

export function entryCourseForSegment(segment: LearnerSegment): string {
  return SEGMENT_ENTRY_COURSE[segment];
}

/**
 * Learner goal from /start screen 2. Consumed as path-page framing copy
 * (GOAL_FRAMING_KEY) — never as routing or as anything reward-bearing.
 *
 *   job     — land a Solana developer role
 *   build   — ship my own project / startup
 *   explore — understand how Solana works
 */
export type GoalId = "job" | "build" | "explore";

export const GOAL_IDS: readonly GoalId[] = ["job", "build", "explore"] as const;

export function isGoalId(value: unknown): value is GoalId {
  return (
    typeof value === "string" && (GOAL_IDS as readonly string[]).includes(value)
  );
}

/**
 * Path-page framing line per goal (LX-A2: goal→path-page framing copy). Values
 * are i18n keys under the `courses` namespace, resolved by PathsView.
 */
export const GOAL_FRAMING_KEY: Record<GoalId, string> = {
  job: "pathGoalJob",
  build: "pathGoalBuild",
  explore: "pathGoalExplore",
};
