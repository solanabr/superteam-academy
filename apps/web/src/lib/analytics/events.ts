import { trackEvent } from "./index";

/**
 * Typed event helpers for the launch analytics pass (LX-F1, #558).
 *
 * Every helper funnels through the `trackEvent` facade (GA4 + PostHog) and
 * keeps payloads lean: content ids and closed-set strings only — never code
 * content, wallet addresses, or any other PII. Identity is handled by
 * `identifyUser` (PostHog identify), not by event payloads.
 *
 * The full event inventory — existing, added here, and reserved — lives in
 * README.md next to this file.
 */

export type ChallengeKind = "js" | "rust" | "buildable";

/** Maps the editor's language/buildType pair onto the analytics challenge kind. */
export function challengeKindFor(
  language: string,
  buildType?: string | null
): ChallengeKind {
  if (language === "rust") {
    return buildType === "buildable" ? "buildable" : "rust";
  }
  return "js";
}

export interface ChallengeEventContext {
  lessonId: string;
  /** Content course id when the surface knows it; omitted from the payload otherwise. */
  courseId?: string;
  challengeKind: ChallengeKind;
}

function challengePayload(ctx: ChallengeEventContext): Record<string, unknown> {
  return {
    lessonId: ctx.lessonId,
    challengeKind: ctx.challengeKind,
    ...(ctx.courseId ? { courseId: ctx.courseId } : {}),
  };
}

// Session-scoped dedupe state, mirroring the celebration full-tier dedupe
// (lib/gamification/celebration.ts): module-level, reset only in tests.
const startedLessons = new Set<string>();
const mintedCourses = new Set<string>();
const nudgedLessons = new Set<string>();

/** Test-only: clears the session-scoped event dedupe state. */
export function resetAnalyticsEventDedupeForTests(): void {
  startedLessons.clear();
  mintedCourses.clear();
  nudgedLessons.clear();
}

/**
 * `challenge_started` — first genuine interaction with a challenge (first
 * keystroke in the editor or first run), never a page view. Deduped per
 * lesson per session, so callers may invoke it from every candidate
 * interaction without double-firing.
 */
export function trackChallengeStarted(ctx: ChallengeEventContext): void {
  if (startedLessons.has(ctx.lessonId)) return;
  startedLessons.add(ctx.lessonId);
  trackEvent("challenge_started", challengePayload(ctx));
}

/** `challenge_run` — one event per execution (Run/Build click), any outcome. */
export function trackChallengeRun(ctx: ChallengeEventContext): void {
  trackEvent("challenge_run", challengePayload(ctx));
}

/**
 * `challenge_failed` — a run whose tests (or build) did not pass.
 * `consecutiveFails` is the running streak of failed runs — the substrate for
 * the encouragement threshold (ENCOURAGEMENT_THRESHOLD) and the LX-C4
 * stuck-nudge follow-up.
 */
export function trackChallengeFailed(
  ctx: ChallengeEventContext,
  consecutiveFails: number
): void {
  trackEvent("challenge_failed", {
    ...challengePayload(ctx),
    consecutiveFails,
  });
}

/**
 * `challenge_solved` — a run where every test (or the build) passed. When the
 * stuck-nudge (LX-C4) had already surfaced for this lesson, `postNudge: true`
 * tags the solve so post-nudge solve rate is a straight partition of solves;
 * the flag is omitted otherwise, keeping the common payload lean.
 */
export function trackChallengeSolved(
  ctx: ChallengeEventContext,
  opts: { postNudge?: boolean } = {}
): void {
  trackEvent("challenge_solved", {
    ...challengePayload(ctx),
    ...(opts.postNudge ? { postNudge: true } : {}),
  });
}

/**
 * `stuck_nudge_shown` — the LX-C4 stuck-nudge (an authored hint offered
 * in-editor after ENCOURAGEMENT_THRESHOLD consecutive failed runs) became
 * visible. Deduped per lesson per session: one exposure = one event, so
 * acceptance and post-nudge solve rates share a stable denominator even though
 * the banner re-renders on every subsequent failed run.
 */
export function trackStuckNudgeShown(
  ctx: ChallengeEventContext,
  consecutiveFails: number
): void {
  if (nudgedLessons.has(ctx.lessonId)) return;
  nudgedLessons.add(ctx.lessonId);
  trackEvent("stuck_nudge_shown", {
    ...challengePayload(ctx),
    consecutiveFails,
  });
}

/**
 * `stuck_nudge_accepted` — the learner revealed an authored hint from the
 * stuck-nudge. `hintIndex` is the zero-based position in the authored-hint
 * list (content ids only, never the hint text — that is authored content, but
 * payloads stay lean and PII-free regardless).
 */
export function trackStuckNudgeAccepted(
  ctx: ChallengeEventContext,
  hintIndex: number
): void {
  trackEvent("stuck_nudge_accepted", {
    ...challengePayload(ctx),
    hintIndex,
  });
}

export type CredentialMintObservationSource = "manual_mint" | "realtime";

/**
 * `credential_minted` — the post-mint-cliff baseline (LX-F1). One mint must
 * produce exactly ONE event even though a mint can be observed twice within
 * moments (the manual mint success in course-completion-mint.tsx and the
 * Supabase Realtime certificates INSERT in use-gamification-events.ts), so
 * this dedupes per course per session — mirroring how `celebrate()` collapses
 * the same two observations into one full-tier celebration.
 */
export function trackCredentialMinted(
  courseId: string,
  source: CredentialMintObservationSource
): void {
  if (mintedCourses.has(courseId)) return;
  mintedCourses.add(courseId);
  trackEvent("credential_minted", { courseId, source });
}
