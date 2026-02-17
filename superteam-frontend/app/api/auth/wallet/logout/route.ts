import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWalletSessionCookieName } from "@/lib/server/wallet-auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(getWalletSessionCookieName());

  return NextResponse.json({ ok: true }, { status: 200 });
}
