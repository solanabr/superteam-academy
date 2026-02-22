import { redirect, notFound } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { getUserByWallet } from "@/lib/sanity-users";

interface ProfileUsernamePageProps {
	params: Promise<{ locale: string; username: string }>;
}

export default async function ProfileUsernamePage({ params }: ProfileUsernamePageProps) {
	const { locale, username } = await params;

	// If the username is a valid Solana public key, redirect to profile with ?wallet=
	try {
		new PublicKey(username);
		redirect(`/${locale}/profile?wallet=${username}`);
	} catch {
		// Not a valid public key — try Sanity lookup
	}

	// Try finding user by wallet address stored in CMS
	const user = await getUserByWallet(username);
	if (user?.walletAddress) {
		redirect(`/${locale}/profile?wallet=${user.walletAddress}`);
	}

	notFound();
}
