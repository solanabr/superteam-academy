import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getWalletSessionCookieName,
  verifyAccessToken,
} from "@/lib/server/wallet-auth";

export const dynamic = "force-dynamic";

function buildUsername(walletAddress: string): string {
  return `user_${walletAddress.slice(0, 6).toLowerCase()}`;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getWalletSessionCookieName())?.value;
  const session = await verifyAccessToken(token);

  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
  };

  if (!session) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200, headers },
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        id: session.sub,
        walletAddress: session.walletAddress,
        username: buildUsername(session.walletAddress),
      },
    },
    { status: 200, headers },
  );
}
