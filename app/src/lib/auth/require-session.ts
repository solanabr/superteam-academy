import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth-options";

/**
 * Returns the authenticated session or a 401 JSON response.
 * Usage in API routes:
 *   const session = await requireSession();
 *   if (session instanceof NextResponse) return session;
 */
export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}
