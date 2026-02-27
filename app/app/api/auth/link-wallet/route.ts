import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyWalletSignature, walletAuthSchema } from "@superteam-academy/auth";
import { serverAuth } from "@/lib/auth";
import { upsertLinkedAccount } from "@/lib/auth-linking-store";
import { getUserByAuthId, syncUserToSanity } from "@/lib/sanity-users";

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

		const requestHeaders = await headers();
		const session = await serverAuth.api.getSession({ headers: requestHeaders });
		if (!session) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const existingUser = await getUserByAuthId(session.user.id);
		if (!existingUser) {
			await syncUserToSanity({
				authId: session.user.id,
				name: session.user.name,
				email: session.user.email,
				walletAddress: parsed.data.publicKey,
				...(session.user.image ? { image: session.user.image } : {}),
			});
		}

		const result = await upsertLinkedAccount({
			userId: session.user.id,
			provider: "wallet",
			identifier: parsed.data.publicKey,
		});

		if (!result.linked) {
			if (result.reason === "storage-unavailable") {
				return NextResponse.json({ error: "Sanity storage unavailable" }, { status: 503 });
			}

			if (result.reason === "user-not-found") {
				return NextResponse.json({ error: "Sanity user not found" }, { status: 404 });
			}

			return NextResponse.json(
				{ error: "Wallet already linked to a different account" },
				{ status: 409 }
			);
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
