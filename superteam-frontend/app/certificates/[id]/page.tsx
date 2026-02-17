import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import {
  CertificatePage,
  CertificateNotFound,
  type CertificateViewData,
} from "@/components/certificates/CertificatePage";
import { getCertificateById } from "@/lib/server/certificate-service";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cert = getCertificateById(id);

  if (!cert) {
    return {
      title: "Certificate Not Found | Superteam Academy",
      description: "This certificate could not be found.",
    };
  }

  return {
    title: `${cert.courseTitle} Certificate | Superteam Academy`,
    description: `${cert.recipientName} completed ${cert.courseTitle} on Superteam Academy. Verified on Solana (${cert.cluster}).`,
    openGraph: {
      title: `${cert.courseTitle} - Certificate of Completion`,
      description: `${cert.recipientName} has successfully completed ${cert.courseTitle} on Superteam Academy. This credential is verified on-chain on Solana.`,
      type: "website",
      siteName: "Superteam Academy",
    },
    twitter: {
      card: "summary_large_image",
      title: `${cert.courseTitle} - Certificate of Completion`,
      description: `${cert.recipientName} completed ${cert.courseTitle} on Superteam Academy. Verified on Solana.`,
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const cert = getCertificateById(id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {cert ? (
          <CertificatePage certificate={cert as CertificateViewData} />
        ) : (
          <CertificateNotFound />
        )}
      </main>
    </div>
  );
}
