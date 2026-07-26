/**
 * Replay-on-signin for banked anonymous completions (LX-A4c).
 *
 * Walks the local bank (progress-bank) and POSTs each entry to
 * `/api/lessons/complete` with `replay: true`. The marker exempts the batch from
 * the per-USER volume gate (#459) — a learner banking a whole anonymous session
 * would otherwise throttle their own history — while the per-IP burn-rate gate
 * still applies. The server re-grades every proof, so replay grants nothing a
 * fresh live completion wouldn't: a forged or expired proof is rejected exactly
 * the same way.
 *
 * Outcomes drive the bank and the UX honestly — no failure is silently dropped:
 *   - completed  → the server accepted it → entry removed.
 *   - needsEnroll→ 403 enrollment_missing / wallet not linked → entry KEPT, so a
 *                  post-enroll retry finishes it (the learner still owns the work).
 *   - retry      → 429 / 5xx / network → transient → entry KEPT for a later pass.
 *   - needsRedo  → the banked proof is invalid or expired (wrong answer, failed
 *                  suite, missing/stale reflection seal, unknown lesson) → it can
 *                  never succeed on replay → surfaced, then removed. The learner
 *                  redoes it in-lesson, where the normal completion path applies.
 */

import type { CompletionDenyReason } from "@/lib/lessons/completion-error";
import { readBank, removeBanked, type BankedCompletion } from "./progress-bank";

export type ReplayStatus = "completed" | "needsEnroll" | "retry" | "needsRedo";

export interface ReplayOutcome {
  entry: BankedCompletion;
  status: ReplayStatus;
  /** The route's 403 discriminator or the HTTP status, for surfacing/telemetry. */
  reason?: CompletionDenyReason | string;
}

async function postCompletion(
  entry: BankedCompletion
): Promise<{ ok: boolean; status: number; reason?: string }> {
  const res = await fetch("/api/lessons/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lessonId: entry.lessonId,
      courseId: entry.courseId,
      proofs: entry.proofs,
      replay: true,
    }),
  });
  if (res.ok) return { ok: true, status: res.status };
  let reason: string | undefined;
  try {
    const body = (await res.json()) as { reason?: unknown };
    if (typeof body.reason === "string") reason = body.reason;
  } catch {
    // Non-JSON error body — status alone classifies the outcome.
  }
  return { ok: false, status: res.status, reason };
}

function classify(status: number, reason?: string): ReplayStatus {
  if (status === 429 || status >= 500) return "retry";
  // enrollment_missing needs an on-chain enroll first; 400 covers "Wallet not
  // connected" (link wallet, then it works). Both clear once the learner acts,
  // so the entry is kept for a post-enroll retry.
  if (status === 400 || reason === "enrollment_missing") return "needsEnroll";
  // 403 quiz_failed / challenge_failed / reflection_required, 404, anything else
  // → the proof itself won't pass on any retry.
  return "needsRedo";
}

/**
 * Replay the whole bank sequentially. Sequential (not parallel) so the per-IP
 * gate and the backend keypair see the same ordered pressure a human would
 * create, and so a mid-batch failure never races the ones after it. Never
 * throws: a network error on one entry is captured as a `retry` outcome and the
 * walk continues.
 */
export async function replayBankedCompletions(): Promise<ReplayOutcome[]> {
  const entries = readBank();
  const outcomes: ReplayOutcome[] = [];

  for (const entry of entries) {
    let status: ReplayStatus;
    let reason: string | undefined;
    try {
      const res = await postCompletion(entry);
      if (res.ok) {
        status = "completed";
      } else {
        status = classify(res.status, res.reason);
        reason = res.reason ?? String(res.status);
      }
    } catch {
      status = "retry";
      reason = "network";
    }

    if (status === "completed" || status === "needsRedo") {
      // Both leave the bank: a success is done; a needsRedo can never replay, so
      // holding it would re-fail (and re-nag) on every future sign-in.
      removeBanked(entry.courseId, entry.lessonId);
    }
    outcomes.push({ entry, status, reason });
  }

  return outcomes;
}
