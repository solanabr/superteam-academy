import { type NextRequest, NextResponse } from "next/server";
import { verifyWalletSignature, walletAuthSchema } from "@superteam-academy/auth";
import { requireSession } from "@/lib/route-utils";
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

		const auth = await requireSession();
		if (!auth.ok) return auth.response;
		const { session } = auth;

		// Use the Sanity-stored email (which the user may have updated) instead
		// of the BetterAuth session email that may still hold the wallet email.
		const sanityUser = await getUserByAuthId(session.user.id);
		const email = sanityUser?.email ?? session.user.email;

		await syncUserToSanity({
			authId: session.user.id,
			name: sanityUser?.name ?? session.user.name,
			email,
			walletAddress: parsed.data.publicKey,
			...(session.user.image ? { image: session.user.image } : {}),
		});

		const result = await upsertLinkedAccount({
			userId: session.user.id,
			provider: "wallet",
			identifier: parsed.data.publicKey,
		});

		if (!result.linked && result.reason === "linked-to-different-user") {
			// Merge duplicate user records by wallet, then retry linking on the surviving user.
			await syncUserToSanity({
				authId: session.user.id,
				name: sanityUser?.name ?? session.user.name,
				email,
				walletAddress: parsed.data.publicKey,
				...(session.user.image ? { image: session.user.image } : {}),
			});

			const retry = await upsertLinkedAccount({
				userId: session.user.id,
				provider: "wallet",
				identifier: parsed.data.publicKey,
			});

			if (!retry.linked) {
				return NextResponse.json(
					{ error: "Wallet already linked to a different account" },
					{ status: 409 }
				);
			}

			return NextResponse.json({ success: true, merged: true });
		}

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
