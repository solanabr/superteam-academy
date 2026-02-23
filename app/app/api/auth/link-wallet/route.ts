import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyWalletSignature, walletAuthSchema } from "@superteam-academy/auth";

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

		const cookieStore = await cookies();
		const existingRaw = cookieStore.get("linked_accounts")?.value;
		const existing: LinkedAccountEntry[] = existingRaw
			? (JSON.parse(existingRaw) as LinkedAccountEntry[])
			: [];

		const alreadyLinked = existing.some(
			(a) => a.provider === "wallet" && a.identifier === parsed.data.publicKey
		);
		if (alreadyLinked) {
			return NextResponse.json({ error: "Wallet already linked" }, { status: 409 });
		}

		existing.push({
			provider: "wallet",
			identifier: parsed.data.publicKey,
			linkedAt: new Date().toISOString(),
		});

		cookieStore.set("linked_accounts", JSON.stringify(existing), {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 30 * 24 * 60 * 60,
			path: "/",
		});

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

interface LinkedAccountEntry {
	provider: string;
	identifier: string;
	linkedAt: string;
}
