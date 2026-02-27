import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyWalletSignature, walletAuthSchema } from "@superteam-academy/auth";
import { issueLinkedWalletBetterAuthSession, issueWalletBetterAuthSession } from "@/lib/auth";
import { findLinkedUserId } from "@/lib/auth-linking-store";

function nonceDeleteCookie() {
	const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
	return `wallet_nonce=; Max-Age=0; Path=/api/auth/wallet; HttpOnly; SameSite=Strict${secure}`;
}

function appendSetCookieHeaders(source: Headers, target: Headers) {
	const typedHeaders = source as Headers & {
		getSetCookie?: () => string[];
	};

	if (typeof typedHeaders.getSetCookie === "function") {
		for (const cookie of typedHeaders.getSetCookie()) {
			target.append("set-cookie", cookie);
		}
		return;
	}

	const setCookie = source.get("set-cookie");
	if (setCookie) {
		target.append("set-cookie", setCookie);
	}
}

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

		const isValid = verifyWalletSignature(parsed.data);
		if (!isValid) {
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		cookieStore.delete("wallet_nonce");

		const linkedUserId = await findLinkedUserId("wallet", parsed.data.publicKey);
		const betterAuthResult = linkedUserId
			? await issueLinkedWalletBetterAuthSession(
					request,
					parsed.data.publicKey,
					linkedUserId
				)
			: await issueWalletBetterAuthSession(request, parsed.data.publicKey);

		const response = NextResponse.json({
			authenticated: true,
			publicKey: parsed.data.publicKey,
		});

		appendSetCookieHeaders(betterAuthResult.headers, response.headers);
		response.headers.append("set-cookie", nonceDeleteCookie());

		return response;
	} catch (error) {
		console.error("Wallet verification failed", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
