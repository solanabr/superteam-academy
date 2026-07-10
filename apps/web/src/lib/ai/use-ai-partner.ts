"use client";

import { useCallback, useState } from "react";
import { MAX_PAID_ASSISTS } from "./partner-types";
import type {
  PartnerAction,
  PartnerResponse,
  VerifyResponse,
} from "./partner-types";

// Free authored hints are served locally from the lesson's `hints` ladder —
// they never hit the network. Once this many have been shown, `requestHint()`
// falls through to the paid route (design resolution, Task 3 -> progress.md).
const FREE_HINT_LIMIT = 2;

// MAX_PAID_ASSISTS is imported from partner-types.ts (single source of truth,
// shared with the server budget). The server enforces it; this only drives the
// client-side `paidRemaining` display and resets on refresh (v1 limitation).

const PARTNER_ROUTE = "/api/ai/partner";
const VERIFY_ROUTE = "/api/ai/partner/verify";

export type PartnerMessage =
  | { role: "user"; text: string }
  | { role: "ai"; kind: "hint"; text: string }
  | { role: "ai"; response: PartnerResponse };

interface UseAiPartnerOptions {
  lessonSlug: string;
  courseSlug: string;
  hints: string[];
  getCode: () => string;
  getTestSummary: () => string;
}

interface UseAiPartnerResult {
  messages: PartnerMessage[];
  freeHintsUsed: number;
  paidUsed: number;
  paidRemaining: number;
  budgetExhausted: boolean;
  loading: boolean;
  error: string | null;
  requestHint: () => Promise<void>;
  proposeFix: () => Promise<void>;
  ask: (message: string) => Promise<void>;
  verifyCheck: (
    checkToken: string,
    pickedIndex: 0 | 1 | 2
  ) => Promise<VerifyResponse>;
}

type PartnerRouteReply =
  | PartnerResponse
  | { budgetExhausted: true; used: number };

function isBudgetExhausted(
  reply: PartnerRouteReply
): reply is { budgetExhausted: true; used: number } {
  return "budgetExhausted" in reply && reply.budgetExhausted === true;
}

export function useAiPartner({
  lessonSlug,
  courseSlug,
  hints,
  getCode,
  getTestSummary,
}: UseAiPartnerOptions): UseAiPartnerResult {
  const [messages, setMessages] = useState<PartnerMessage[]>([]);
  const [freeHintsUsed, setFreeHintsUsed] = useState(0);
  const [paidUsed, setPaidUsed] = useState(0);
  const [budgetExhausted, setBudgetExhausted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Every call to the route is a PAID action (free hints never reach here) —
  // stateless by design, so only the current code/testSummary are sent, never
  // prior chat turns.
  const callPartnerRoute = useCallback(
    async (action: PartnerAction, message?: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(PARTNER_ROUTE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonSlug,
            courseSlug,
            action,
            message,
            code: getCode(),
            testSummary: getTestSummary(),
          }),
        });

        if (!res.ok) {
          setError(`Request failed (${res.status})`);
          return;
        }

        const reply: PartnerRouteReply = await res.json();

        if (isBudgetExhausted(reply)) {
          setPaidUsed(reply.used);
          setBudgetExhausted(true);
          return;
        }

        setPaidUsed((prev) => prev + 1);
        setMessages((prev) => [...prev, { role: "ai", response: reply }]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Network error");
      } finally {
        setLoading(false);
      }
    },
    [lessonSlug, courseSlug, getCode, getTestSummary]
  );

  const requestHint = useCallback(async () => {
    if (freeHintsUsed < FREE_HINT_LIMIT && freeHintsUsed < hints.length) {
      const text = hints[freeHintsUsed]!;
      setMessages((prev) => [...prev, { role: "ai", kind: "hint", text }]);
      setFreeHintsUsed((prev) => prev + 1);
      return;
    }
    await callPartnerRoute("hint");
  }, [freeHintsUsed, hints, callPartnerRoute]);

  const proposeFix = useCallback(async () => {
    await callPartnerRoute("propose");
  }, [callPartnerRoute]);

  const ask = useCallback(
    async (message: string) => {
      setMessages((prev) => [...prev, { role: "user", text: message }]);
      await callPartnerRoute("ask", message);
    },
    [callPartnerRoute]
  );

  // Server-verifies a comprehension-check pick against the sealed token from
  // `propose` (Fix A on PR #346's claude-review finding — the answer never
  // reaches the browser in the clear, so DiffCard can't grade locally
  // anymore). Fails SAFE: any non-ok response or thrown fetch returns
  // `correct:false` so a verify error can never be mistaken for an accept.
  const verifyCheck = useCallback(
    async (
      checkToken: string,
      pickedIndex: 0 | 1 | 2
    ): Promise<VerifyResponse> => {
      try {
        const res = await fetch(VERIFY_ROUTE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkToken, pickedIndex }),
        });
        if (!res.ok) {
          return { correct: false, explanation: "" };
        }
        return (await res.json()) as VerifyResponse;
      } catch {
        return { correct: false, explanation: "" };
      }
    },
    []
  );

  return {
    messages,
    freeHintsUsed,
    paidUsed,
    paidRemaining: Math.max(0, MAX_PAID_ASSISTS - paidUsed),
    budgetExhausted,
    loading,
    error,
    requestHint,
    proposeFix,
    ask,
    verifyCheck,
  };
}
