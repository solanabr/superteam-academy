import { NextRequest, NextResponse } from "next/server";
import { parseWallet } from "../params";
import { resolvePublicProfileByWallet } from "@/lib/profiles/public-profile";
import { createClient } from "@/lib/supabase/server";

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
    const supabase = await createClient();
    const profile = await resolvePublicProfileByWallet(supabase, wallet);
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json(
      { error: "Failed to resolve profile" },
      { status: 500 }
    );
  }
}
