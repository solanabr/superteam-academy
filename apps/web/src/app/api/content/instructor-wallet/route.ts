import { NextRequest, NextResponse } from "next/server";
import { resolvePublicProfileByWallet } from "@/lib/profiles/public-profile";
import { createCookielessClient } from "@/lib/supabase/cookieless";
import { parseWallet, CONTENT_CACHE_HEADERS } from "../params";

/**
 * Wallet → public academy profile (issue #478, B4). Flipped from the retired
 * "wallet → content instructor doc" lookup: a course's `creator` wallet no
 * longer derefs an Instructor content doc (deleted), so this resolves the
 * wallet-linked academy profile instead, for display.
 *
 * Reads ONLY the `public_profiles` VIEW (never the raw `profiles` table,
 * which carries sensitive columns — `google_id`, `github_id`, `deleted_at` —
 * gated by owner-only RLS). `profile: null` means no public profile exists
 * for this wallet (none yet, private, or deleted); the caller falls back to
 * a truncated wallet display, never a blank one.
 */
export async function GET(request: NextRequest) {
  const wallet = parseWallet(request.nextUrl.searchParams.get("wallet"));
  if (wallet instanceof NextResponse) return wallet;
  try {
    // Cookieless anon client — `public_profiles` is an anon-granted view and
    // the response is identical for every viewer, so no Set-Cookie may block
    // CDN caching.
    const supabase = createCookielessClient();
    const profile = await resolvePublicProfileByWallet(supabase, wallet);
    return NextResponse.json({ profile }, { headers: CONTENT_CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Failed to resolve profile" },
      { status: 500 }
    );
  }
}
