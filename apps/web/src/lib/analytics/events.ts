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
const attemptNudgeShownLessons = new Set<string>();
const revealedSolutionLessons = new Set<string>();
const socraticEnteredLessons = new Set<string>();
let onboardingStartedFired = false;

/** Test-only: clears the session-scoped event dedupe state. */
export function resetAnalyticsEventDedupeForTests(): void {
  startedLessons.clear();
  mintedCourses.clear();
  nudgedLessons.clear();
  attemptNudgeShownLessons.clear();
  revealedSolutionLessons.clear();
  socraticEnteredLessons.clear();
  onboardingStartedFired = false;
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
 * `attempt_gate_nudge_shown` — the AI Partner's attempt-gate nudge (#865)
 * surfaced: the learner invoked an AI action before running the tests even
 * once on this challenge. Deduped per lesson per session, so one nudge per
 * challenge is counted however many AI actions the learner tries.
 */
export function trackAttemptGateNudgeShown(ctx: ChallengeEventContext): void {
  if (attemptNudgeShownLessons.has(ctx.lessonId)) return;
  attemptNudgeShownLessons.add(ctx.lessonId);
  trackEvent("attempt_gate_nudge_shown", challengePayload(ctx));
}

// ── Onboarding funnel (E2/E7, LX-A2/LX-F1) ───────────────────
// The /start intake funnel. Payloads carry only closed-set option ids and the
// integer daily goal — never free text (the intake is tap-only). Names and
// shapes match the inventory reserved in README.md (#633).

export type OnboardingStep = 1 | 2 | 3 | 4;

/**
 * `onboarding_started` — the first genuine interaction with /start screen 1
 * (the first tap), never the page view. Session-deduped so it is a clean funnel
 * top even though screen 1 can re-render.
 */
export function trackOnboardingStarted(): void {
  if (onboardingStartedFired) return;
  onboardingStartedFired = true;
  trackEvent("onboarding_started", {});
}

/**
 * `onboarding_step_completed` — one event per screen advanced. `choice` is the
 * closed-set answer id(s): the experience/goal id, the interest-chip id array
 * (or `null` when the optional screen is skipped), or the chosen daily-goal
 * integer.
 */
export function trackOnboardingStepCompleted(
  step: OnboardingStep,
  choice: string | string[] | number | null
): void {
  trackEvent("onboarding_step_completed", { step, choice });
}

/**
 * `onboarding_goal_committed` — the E2 implementation-intention substrate: the
 * learner committed to a daily lesson goal (an existing quest target).
 */
export function trackOnboardingGoalCommitted(dailyGoal: number): void {
  trackEvent("onboarding_goal_committed", { dailyGoal });
}

/**
 * `onboarding_route_accepted` — E7 segment-routing acceptance. `accepted` is
 * true when the learner takes the recommended entry course, false when they
 * override via "Browse all courses". `recommendedCourseId` is the content id
 * the segment routed them to either way.
 */
export function trackOnboardingRouteAccepted(
  accepted: boolean,
  recommendedCourseId: string
): void {
  trackEvent("onboarding_route_accepted", { accepted, recommendedCourseId });
}

/**
 * `onboarding_completed` — the intake finished. Values are the closed-set
 * option ids and the daily-goal integer, never free text.
 */
export function trackOnboardingCompleted(payload: {
  experience: string;
  goal: string;
  dailyGoal: number;
}): void {
  trackEvent("onboarding_completed", payload);
}

/**
 * `solution_revealed` — the learner deliberately opened the reference solution
 * behind the LX-C6 soft-gate (a solution ships in the client payload but is
 * gated behind an explicit, confirmed click). Deduped per lesson per session:
 * one reveal = one event, so the reschedule-into-review side effect and the
 * reveal rate share a stable per-lesson denominator. Never carries the solution
 * text — the payload is the same lean challenge shape as the other lifecycle
 * events. XP is untouched; the reveal is framing + review-scheduling only.
 */
/**
 * One quiz Check press (#836). `correct` is the client-side set-equality
 * verdict (D4 open-book — the server re-grades at completion); every press
 * fires, so retries after a wrong pick are visible as attempt funnels.
 */
export function trackQuizChecked(opts: {
  lessonId: string;
  courseId: string;
  questionId: string;
  correct: boolean;
}): void {
  trackEvent("quiz_checked", opts);
}

export function trackSolutionRevealed(ctx: ChallengeEventContext): void {
  if (revealedSolutionLessons.has(ctx.lessonId)) return;
  revealedSolutionLessons.add(ctx.lessonId);
  trackEvent("solution_revealed", challengePayload(ctx));
}

/**
 * `socratic_mode_entered` — the assist ladder (#864) moved this (learner,
 * lesson) onto the Socratic tier (the lighter, questions-first tutor). The
 * economics doc names Socratic-tier entry rate a tracked metric (§9). Deduped
 * per lesson per session so re-renders and subsequent Socratic turns don't
 * re-fire; the durable per-turn record is the server-side ladder counter.
 */
export function trackSocraticModeEntered(ctx: ChallengeEventContext): void {
  if (socraticEnteredLessons.has(ctx.lessonId)) return;
  socraticEnteredLessons.add(ctx.lessonId);
  trackEvent("socratic_mode_entered", challengePayload(ctx));
}

/**
 * `comprehension_check_answered` — one answer to the comprehension check that
 * gates applying an AI-proposed patch (`components/editor/ai-partner/diff-card.tsx`).
 * THE primary AI harm metric: **first-attempt accuracy** = the share of
 * `attempt: 1` events with `correct: true`. If AI assistance were producing
 * understanding-free copy-paste, this is where it shows up first.
 *
 * Deliberately NOT deduped — every answer is signal. Retries are free and
 * unlimited by design, so later attempts fire too with the running counter,
 * making remediation depth (how many tries to get there) measurable; PostHog
 * filters `attempt = 1` for the headline metric.
 *
 * `attempt` is per CHECK INSTANCE, not per lesson lifetime: the counter is keyed
 * by the check's seal token (one seal per proposed patch), so a fresh proposal
 * restarts at 1. Per-lesson-lifetime numbering would make attempt=1 mean "the
 * first check the learner ever saw in this lesson" and silently drop every
 * later patch out of the first-attempt denominator.
 *
 * `correct` is the SERVER's verdict (/api/ai/partner/verify against the sealed
 * token) — the browser never holds the answer key, so this metric is not
 * client-forgeable. Callers must not fire it for a failed verify round trip: a
 * network error is not a wrong answer.
 */
export function trackComprehensionCheckAnswered(opts: {
  lessonId: string;
  courseId?: string;
  correct: boolean;
  attempt: number;
}): void {
  trackEvent("comprehension_check_answered", {
    lessonId: opts.lessonId,
    correct: opts.correct,
    attempt: opts.attempt,
    ...(opts.courseId ? { courseId: opts.courseId } : {}),
  });
}

/**
 * `propose_accepted` — the learner passed the earned-Accept comprehension check
 * and applied an AI-proposed patch to their editor buffer (#947). Pairs with
 * `comprehension_check_answered`: that one measures whether understanding was
 * demonstrated, this one measures how often a demonstrated-understanding patch
 * actually lands in the code.
 *
 * Deliberately NOT deduped per lesson — a lesson can hold several proposals and
 * each accepted one is a distinct application. Exactly-once per accepted patch
 * is guaranteed by the diff card, which latches after its single Accept.
 */
export function trackProposeAccepted(ctx: ChallengeEventContext): void {
  trackEvent("propose_accepted", challengePayload(ctx));
}

/**
 * `assist_reset_used` — the learner spent their ONE self-serve per-lesson
 * assist reset (#864, P2-5/D-8). Fired only on a server-confirmed reset
 * (`allowed: true`), never on a denied attempt, so it counts real resets.
 */
export function trackAssistResetUsed(ctx: ChallengeEventContext): void {
  trackEvent("assist_reset_used", challengePayload(ctx));
}

/** Closed-set weekday id for the LX-A6 plan — never a free-text day name. */
export type PlanWeekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

/**
 * `next_lesson_plan_committed` — the learner committed the LX-A6 session-end
 * if-then plan ("when's your next lesson?"). Only the closed-set weekday id
 * travels; the exact time and any identity stay out of the payload. v1 is
 * display-only (no notification channel), so this event's effect on return is a
 * pre-registered NULL in the experiment registry — the event is the leading
 * indicator (plan completion) that the null is judged against.
 */
export function trackNextLessonPlanCommitted(opts: { day: PlanWeekday }): void {
  trackEvent("next_lesson_plan_committed", { day: opts.day });
}

/**
 * `review_completed` — every gradable item in a spaced-review session has been
 * graded (LX-B5, #873). Fires ONCE per session: the review surface is a single
 * client component whose `graded` set only grows, so the caller latches on the
 * transition into the all-done state rather than on every subsequent render.
 *
 * `gradable` counts only items with an authored quiz — a due lesson with no
 * quiz renders as a revisit link and can never be "graded", so counting it
 * would make the denominator unreachable and the event would never fire.
 */
export function trackReviewCompleted(opts: {
  gradable: number;
  itemsShown: number;
}): void {
  trackEvent("review_completed", {
    gradable: opts.gradable,
    itemsShown: opts.itemsShown,
  });
}

/** Which target the dashboard Continue card resolved to (#871, LX-B2). */
export type ContinueCardKind = "lesson" | "nextCourse" | "catalog";

/**
 * `continue_card_shown` — the card rendered, with the target it resolved to.
 *
 * Shown is the DENOMINATOR for the click-through rate, so it must fire once per
 * render of the dashboard, not once per session: a learner who returns twice
 * and clicks once is 1/2, not 1/1.
 */
export function trackContinueCardShown(opts: {
  kind: ContinueCardKind;
  courseSlug?: string;
}): void {
  trackEvent("continue_card_shown", {
    kind: opts.kind,
    ...(opts.courseSlug ? { courseSlug: opts.courseSlug } : {}),
  });
}

/** `continue_card_click` — the numerator for the same rate. */
export function trackContinueCardClick(opts: {
  kind: ContinueCardKind;
  courseSlug?: string;
}): void {
  trackEvent("continue_card_click", {
    kind: opts.kind,
    ...(opts.courseSlug ? { courseSlug: opts.courseSlug } : {}),
  });
}

/**
 * `test_out_started` — the learner opened a course's test-out challenge and it
 * loaded (#871, #578). Paired with `test_out_graded` below.
 */
export function trackTestOutStarted(opts: { courseId: string }): void {
  trackEvent("test_out_started", { courseId: opts.courseId });
}

/**
 * `test_out_graded` — one graded submission, with the score behind the verdict.
 *
 * Deliberately does NOT carry a lessons-credited count: the grading response
 * (`PassResult`) returns `correct`/`total`/`next` and no lesson tally, so the
 * size of the skip is not knowable client-side. Reporting it would mean
 * inventing a number. Join to the course's lesson count server-side if the
 * skip size is ever needed.
 */
export function trackTestOutGraded(opts: {
  courseId: string;
  passed: boolean;
  correct: number;
  total: number;
}): void {
  trackEvent("test_out_graded", {
    courseId: opts.courseId,
    passed: opts.passed,
    correct: opts.correct,
    total: opts.total,
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
