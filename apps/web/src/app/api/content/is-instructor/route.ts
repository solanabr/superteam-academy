import { NextRequest, NextResponse } from "next/server";
import { parseWallet } from "../params";
import { isInstructorWallet } from "@/lib/content/queries";

/**
 * Whether a wallet belongs to a known instructor — the client-side face of
 * `isInstructorWallet` (header's "Teach" nav gate). Instructor wallets are
 * public catalog data (course creators). Bundle-only synchronous read; the
 * wallet param makes the route dynamic.
 *
 * Split out of `/api/content/instructor-wallet` (issue #478, B4), which now
 * answers a different question — "what does this wallet's public profile
 * look like" — via the `public_profiles` view. The two used to share a
 * route name; "is this wallet a course creator" (course-ownership gate) and
 * "resolve this wallet's display identity" (profile lookup) are unrelated
 * concerns, so they get separate routes.
 */
export async function GET(request: NextRequest) {
  const wallet = parseWallet(request.nextUrl.searchParams.get("wallet"));
  if (wallet instanceof NextResponse) return wallet;
  try {
    const isInstructor = await isInstructorWallet(wallet);
    return NextResponse.json({ isInstructor });
  } catch {
    return NextResponse.json(
      { error: "Failed to check wallet" },
      { status: 500 }
    );
  }
}
