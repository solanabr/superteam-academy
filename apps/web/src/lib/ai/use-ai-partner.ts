"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { assistTierFor } from "./partner-types";
import type {
  AssistResetState,
  AssistTier,
  AssistTurnCounts,
  PartnerAction,
  PartnerMessage,
  PartnerResponse,
  VerifyOutcome,
  VerifyResponse,
} from "./partner-types";

export type { PartnerMessage };

// Free authored hints are served locally from the lesson's `hints` ladder —
// they never hit the network. Once this many have been shown, `requestHint()`
// falls through to the AI route (design resolution, Task 3 -> progress.md).
const FREE_HINT_LIMIT = 2;

// The ladder constants live in partner-types.ts (single source of truth,
// shared with the server budget). The SERVER enforces every boundary via the
// spend_assist_ladder_turn RPC; this hook only mirrors the counts for display
// (tier chip, meter, exhaustion state) and reconciles with the server on
// rehydration.

const PARTNER_ROUTE = "/api/ai/partner";
const VERIFY_ROUTE = "/api/ai/partner/verify";
const LOG_ROUTE = "/api/ai/partner/log";
const RESET_ROUTE = "/api/ai/partner/reset";

interface UseAiPartnerOptions {
  lessonSlug: string;
  courseSlug: string;
  hints: string[];
  getCode: () => string;
  getTestSummary: () => string;
}

export interface ResetOutcome {
  allowed: boolean;
  reason: string;
  availableAt: number | null;
}

interface UseAiPartnerResult {
  messages: PartnerMessage[];
  freeHintsUsed: number;
  /** Per-tier AI-turn counts for this (learner, lesson) — display mirror of the server ladder. */
  counts: AssistTurnCounts;
  /** The rung the NEXT AI turn would land on (free | metered | socratic | exhausted). */
  tier: AssistTier;
  /** True once the whole ladder is spent — the community-handoff state, never a hard wall. */
  budgetExhausted: boolean;
  // The platform-wide daily spend cap was hit (#591) — distinct from
  // budgetExhausted (this learner's per-lesson assist quota). The route 503s
  // with `spendCapped: true`; the pane shows dedicated localized copy.
  spendCapped: boolean;
  /** Self-serve reset availability (#864 P2-5): shown only at exhaustion. */
  resetState: AssistResetState;
  resetAvailableAt: number | null;
  loading: boolean;
  error: string | null;
  requestHint: () => Promise<void>;
  proposeFix: () => Promise<void>;
  ask: (message: string) => Promise<void>;
  review: () => Promise<void>;
  /** Spend the one guarded per-lesson reset. Resolves with the server verdict. */
  requestReset: () => Promise<ResetOutcome>;
  verifyCheck: (
    checkToken: string,
    pickedIndex: 0 | 1 | 2
  ) => Promise<VerifyOutcome>;
}

type PartnerRouteReply =
  | PartnerResponse
  | { budgetExhausted: true; counts?: AssistTurnCounts };

function isBudgetExhausted(
  reply: PartnerRouteReply
): reply is { budgetExhausted: true; counts?: AssistTurnCounts } {
  return "budgetExhausted" in reply && reply.budgetExhausted === true;
}

function isCounts(value: unknown): value is AssistTurnCounts {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AssistTurnCounts).free === "number" &&
    typeof (value as AssistTurnCounts).metered === "number" &&
    typeof (value as AssistTurnCounts).socratic === "number"
  );
}

/** Advance the local count mirror by one turn, in the server's ladder order. */
function advanceCounts(prev: AssistTurnCounts): AssistTurnCounts {
  const tier = assistTierFor(prev);
  if (tier === "free") return { ...prev, free: prev.free + 1 };
  if (tier === "metered") return { ...prev, metered: prev.metered + 1 };
  if (tier === "socratic") return { ...prev, socratic: prev.socratic + 1 };
  return prev;
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
  const [counts, setCounts] = useState<AssistTurnCounts>({
    free: 0,
    metered: 0,
    socratic: 0,
  });
  const [serverExhausted, setServerExhausted] = useState(false);
  const [spendCapped, setSpendCapped] = useState(false);
  const [resetState, setResetState] = useState<AssistResetState>("none");
  const [resetAvailableAt, setResetAvailableAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tier = useMemo(() => assistTierFor(counts), [counts]);
  const budgetExhausted = serverExhausted || tier === "exhausted";

  // Rehydrate the persisted chat log + ladder counts on mount so a returning
  // learner sees past AI notes and the right tier without spending again (the
  // state lives server-side per user+lesson). Seeds only while the chat is
  // still empty and never lowers live counts, so a fast first interaction
  // during the async load is never clobbered.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `${LOG_ROUTE}?courseSlug=${encodeURIComponent(
            courseSlug
          )}&lessonSlug=${encodeURIComponent(lessonSlug)}`
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          log?: PartnerMessage[];
          counts?: unknown;
          resetState?: unknown;
          resetAvailableAt?: unknown;
        };
        if (cancelled) return;
        if (Array.isArray(data.log) && data.log.length > 0) {
          const loaded = data.log;
          setMessages((prev) => (prev.length === 0 ? loaded : prev));
        }
        if (isCounts(data.counts)) {
          const server = data.counts;
          setCounts((prev) => ({
            free: Math.max(prev.free, server.free),
            metered: Math.max(prev.metered, server.metered),
            socratic: Math.max(prev.socratic, server.socratic),
          }));
        }
        if (
          data.resetState === "available" ||
          data.resetState === "cooldown" ||
          data.resetState === "used" ||
          data.resetState === "none"
        ) {
          setResetState(data.resetState);
        }
        setResetAvailableAt(
          typeof data.resetAvailableAt === "number"
            ? data.resetAvailableAt
            : null
        );
      } catch {
        // best-effort: an empty chat on load is an acceptable fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseSlug, lessonSlug]);

  // Every call to the route spends one ladder turn (free authored hints never
  // reach here) — stateless by design, so only the current code/testSummary
  // are sent, never prior chat turns.
  const callPartnerRoute = useCallback(
    async (action: PartnerAction, message?: string) => {
      setLoading(true);
      setError(null);
      setSpendCapped(false);
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
          // The daily spend cap (#591) returns 503 with `spendCapped: true`.
          // Surface it as its own state so the pane shows dedicated localized
          // copy ("tutor at capacity today") rather than the generic error.
          if (res.status === 503) {
            try {
              const body: unknown = await res.json();
              if (
                typeof body === "object" &&
                body !== null &&
                "spendCapped" in body &&
                (body as { spendCapped?: unknown }).spendCapped === true
              ) {
                setSpendCapped(true);
                return;
              }
            } catch {
              // Non-JSON 503 → fall through to the generic error below.
            }
          }
          setError(`Request failed (${res.status})`);
          return;
        }

        const reply: PartnerRouteReply = await res.json();

        if (isBudgetExhausted(reply)) {
          // The server is authoritative: the whole ladder is spent. Sync the
          // count mirror when it reports the real numbers.
          if (isCounts(reply.counts)) setCounts(reply.counts);
          setServerExhausted(true);
          return;
        }

        setCounts(advanceCounts);
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

  // Post-pass idiomatic review (LX-C9). A paid action like propose/ask — it
  // spends an assist and appends the AI review to the chat. The caller gates
  // this on a passing run; the route is agnostic to that (it grades nothing).
  const review = useCallback(async () => {
    await callPartnerRoute("review");
  }, [callPartnerRoute]);

  const ask = useCallback(
    async (message: string) => {
      setMessages((prev) => [...prev, { role: "user", text: message }]);
      await callPartnerRoute("ask", message);
    },
    [callPartnerRoute]
  );

  // Self-serve per-lesson reset (#864 P2-5). The once+cooldown guards live
  // INSIDE the SECURITY DEFINER RPC the route calls — this only relays the
  // verdict and, on success, zeroes the local mirror so the ladder restarts
  // from the free tier. Fails safe: any error reads as a denial.
  const requestReset = useCallback(async (): Promise<ResetOutcome> => {
    try {
      const res = await fetch(RESET_ROUTE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug, lessonSlug }),
      });
      if (!res.ok) {
        return { allowed: false, reason: "error", availableAt: null };
      }
      const data = (await res.json()) as {
        allowed?: unknown;
        reason?: unknown;
        availableAt?: unknown;
      };
      const allowed = data.allowed === true;
      if (allowed) {
        setCounts({ free: 0, metered: 0, socratic: 0 });
        setServerExhausted(false);
        setResetState("used");
        setResetAvailableAt(null);
      } else if (data.reason === "already_used") {
        setResetState("used");
      } else if (data.reason === "cooldown") {
        setResetState("cooldown");
        if (typeof data.availableAt === "number") {
          setResetAvailableAt(data.availableAt);
        }
      }
      return {
        allowed,
        reason: typeof data.reason === "string" ? data.reason : "error",
        availableAt:
          typeof data.availableAt === "number" ? data.availableAt : null,
      };
    } catch {
      return { allowed: false, reason: "error", availableAt: null };
    }
  }, [courseSlug, lessonSlug]);

  // Server-verifies a comprehension-check pick against the sealed token from
  // `propose` (Fix A on PR #346's claude-review finding — the answer never
  // reaches the browser in the clear, so DiffCard can't grade locally
  // anymore). Fails SAFE: any non-ok response or thrown fetch returns
  // `correct:false` so a verify error can never be mistaken for an accept.
  const verifyCheck = useCallback(
    async (
      checkToken: string,
      pickedIndex: 0 | 1 | 2
    ): Promise<VerifyOutcome> => {
      try {
        const res = await fetch(VERIFY_ROUTE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkToken, pickedIndex }),
        });
        if (!res.ok) {
          return { correct: false, explanation: "", failed: true };
        }
        return (await res.json()) as VerifyResponse;
      } catch {
        return { correct: false, explanation: "", failed: true };
      }
    },
    []
  );

  return {
    messages,
    freeHintsUsed,
    counts,
    tier: budgetExhausted ? "exhausted" : tier,
    budgetExhausted,
    spendCapped,
    resetState,
    resetAvailableAt,
    loading,
    error,
    requestHint,
    proposeFix,
    ask,
    review,
    requestReset,
    verifyCheck,
  };
}
