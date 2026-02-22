import { redirect } from "next/navigation";

interface CertificateLocalePageProps {
	params: Promise<{ id: string }>;
}

export default async function CertificateLocalePage({ params }: CertificateLocalePageProps) {
	const { id } = await params;
	redirect(`/certificates/${id}`);
}
