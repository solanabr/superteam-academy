"use server";

import { isWalletEmail, walletFromEmail } from "@superteam-academy/auth";
import type { serverAuth } from "@/lib/auth";
import { getUserByAuthId, syncUserToSanity } from "@/lib/sanity-users";

export async function syncAuthSession(
	session: Awaited<ReturnType<typeof serverAuth.api.getSession>>
) {
	if (!session) {
		return;
	}

	const { user } = session;
	const walletAddress =
		(isWalletEmail(user.email) ? walletFromEmail(user.email) : undefined) ??
		((user as Record<string, unknown>).walletAddress as string | undefined);

	const existing = await getUserByAuthId(user.id);
	if (existing) {
		const linkedWallet =
			existing.linkedAccounts?.find((entry) => entry.provider === "wallet")?.identifier ??
			undefined;
		const resolvedWallet = walletAddress ?? existing.walletAddress ?? linkedWallet;

		const syncPromise = syncUserToSanity({
			authId: user.id,
			name: user.name,
			email: existing.email,
			...(resolvedWallet ? { walletAddress: resolvedWallet } : {}),
			...(user.image ? { image: user.image } : {}),
		});
		const synced = await syncPromise.catch(() => null);
		const effectiveRole = synced?.role ?? existing.role;

		return {
			synced: true,
			role: effectiveRole,
			name: synced?.name ?? existing.name,
			email: existing.email,
			onboardingCompleted: synced?.onboardingCompleted ?? false,
			walletAddress: resolvedWallet,
		};
	}

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
		name: sanityUser.name,
		email: sanityUser.email,
		role: sanityUser.role,
		onboardingCompleted: sanityUser.onboardingCompleted ?? false,
		walletAddress: walletAddress ?? sanityUser.walletAddress,
	};
}
