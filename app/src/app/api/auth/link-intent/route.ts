import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/link-intent
 *
 * Sets a short-lived httpOnly cookie with the current user's profile ID.
 * The JWT callback reads this cookie during a subsequent signIn() call
 * so that the new provider gets linked to the existing profile instead
 * of creating a duplicate.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("link-account-to", session.user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 120,
  });

  return NextResponse.json({ ok: true });
}
