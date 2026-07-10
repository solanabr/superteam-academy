export type PartnerAction = "hint" | "propose" | "ask";

export interface PartnerRequest {
  lessonSlug: string;
  courseSlug: string;
  action: PartnerAction;
  message?: string; // for "ask"
  code: string; // learner's current editor code
  testSummary: string; // "2/3 passing; failing: <names>"
}

export interface HintResponse {
  type: "hint";
  text: string;
}

export interface AnswerResponse {
  type: "answer";
  text: string;
}

// The CLIENT shape of a propose response. `check` no longer carries the
// answer (`correctIndex`/`explanation`) — those are sealed server-side into
// `checkToken` and verified by POST /api/ai/partner/verify, never shipped to
// the browser. See `check-seal.ts` and `SealedCheck` below.
export interface ProposeResponse {
  type: "propose";
  rationale: string;
  proposedCode: string;
  check: {
    question: string;
    options: [string, string, string];
  };
  checkToken: string;
}

export type PartnerResponse = HintResponse | AnswerResponse | ProposeResponse;

/** The comprehension-check answer, sealed into `checkToken` (never sent to the client in the clear). */
export interface SealedCheck {
  correctIndex: 0 | 1 | 2;
  explanation: string;
}

/**
 * Proof that the server saw a submission for a required-but-ungraded block
 * (e.g. openEnded, spec §8). Sealed into a token; NOT a correctness verdict.
 * Bound to lesson+block+user+expiry so a captured token cannot be replayed
 * into another lesson, block, user, or after expiry.
 */
export interface Attestation {
  lessonId: string;
  blockKey: string;
  userId: string;
  /** epoch ms; openAttestation rejects once passed. */
  exp: number;
}

export interface VerifyRequest {
  checkToken: string;
  pickedIndex: 0 | 1 | 2;
}

export interface VerifyResponse {
  correct: boolean;
  explanation: string;
}

/**
 * Max PAID AI assists per (learner, challenge). Single source of truth,
 * imported by both the server budget (`assist-budget.ts`) and the client hook
 * (`use-ai-partner.ts`). Plain constant — this module is not `server-only`.
 */
export const MAX_PAID_ASSISTS = 4;
