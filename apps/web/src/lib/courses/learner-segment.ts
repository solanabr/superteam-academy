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
 * Grounded in the new 5-course "Zero to Deployed" ladder (courses-academy
 * CATALOG.md §2, one sequential path — trackId 1, trackLevel 1→5):
 *
 *   C1 solana-for-web-devs → C2 rust-for-program-devs →
 *   C3 building-your-first-solana-program → C4 dapp-and-sdk-with-kit →
 *   C5 stablecoin-agentic-payments
 *
 * The previous entries (solana-fundamentals, anchor-framework) are RETIRED
 * (CATALOG §3) and deactivated on-chain. Routing to a deactivated course sends
 * the /start funnel + landing deep-link to the catalog fallback: the
 * `resolveEntryLessonHref` sync gate keeps that from 404-ing, but the deep-link
 * into flagship lesson 1 goes dead — the regression this table fixes.
 *
 *   1 — CORE web2 (ships JS/TS, new to Solana) → C1 solana-for-web-devs (†)
 *   2 — web3 dev (already ships on-chain)       → C3 building-your-first-solana-program (segment 2 "enters here", skips the on-ramp)
 *   3 — beginner (new to programming)           → C1 solana-for-web-devs (†) (shares segment 1's entry)
 *
 * (†) FLIPPED 2026-07-30 (#599/#673): segments 1 and 3 now enter at C1
 * `course-solana-for-web-devs`, the JS/TS on-ramp. C1 is authored, in the
 * committed bundle, and live on-chain (created + synced + active), so the
 * placeholder entry at C2 `course-rust-for-program-devs` — which existed only
 * because C1 did not yet exist — is retired. Segment 2 is unchanged: it still
 * "enters here" at C3 and skips the on-ramp.
 */
export const SEGMENT_ENTRY_COURSE: Record<LearnerSegment, string> = {
  1: "course-solana-for-web-devs",
  2: "course-building-first-program",
  3: "course-solana-for-web-devs",
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
