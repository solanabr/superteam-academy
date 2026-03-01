import { NextRequest, NextResponse } from "next/server";
import { ensurePlatformUser } from "@/lib/user-db";

export const runtime = "nodejs";

/**
 * POST /api/user/ensure — ensure a platform user exists for the given wallet.
 * Call after first participation (e.g. after successful enroll) to create the user in DB.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { wallet?: string };
    const wallet = typeof body.wallet === "string" ? body.wallet.trim() : "";
    if (!wallet || wallet.length > 88) {
      return NextResponse.json(
        { error: "Missing or invalid wallet" },
        { status: 400 }
      );
    }
    await ensurePlatformUser(wallet);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to ensure user";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
