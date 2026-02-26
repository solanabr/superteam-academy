"use server";

import type { serverAuth } from "@/lib/auth";
import { getUserByAuthId, syncUserToSanity } from "@/lib/sanity-users";

const WALLET_EMAIL_DOMAIN = "wallet.superteam.local";

export async function syncAuthSession(
	session: Awaited<ReturnType<typeof serverAuth.api.getSession>>
) {
	if (!session) {
		return;
	}

	const { user } = session;
	const isWalletUser = user.email.endsWith(`@${WALLET_EMAIL_DOMAIN}`);
	const walletAddress = isWalletUser
		? user.email.slice(0, user.email.length - `@${WALLET_EMAIL_DOMAIN}`.length)
		: undefined;

	// Fast path: return cached role if user already exists in Sanity
	const existing = await getUserByAuthId(user.id);
	if (existing) {
		// Fire-and-forget background update for lastActiveAt etc.
		syncUserToSanity({
			authId: user.id,
			name: user.name,
			email: user.email,
			...(walletAddress ? { walletAddress } : {}),
			...(user.image ? { image: user.image } : {}),
		}).catch(() => undefined);

		return {
			synced: true,
			role: existing.role,
			onboardingCompleted: existing.onboardingCompleted ?? false,
		};
	}

	// New user: need to wait for creation to get the role
	const sanityUser = await syncUserToSanity({
		authId: user.id,
		name: user.name,
		email: user.email,
		...(walletAddress ? { walletAddress } : {}),
		...(user.image ? { image: user.image } : {}),
	});

	if (!sanityUser) {
		return { synced: false, reason: "Sanity not configured" };
	}

	return {
		synced: true,
		role: sanityUser.role,
		onboardingCompleted: sanityUser.onboardingCompleted ?? false,
	};
}
