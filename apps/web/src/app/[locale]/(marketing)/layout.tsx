import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Superteam LMS — Solana Developer Education",
  description:
    "The definitive learning platform for Solana developers. Interactive courses, coding challenges, on-chain NFT credentials, and a gamified learning experience in English, Portuguese, and Spanish.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
