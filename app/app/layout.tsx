import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Superteam Academy",
    default: "Superteam Academy — On-Chain Learning on Solana",
  },
  description:
    "Complete interactive courses, earn XP tokens, and collect soulbound credentials — all verified on Solana.",
  keywords: ["Solana", "blockchain", "education", "Web3", "learn", "XP", "credentials", "NFT"],
  openGraph: {
    type: "website",
    title: "Superteam Academy",
    description: "On-chain learning platform on Solana. Earn XP and credentials.",
    siteName: "Superteam Academy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Superteam Academy",
    description: "On-chain learning platform on Solana",
  },
  metadataBase: new URL("https://superteam-academy-beige.vercel.app"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Academy",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
