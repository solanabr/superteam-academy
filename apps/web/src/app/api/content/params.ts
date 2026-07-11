import { NextResponse } from "next/server";

/**
 * Shared param validation for the public `/api/content/*` routes (SP2-B).
 * These routes exist because the content bundle is `server-only` (it carries
 * lesson solutions), so client components that used to query Sanity's public
 * CDN directly now fetch these safe, summary-shaped projections instead.
 *
 * All params are bounded and shape-checked — no unbounded fan-out.
 */

/** Sanity `_id`s are slug-like (`course-anchor-framework`). */
const ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

/** Base58 Solana pubkey. */
const WALLET_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** Hard cap on ids per request — dashboard/profile fetch a user's enrollments
 *  plus activity refs, which is dozens at most. */
export const MAX_IDS = 200;

/**
 * Parse + validate a comma-separated `ids`/`exclude` param. Returns the id
 * array, or a 400 response when the param is malformed. `allowEmpty` lets the
 * exclude-list route accept an absent param (exclude nothing).
 */
export function parseIds(
  raw: string | null,
  allowEmpty: boolean
): string[] | NextResponse {
  const ids = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0 && !allowEmpty) {
    return NextResponse.json({ error: "Missing ids" }, { status: 400 });
  }
  if (ids.length > MAX_IDS) {
    return NextResponse.json({ error: "Too many ids" }, { status: 400 });
  }
  for (const id of ids) {
    if (!ID_PATTERN.test(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
  }
  return ids;
}

/** Validate a `wallet` param. Returns the wallet, or a 400 response. */
export function parseWallet(raw: string | null): string | NextResponse {
  if (!raw || !WALLET_PATTERN.test(raw)) {
    return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
  }
  return raw;
}
