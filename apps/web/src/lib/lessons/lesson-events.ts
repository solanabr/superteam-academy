/**
 * The window events that carry a code submission between ChallengeInterface and
 * lesson-client. `blockKey` says which code block the submission belongs to: the
 * server grades each block against `proofs[block.key]`, so a lesson with several
 * code blocks can't complete without it.
 */

/** Passing code that should drive a completion. */
export const LESSON_COMPLETE_EVENT = "superteam:lesson-complete";
/** Passing code to hold on to, without driving a completion. */
export const CHALLENGE_PROOF_EVENT = "superteam:challenge-proof";
/** A submit was refused, by the server or the client gate. */
export const LESSON_COMPLETE_ERROR_EVENT = "superteam:lesson-complete-error";

export interface CodeSubmissionDetail {
  lessonId: string;
  blockKey?: string;
  submittedCode?: string;
}

export interface LessonCompleteErrorDetail {
  lessonId: string;
  /** The one editor this refusal is about. Absent means every editor. */
  blockKey?: string;
  message: string;
}

interface LessonEventDetails {
  [LESSON_COMPLETE_EVENT]: CodeSubmissionDetail;
  [CHALLENGE_PROOF_EVENT]: CodeSubmissionDetail;
  [LESSON_COMPLETE_ERROR_EVENT]: LessonCompleteErrorDetail;
}

export function dispatchLessonEvent<N extends keyof LessonEventDetails>(
  name: N,
  detail: LessonEventDetails[N]
): void {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

/** Subscribes to a lesson event and returns the unsubscribe. */
export function onLessonEvent<N extends keyof LessonEventDetails>(
  name: N,
  handler: (detail: LessonEventDetails[N]) => void
): () => void {
  const listener = (e: Event) =>
    handler((e as CustomEvent<LessonEventDetails[N]>).detail);
  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
}
