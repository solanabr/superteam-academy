import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

export async function requireWalletSession(): Promise<
  { wallet: string } | { error: NextResponse }
> {
  const session = (await auth()) as { wallet: string | null } | null;
  if (!session?.wallet) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { wallet: session.wallet };
}
