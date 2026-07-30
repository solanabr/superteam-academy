export type PartnerAction = "hint" | "propose" | "ask" | "review";

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

/**
 * A post-pass idiomatic review of the learner's PASSING solution (LX-C9). Strictly
 * additive: it gates nothing and grants nothing — the learner has already solved
 * the challenge, and this reviews the working code for idiom/clarity against the
 * reference. `summary` is a one/two-sentence overall read that affirms the pass;
 * `notes` is a bounded list of short, specific suggestions and MAY be empty when
 * the solution is already idiomatic (the model must not invent problems). Never
 * carries a rewrite or applicable edits — it is feedback, not a fix.
 */
export interface ReviewResponse {
  type: "review";
  summary: string;
  notes: string[];
}

/**
 * A single minimal search/replace edit. `search` is an exact, contiguous
 * snippet copied verbatim from the learner's current code (located by substring
 * match); `replace` is what it becomes (may be empty for a pure deletion).
 * Propose emits an array of these instead of echoing the whole file — the client
 * applies them to the live editor buffer (see `apply-edits.ts`).
 */
export interface CodeEdit {
  search: string;
  replace: string;
}

// The CLIENT shape of a propose response. `check` no longer carries the
// answer (`correctIndex`/`explanation`) — those are sealed server-side into
// `checkToken` and verified by POST /api/ai/partner/verify, never shipped to
// the browser. See `check-seal.ts` and `SealedCheck` below. `edits` replaced
// the former full-file `proposedCode`: the model returns only the lines that
// change (bounded output, no attacker-triggerable full-file echo — see
// AIE-11/AIE-15), and the client reconstructs the proposed buffer by applying
// them.
export interface ProposeResponse {
  type: "propose";
  rationale: string;
  edits: CodeEdit[];
  check: {
    question: string;
    options: [string, string, string];
  };
  checkToken: string;
}

export type PartnerResponse =
  | HintResponse
  | AnswerResponse
  | ProposeResponse
  | ReviewResponse;

/**
 * A single rendered turn in the AI Partner chat. Persisted server-side per
 * (learner, lesson) so a returning learner can review past AI notes without
 * spending another paid assist. The `{role:"ai",kind:"hint"}` variant is the
 * only client-only one — free authored hints never hit the paid route, so they
 * aren't logged (and stay re-viewable for free).
 */
export type PartnerMessage =
  | { role: "user"; text: string }
  | { role: "ai"; kind: "hint"; text: string }
  | { role: "ai"; response: PartnerResponse };

/** The comprehension-check answer, sealed into `checkToken` (never sent to the client in the clear). */
export interface SealedCheck {
  correctIndex: 0 | 1 | 2;
  explanation: string;
}

/**
 * Proof that the server saw a submission for a required-but-ungraded block
 * (e.g. openEnded, spec §8). Sealed into a token; NOT a correctness verdict.
 * Bound to course+lesson+block+user+expiry so a captured token cannot be
 * replayed into another course, lesson, block, user, or after expiry.
 */
export interface Attestation {
  courseId: string;
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

// ── Assist ladder (#864, AI-tutor-economics spec §4.2) ─────────────────────
// Per-(learner, challenge) AI-turn budget, resolved in strict order:
//   free (2, counter hidden) → metered (8, meter visible) → Socratic (20,
//   questions-first contract, `propose` still alive) → community handoff.
// All catalog-bounded; no calendar refills. Single source of truth, imported
// by the server budget (`assist-budget.ts`), the route, and the client hook.
// Plain constants — this module is not `server-only`.

/** Free AI turns per challenge (turns 1–2). Full tutor; the UI shows no meter. */
export const FREE_ASSIST_TURNS = 2;

/**
 * Total free + metered AI turns per (learner, challenge) — the spec's
 * "`MAX_PAID_ASSISTS` goes 4 → 10 with the first 2 invisible". The metered
 * tier itself is `METERED_ASSIST_TURNS` (turns 3–10).
 */
export const MAX_PAID_ASSISTS = 10;

/** Metered AI turns per challenge (turns 3–10; meter visible). */
export const METERED_ASSIST_TURNS = MAX_PAID_ASSISTS - FREE_ASSIST_TURNS;

/**
 * Socratic-tier turns per challenge (turns 11–30). Metered, never framed as
 * "unlimited" (owner D-5): a lighter, questions-first tutor — not a wall.
 */
export const SOCRATIC_ASSIST_TURNS = 20;

/** Which rung of the ladder a (learner, challenge) is on. */
export type AssistTier = "free" | "metered" | "socratic" | "exhausted";

export interface AssistTurnCounts {
  free: number;
  metered: number;
  socratic: number;
}

/**
 * Resolves the tier the NEXT turn would land in from the per-tier counts —
 * the same strict free → metered → Socratic order the `spend_assist_ladder_turn`
 * RPC enforces (the RPC is authoritative; this mirrors it for display).
 */
export function assistTierFor(counts: AssistTurnCounts): AssistTier {
  if (counts.free < FREE_ASSIST_TURNS) return "free";
  if (counts.metered < METERED_ASSIST_TURNS) return "metered";
  if (counts.socratic < SOCRATIC_ASSIST_TURNS) return "socratic";
  return "exhausted";
}

/** Self-serve reset availability, as reported by the state/reset RPCs. */
export type AssistResetState = "available" | "cooldown" | "used" | "none";
