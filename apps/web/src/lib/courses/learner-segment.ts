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
 * Routing to a course that is absent from the bundle or deactivated on-chain
 * sends the /start funnel + landing deep-link to the catalog fallback: the
 * `resolveEntryLessonHref` sync gate keeps that from 404-ing, but the deep-link
 * into flagship lesson 1 goes dead — the regression this table exists to
 * prevent. `entry-course-live.test.ts` runs the real resolver against the real
 * bundle, so an entry that stops resolving is red, not silent.
 *
 * EVENT (2026-08-13): all three segments enter at `course-solana-speedrun`
 * for the Superteam Brasil in-person event — the landing deep-link was sending
 * booth visitors into the BTC-evolution course instead of the speedrun built
 * for the event. Revert to the alpha flagship (or the restored ladder) when
 * the event ends.
 *
 * TODO (public alpha, 2026-08-04): the alpha flagship stand-in
 * (`course-btc-to-sol-evolution`) is not the intended segmentation either. The 5-course "Zero to Deployed" ladder this table used to route
 * across (C1 solana-for-web-devs → C2 rust-for-program-devs → C3
 * building-your-first-solana-program → C4 dapp-and-sdk-with-kit → C5
 * stablecoin-payments) is parked under `_draft/` in academy-courses and is no
 * longer compiled into the bundle, so every previous entry id resolves to
 * nothing. The alpha catalog is two courses with no ladder to differentiate
 * across, which makes a per-segment entry meaningless today. Revisit when
 * track-1 restores: segments 1/3 back to the JS/TS on-ramp, segment 2 back to
 * the "enters here" rung that skips it.
 */
const EVENT_ENTRY_COURSE = "course-solana-speedrun";

export const SEGMENT_ENTRY_COURSE: Record<LearnerSegment, string> = {
  1: EVENT_ENTRY_COURSE,
  2: EVENT_ENTRY_COURSE,
  3: EVENT_ENTRY_COURSE,
};

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
