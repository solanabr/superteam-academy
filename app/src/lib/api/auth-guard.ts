import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

type AuthResult =
  | { error: NextResponse; session: null }
  | { error: null; session: Session & { user: { id: string } } };

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }
  return {
    error: null,
    session: session as Session & { user: { id: string } },
  };
}
