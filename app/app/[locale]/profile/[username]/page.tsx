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
		/* noop */
	}

	const user = await getUserByUsername(username);
	if (user) {
		return (
			<div className="min-h-screen bg-background">
				<Suspense fallback={<ProfileSkeleton />}>
					<ProfileContent walletAddress={user.walletAddress} username={username} />
				</Suspense>
			</div>
		);
	}

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
