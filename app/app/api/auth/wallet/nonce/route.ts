import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";

export async function GET() {
	const nonce = crypto.randomBytes(32).toString("base64url");
	const domain = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

	// Store nonce in an httpOnly cookie so the verify endpoint can validate it.
	// The cookie expires in 5 minutes — matching a reasonable sign-in window.
	const cookieStore = await cookies();
	cookieStore.set("wallet_nonce", nonce, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		maxAge: 300,
		path: "/api/auth/wallet",
	});

	return NextResponse.json({ nonce, domain });
}
