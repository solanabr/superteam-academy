/**
 * @fileoverview Certificate detail page.
 * Fetches and displays a specific certificate by its ID (mock or on-chain).
 */

import { notFound } from "next/navigation";
import { CertificateView } from "@/components/certificate/CertificateView";
import { getCertificateById } from "@/lib/data/certificates";

interface CertificatePageProps {
	params: Promise<{
		locale: string;
		id: string;
	}>;
}

import { getSessionServer } from "@/lib/auth/server";

export default async function CertificatePage({
	params,
}: CertificatePageProps) {
	const { id } = await params;
	const session = await getSessionServer();
	const certificate = await getCertificateById(id);

	if (!certificate) {
		notFound();
	}

	// Determine ownership: check session wallet + all wallets linked in DB
	let isOwner = false;
	if (session?.user) {
		const sessionWallet = (session.user as { walletAddress?: string })
			.walletAddress;
		const certOwner = certificate.onChain.owner;
		const certWallet = certificate.walletAddress;

		// Direct session wallet match
		if (
			sessionWallet &&
			(sessionWallet === certOwner || sessionWallet === certWallet)
		) {
			isOwner = true;
		}

		// Also check DB for all wallets linked to this user
		if (!isOwner) {
			try {
				const { db } = await import("@/lib/db");
				const { user, wallet } = await import("@/lib/db/schema");
				const { eq } = await import("drizzle-orm");

				// Check user table walletAddress
				const dbUser = await db.query.user.findFirst({
					where: eq(user.id, session.user.id),
				});
				if (
					dbUser?.walletAddress &&
					(dbUser.walletAddress === certOwner ||
						dbUser.walletAddress === certWallet)
				) {
					isOwner = true;
				}

				// Check wallet table for linked wallets
				if (!isOwner) {
					const linkedWallets = await db.query.wallet.findMany({
						where: eq(wallet.userId, session.user.id),
					});
					for (const w of linkedWallets) {
						if (w.address === certOwner || w.address === certWallet) {
							isOwner = true;
							break;
						}
					}
				}
			} catch (e) {
				console.warn("Failed to check wallet ownership:", e);
			}
		}
	}

	return <CertificateView certificate={certificate} isOwner={isOwner} />;
}
