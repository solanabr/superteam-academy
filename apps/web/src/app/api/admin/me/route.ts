import "server-only";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";

// Reads the caller's session per request — never statically prerender.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/me — `{ admin: boolean }` for the CURRENT session.
 *
 * Purely cosmetic signal for the user menu's Admin entry; the server gate on
 * every /admin page and /api/admin route is the security boundary. Reveals
 * nothing beyond the caller's own status and never 500s: `requireAdmin` fails
 * closed on any error, so the worst case is `{ admin: false }`.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    return NextResponse.json({ admin: admin !== null });
  } catch {
    return NextResponse.json({ admin: false });
  }
}
