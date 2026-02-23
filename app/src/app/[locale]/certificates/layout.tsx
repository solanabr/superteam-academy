import type { Metadata } from "next";

const BASE_URL = "https://superteam-academy.vercel.app";

export const metadata: Metadata = {
  title: "Credentials",
  description:
    "View your verifiable on-chain credentials. Bubblegum cNFT certificates earned through Solana development courses.",
  openGraph: {
    title: "Credentials | Superteam Academy",
    description:
      "View your verifiable on-chain credentials. Bubblegum cNFT certificates earned through Solana development courses.",
  },
  alternates: {
    canonical: `${BASE_URL}/en/certificates`,
    languages: {
      en: "/en/certificates",
      "pt-BR": "/pt-br/certificates",
      es: "/es/certificates",
    },
  },
};

export default function CertificatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
