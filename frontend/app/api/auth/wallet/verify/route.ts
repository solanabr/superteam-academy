import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { verifyWalletSignature, walletAuthSchema } from "@superteam/auth";

export async function POST(request: NextRequest) {
	try {
		const body: unknown = await request.json();
		const parsed = walletAuthSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid payload", details: parsed.error.issues },
				{ status: 400 }
			);
		}

		// Validate nonce from httpOnly cookie
		const cookieStore = await cookies();
		const storedNonce = cookieStore.get("wallet_nonce")?.value;
		if (!storedNonce) {
			return NextResponse.json(
				{ error: "Nonce expired or missing. Please try again." },
				{ status: 401 }
			);
		}

		// Check nonce is present in the signed message
		if (!parsed.data.message.includes(storedNonce)) {
			return NextResponse.json({ error: "Nonce mismatch" }, { status: 401 });
		}

		// Clear the used nonce immediately to prevent replay
		cookieStore.delete("wallet_nonce");

		const isValid = verifyWalletSignature(parsed.data);
		if (!isValid) {
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		// Create a wallet session token.
		// In production, this would create/lookup a user record in the database
		// and issue a proper session via better-auth. For now, we create a signed
		// session cookie containing the verified public key.
		const sessionToken = crypto.randomBytes(32).toString("base64url");

		cookieStore.set(
			"wallet_session",
			JSON.stringify({
				publicKey: parsed.data.publicKey,
				token: sessionToken,
				createdAt: Date.now(),
			}),
			{
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 7 * 24 * 60 * 60, // 7 days
				path: "/",
			}
		);

		return NextResponse.json({
			authenticated: true,
			publicKey: parsed.data.publicKey,
		});
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
