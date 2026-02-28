import type { Metadata } from "next";
import { CertificateClient } from "@/components/certificate";

export const metadata: Metadata = {
  title: "Certificate",
  description: "View your course completion certificate on Superteam Academy.",
};

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CertificateClient certId={id} />;
}
