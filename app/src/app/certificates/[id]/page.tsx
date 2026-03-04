import { CertificatePage } from "@/components/certificate/certificate-page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return {
    title: `Certificate ${id}`,
    description: "On-chain verifiable certificate from Superteam Academy",
  };
}

export default async function Certificate({ params }: PageProps) {
  const { id } = await params;
  return <CertificatePage certificateId={id} />;
}
