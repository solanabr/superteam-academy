import type { ReactNode } from "react";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

type LayoutProps = { children: ReactNode; params: { id: string } };

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  return createPageMetadata(
    `Certificate ${params.id} | Superteam Academy`,
    "Verify Superteam Academy learning credentials on Solana Devnet.",
    `/certificates/${params.id}`
  );
}

export default function CertificateLayout({ children }: LayoutProps): JSX.Element {
  return <>{children}</>;
}
