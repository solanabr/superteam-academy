import { notFound } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { getUserByWallet, getUserByUsername } from "@/lib/sanity-users";
import { Suspense } from "react";
import { ProfileContent, ProfileSkeleton } from "../page";
import type { UserPrivacySettings } from "@superteam-academy/cms";
import { getLinkedWallet } from "@/lib/auth";

const DEFAULT_PRIVACY: UserPrivacySettings = {
	profileVisibility: "public",
	showProgress: true,
	showAchievements: true,
	showActivity: true,
	allowMessaging: true,
	dataSharing: false,
	analyticsTracking: false,
};

interface ProfileUsernamePageProps {
	params: Promise<{ locale: string; username: string }>;
}

export default async function ProfileUsernamePage({ params }: ProfileUsernamePageProps) {
	const { username } = await params;
	const viewerWallet = await getLinkedWallet();

	try {
		const pk = new PublicKey(username);
		const isOwner = viewerWallet === pk.toBase58();
		const user = await getUserByWallet(pk.toBase58());
		const privacy = isOwner ? undefined : { ...DEFAULT_PRIVACY, ...user?.settings?.privacy };
		return (
			<div className="min-h-screen bg-background">
				<Suspense fallback={<ProfileSkeleton />}>
					<ProfileContent walletAddress={username} privacy={privacy} />
				</Suspense>
			</div>
		);
	} catch {
		/* not a pubkey */
	}

	const user = await getUserByUsername(username);
	if (user) {
		const isOwner = viewerWallet === user.walletAddress;
		const privacy = isOwner ? undefined : { ...DEFAULT_PRIVACY, ...user.settings?.privacy };
		return (
			<div className="min-h-screen bg-background">
				<Suspense fallback={<ProfileSkeleton />}>
					<ProfileContent
						walletAddress={user.walletAddress}
						username={username}
						privacy={privacy}
					/>
				</Suspense>
			</div>
		);
	}

	const userByWallet = await getUserByWallet(username);
	if (userByWallet?.walletAddress) {
		const isOwner = viewerWallet === userByWallet.walletAddress;
		const privacy = isOwner
			? undefined
			: { ...DEFAULT_PRIVACY, ...userByWallet.settings?.privacy };
		return (
			<div className="min-h-screen bg-background">
				<Suspense fallback={<ProfileSkeleton />}>
					<ProfileContent walletAddress={userByWallet.walletAddress} privacy={privacy} />
				</Suspense>
			</div>
		);
	}

	notFound();
}
