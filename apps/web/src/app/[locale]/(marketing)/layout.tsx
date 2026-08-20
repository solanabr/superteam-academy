import type { Metadata } from "next";
import { DynamicReturnCatcher } from "@/components/auth/dynamic-return-catcher";

export const metadata: Metadata = {
  title: "Superteam Academy — Solana Developer Education",
  description:
    "The definitive learning platform for Solana developers. Interactive courses, coding challenges, on-chain NFT credentials, and a gamified learning experience in English, Portuguese, and Spanish.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The catcher completes a Dynamic social/device redirect that lands on a
  // marketing page, where the (platform) provider stack is absent (#1097).
  return (
    <>
      <DynamicReturnCatcher />
      {children}
    </>
  );
}
