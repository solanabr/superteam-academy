import { NextRequest, NextResponse } from "next/server";
import { parseWallet } from "../params";
import { isInstructorWallet } from "@/lib/content/queries";

/**
 * Whether a wallet belongs to a known instructor — the client-side face of
 * `isInstructorWallet` (header's "Teach" nav gate). Instructor wallets are
 * public catalog data (they were world-readable via Sanity's public dataset).
 * Bundle-only synchronous read; the wallet param makes the route dynamic.
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
