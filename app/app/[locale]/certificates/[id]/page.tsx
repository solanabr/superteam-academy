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

	// Determine if the current user is the owner
	// We check both internal ID and linked wallet address
	const isOwner =
		!!session?.user &&
		(session.user.id === certificate.walletAddress ||
			session.user.id === certificate.onChain.owner ||
			(session.user as { walletAddress?: string }).walletAddress ===
				certificate.walletAddress ||
			(session.user as { walletAddress?: string }).walletAddress ===
				certificate.onChain.owner);

	return <CertificateView certificate={certificate} isOwner={isOwner} />;
}
