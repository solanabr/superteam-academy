import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { syncUserToSanity } from "@/lib/sanity-users";

const WALLET_EMAIL_DOMAIN = "wallet.superteam.local";

export async function POST() {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const { user } = session;
	const isWalletUser = user.email.endsWith(`@${WALLET_EMAIL_DOMAIN}`);
	const walletAddress = isWalletUser
		? user.email.slice(0, user.email.length - `@${WALLET_EMAIL_DOMAIN}`.length)
		: undefined;

	const sanityUser = await syncUserToSanity({
		authId: user.id,
		name: user.name,
		email: user.email,
		...(walletAddress ? { walletAddress } : {}),
		...(user.image ? { image: user.image } : {}),
	});

	if (!sanityUser) {
		return NextResponse.json({ synced: false, reason: "Sanity not configured" });
	}

	return NextResponse.json({
		synced: true,
		role: sanityUser.role,
	});
}
