import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env.server";
import { drainAllPendingOnchainActions } from "@/lib/solana/onchain-queue";

// Service-role DB writes + on-chain sends — never prerender, never cache.
export const dynamic = "force-dynamic";

// One run attempts up to DRAIN_LIMIT rows serially, each an RPC round-trip and
// possibly a send plus confirmation. 300s is this project's plan ceiling; a run
// that hits it simply leaves the rest for the next tick, because every attempt
// is stamped before the work (markAttempt) and so is never repeated blindly.
export const maxDuration = 300;

/**
 * GET /api/cron/onchain-queue — scheduled drain of `pending_onchain_actions`
 * for EVERY learner, oldest debt first (#1247).
 *
 * WHY IT EXISTS. The queue used to drain only from the three login routes, and
 * only for the account that just signed in. A learner who stops signing in —
 * or who holds a long-lived session and never hits a login route again — has
 * their queued achievement, credential or quest mint sit forever. On 21 Sep
 * 2026 prod carried 91 unresolved rows, 77 of them `quest_xp_mint` up to 29
 * days old with `last_error` NULL: never attempted, not failing. This route is
 * the fix; the login-triggered drain stays, because it settles a returning
 * learner's own debt without waiting for the next tick.
 *
 * SCHEDULE: `apps/web/vercel.json` runs this every 15 minutes.
 *
 * AUTH: Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Fails CLOSED —
 * with `CRON_SECRET` unset it 503s and drains nothing, so a misconfigured
 * deploy can never expose an unauthenticated trigger for on-chain writes. The
 * comparison is timing-safe. Same guard as /api/cron/session-reminders and
 * /api/cron/reengagement.
 *
 * OVERLAP: safe. Each action is idempotent against the chain or the ledger
 * (receipt PDA reads, `resolved_at`, award_xp's idempotency key, and the mint's
 * sign-claim-send reservation), and a concurrent run selects with the same
 * backoff filter, so a row attempted seconds ago is not due.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = serverEnv.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "cron is not configured" },
      { status: 503 }
    );
  }
  if (!authorized(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await drainAllPendingOnchainActions();
  return NextResponse.json(summary);
}

/** Constant-time `Bearer <secret>` check. Length mismatch is rejected first. */
function authorized(header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
