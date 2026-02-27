import { redirect } from "next/navigation";
import type { Metadata } from "next";

interface CertificatePageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CertificatePageProps): Promise<Metadata> {
	const { id } = await params;
	return {
		title: `Certificate ${id} | Superteam Academy`,
		description: "Redirects to the localized certificate detail route.",
	};
}

export default async function LegacyCertificatePage({ params }: CertificatePageProps) {
	const { id } = await params;
	redirect(`/en/certificates/${id}`);
}
