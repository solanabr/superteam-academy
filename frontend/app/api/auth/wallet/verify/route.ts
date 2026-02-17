import { type NextRequest, NextResponse } from "next/server";
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

		const isValid = verifyWalletSignature(parsed.data);
		if (!isValid) {
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		// Signature verified — the user owns this wallet.
		// For the stub implementation, we return a lightweight session token
		// based on the public key. In production this would create/look up a
		// user record and issue a proper session cookie via better-auth.
		return NextResponse.json({
			authenticated: true,
			publicKey: parsed.data.publicKey,
		});
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
