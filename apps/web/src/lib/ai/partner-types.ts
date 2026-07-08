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

export interface ProposeResponse {
  type: "propose";
  rationale: string;
  proposedCode: string;
  check: {
    question: string;
    options: [string, string, string];
    correctIndex: 0 | 1 | 2;
    explanation: string;
  };
}

export type PartnerResponse = HintResponse | AnswerResponse | ProposeResponse;

/**
 * Max PAID AI assists per (learner, challenge). Single source of truth,
 * imported by both the server budget (`assist-budget.ts`) and the client hook
 * (`use-ai-partner.ts`). Plain constant — this module is not `server-only`.
 */
export const MAX_PAID_ASSISTS = 4;
