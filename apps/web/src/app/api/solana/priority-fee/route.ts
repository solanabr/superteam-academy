import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";
import { getConnection } from "@/lib/solana/academy-program";
import { estimatePriorityFee } from "@/lib/solana/priority-fee";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

/** More than any transaction the app builds for a wallet writes. */
const MAX_ACCOUNTS = 16;

function parseAccounts(value: unknown): PublicKey[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  if (value.length > MAX_ACCOUNTS) return null;
  const accounts: PublicKey[] = [];
  for (const item of value) {
    if (typeof item !== "string" || item.length > 44) return null;
    try {
      accounts.push(new PublicKey(item));
    } catch {
      return null;
    }
  }
  return accounts;
}

/**
 * Priority-fee price for a transaction the learner's wallet is about to sign,
 * in micro-lamports per compute unit, for the accounts it writes. Same helper
 * and clamp as the server's own sends, so the browser gets the estimate
 * without the server RPC key. POST so the wallet addresses stay out of URLs.
 *
 * Signed-in only and rate limited: each call spends an RPC request on the
 * server key. The limiter fails closed; a refused caller's wallet code falls
 * back to the floor price, so nothing it signs is blocked.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      accounts?: unknown;
    } | null;
    const accounts = parseAccounts(body?.accounts);
    if (!accounts) {
      return NextResponse.json(
        { error: `accounts must be 1-${MAX_ACCOUNTS} base58 addresses` },
        { status: 400 }
      );
    }

    if (
      await isRateLimited("solana:priority-fee", userId, {
        maxTokens: 60,
        refillIntervalMs: 600_000,
        failClosed: true,
      })
    ) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "600" } }
      );
    }

    const microLamports = await estimatePriorityFee(getConnection(), accounts);
    return NextResponse.json(
      { microLamports },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.PRIORITY_FEE_ROUTE_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
    });
    return NextResponse.json(
      { error: "Could not estimate the priority fee" },
      { status: 500 }
    );
  }
}
