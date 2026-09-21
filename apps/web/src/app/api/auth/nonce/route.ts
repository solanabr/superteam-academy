import { NextRequest, NextResponse } from "next/server";
import { generateNonce } from "@/lib/solana/wallet-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp } from "@/lib/rate-limit";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import { serverEnv } from "@/lib/env.server";

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CONSUMED_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_PENDING_PER_IP = 10;
// Cleanup and the rate-limit count are both single-row-ish statements server
// side; anything past 2 s is a stalled socket, not a slow query.
const NONCE_CLEANUP_TIMEOUT_MS = 2_000;

// Auth/cookie + per-request DB access — never statically prerender (DYNAMIC_SERVER_USAGE).
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !serverEnv.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const host = request.headers.get("host");
    if (!host) {
      return NextResponse.json(
        { error: "Missing host header" },
        { status: 400 }
      );
    }

    // Shared helper: prefers the edge-set header the client cannot forge, and
    // collapses an IPv6 /64 to one key so a routed /64 is not 2^64 free buckets.
    const ip = getClientIp(request.headers);

    const supabaseAdmin = createAdminClient();

    // Rate limit: max pending nonces per IP in the TTL window
    const { count, error: countError } = await supabaseAdmin
      .from("siws_nonces")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("ip_address", ip)
      .gte("created_at", new Date(Date.now() - NONCE_TTL_MS).toISOString())
      .abortSignal(AbortSignal.timeout(NONCE_CLEANUP_TIMEOUT_MS));

    if (countError) {
      console.error("[SIWS] Rate limit check error:", countError.message);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    if ((count ?? 0) >= MAX_PENDING_PER_IP) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const nonce = generateNonce();

    const { error: insertError } = await supabaseAdmin
      .from("siws_nonces")
      .insert({ nonce, status: "pending", ip_address: ip });

    if (insertError) {
      console.error("[SIWS] Nonce insert error:", insertError.message);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Background cleanup: expired pending (>5 min) and old consumed (>1 hour).
    //
    // ONE statement, not two: this used to fire two unawaited DELETEs per nonce
    // request, each with `.then(() => {})` and no rejection handler. Postgres
    // deletes in 0.13 ms; the p95 of 185 s was the Vercel→Supabase socket
    // hanging, and with no `.catch` that surfaced as an unhandled rejection
    // rather than a log line. Now: one `or`-filtered DELETE, a 2 s abort bound,
    // and an explicit catch. Still fire-and-forget — a learner signing in must
    // never wait on housekeeping — but it can no longer hang or crash the
    // process, and the (status, created_at) index added in
    // 20260921120000_perf_completion_counts_leaderboard_nonces.sql serves both
    // legs without a half-table scan under the row lock.
    const pendingCutoff = new Date(Date.now() - NONCE_TTL_MS).toISOString();
    const consumedCutoff = new Date(Date.now() - CONSUMED_TTL_MS).toISOString();
    void Promise.resolve(
      supabaseAdmin
        .from("siws_nonces")
        .delete()
        .or(
          `and(status.eq.pending,created_at.lt.${pendingCutoff}),` +
            `and(status.eq.consumed,created_at.lt.${consumedCutoff})`
        )
        .abortSignal(AbortSignal.timeout(NONCE_CLEANUP_TIMEOUT_MS))
    )
      .then(({ error }) => {
        if (error) {
          console.error("[SIWS] Nonce cleanup error:", error.message);
        }
      })
      .catch((err: unknown) => {
        console.error(
          "[SIWS] Nonce cleanup failed:",
          err instanceof Error ? err.message : String(err)
        );
      });

    return NextResponse.json({
      nonce,
      domain: host,
      expiresAt: new Date(Date.now() + NONCE_TTL_MS).toISOString(),
    });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.WALLET_AUTH_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/auth/nonce" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
