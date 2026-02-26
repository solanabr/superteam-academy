import { notFound } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { getUserByWallet, getUserByUsername } from "@/lib/sanity-users";
import { Suspense } from "react";
import { ProfileContent, ProfileSkeleton } from "../page";

interface ProfileUsernamePageProps {
	params: Promise<{ locale: string; username: string }>;
}

export default async function ProfileUsernamePage({ params }: ProfileUsernamePageProps) {
	const { username } = await params;

	// If the username is a valid Solana public key, treat it as a wallet address
	try {
		new PublicKey(username);
		return (
			<div className="min-h-screen bg-background">
				<Suspense fallback={<ProfileSkeleton />}>
					<ProfileContent walletAddress={username} />
				</Suspense>
			</div>
		);
	} catch {
		// Not a valid public key — try username lookup
	}

	// Try finding user by username
	const user = await getUserByUsername(username);
	if (user?.walletAddress) {
		return (
			<div className="min-h-screen bg-background">
				<Suspense fallback={<ProfileSkeleton />}>
					<ProfileContent walletAddress={user.walletAddress} />
				</Suspense>
			</div>
		);
	}

	// Fallback: try finding user by wallet address stored in CMS (for backwards compatibility)
	const userByWallet = await getUserByWallet(username);
	if (userByWallet?.walletAddress) {
		return (
			<div className="min-h-screen bg-background">
				<Suspense fallback={<ProfileSkeleton />}>
					<ProfileContent walletAddress={userByWallet.walletAddress} />
				</Suspense>
			</div>
		);
	}

	notFound();
}
