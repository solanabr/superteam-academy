/**
 * Client-side mapping from a failed `/api/lessons/complete` response to the
 * localized error copy (`lesson.*` message keys).
 *
 * The route answers 403 for FOUR distinct causes — a wrong quiz answer, a code
 * submission failing the server suite, a missing reflection attestation, and a
 * missing on-chain enrollment. Before #564 the client guessed from the lesson
 * shape alone and told quiz-failers to "verify enrollment". The route now
 * carries a `reason` discriminator in its 403 bodies; the shape heuristic
 * survives only as a fallback for a body without one (mid-deploy skew).
 */

/** Discriminator carried in the completion route's 403 bodies (#564). */
export type CompletionDenyReason =
  | "quiz_failed"
  | "parsons_failed"
  | "challenge_failed"
  | "reflection_required"
  | "enrollment_missing";

/** Message key within the `lesson` namespace. */
export type CompletionErrorKey =
  | "completionFailedQuiz"
  | "completionFailedParsons"
  | "completionFailedChallenge"
  | "completionFailedReflection"
  | "completionFailedEnrollment"
  | "completionFailedGeneric"
  | "completionRateLimited"
  | "completionInProgress";

interface LessonShape {
  hasCodeBlock: boolean;
  hasQuizBlock: boolean;
}

const REASON_KEYS: Record<CompletionDenyReason, CompletionErrorKey> = {
  quiz_failed: "completionFailedQuiz",
  parsons_failed: "completionFailedParsons",
  challenge_failed: "completionFailedChallenge",
  reflection_required: "completionFailedReflection",
  enrollment_missing: "completionFailedEnrollment",
};

function isDenyReason(reason: string): reason is CompletionDenyReason {
  return reason in REASON_KEYS;
}

export function completionErrorKey(
  status: number,
  reason: string | undefined,
  { hasCodeBlock, hasQuizBlock }: LessonShape
): CompletionErrorKey {
  // A throttle is not a failure, and must not read like one. Without this the
  // 429 fell through to the generic "something went wrong", so a whole cohort
  // sharing one NAT would see an outage and retry — each retry burning another
  // token and extending the window. The in-flight guard (#651) is also a 429
  // but a different situation — a duplicate of a completion already being
  // submitted, clearing in ~30s — so it carries its own reason and copy ("wait
  // a moment"), distinct from the volume-limit "slow down for a while".
  if (status === 429) {
    return reason === "completion_in_progress"
      ? "completionInProgress"
      : "completionRateLimited";
  }

  if (status === 403) {
    if (reason !== undefined && isDenyReason(reason)) {
      return REASON_KEYS[reason];
    }
    // No discriminator (response from a pre-#564 server during a deploy):
    // fall back to the lesson-shape guess, now quiz-aware — a quiz-only
    // lesson's 403 is far more likely a wrong answer than a broken enrollment.
    if (hasCodeBlock) return "completionFailedChallenge";
    if (hasQuizBlock) return "completionFailedQuiz";
    return "completionFailedEnrollment";
  }

  return "completionFailedGeneric";
}
