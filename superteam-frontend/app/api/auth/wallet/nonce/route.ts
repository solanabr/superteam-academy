import { PublicKey } from "@solana/web3.js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  buildWalletSignInMessage,
  createNonce,
  createNonceChallengeToken,
  getWalletNonceCookieName,
  getNonceExpiryIso,
} from "@/lib/server/wallet-auth";

type NonceRequestBody = {
  address?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NonceRequestBody;
    const address = body.address?.trim();

    if (!address) {
      return NextResponse.json(
        { error: "Address is required." },
        { status: 400 },
      );
    }

    try {
      new PublicKey(address);
    } catch {
      return NextResponse.json(
        { error: "Invalid Solana address." },
        { status: 400 },
      );
    }

    const nonce = createNonce();
    const message = buildWalletSignInMessage(address, nonce);
    const challengeToken = createNonceChallengeToken(address, nonce);
    const cookieStore = await cookies();
    cookieStore.set(getWalletNonceCookieName(), challengeToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 5,
    });

    return NextResponse.json(
      {
        message,
        nonceExpiresAt: getNonceExpiryIso(),
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 },
    );
  }
}
