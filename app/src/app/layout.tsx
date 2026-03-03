import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Syne, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { AppShell } from "./shell";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://academy.superteam.fun"
  ),
  title: {
    default: "Superteam Academy — Learn Solana, Earn On-Chain",
    template: "%s | Superteam Academy",
  },
  description:
    "Master Solana development with interactive courses, code challenges, and on-chain NFT credentials. Earn XP, climb the leaderboard, and prove your skills.",
  keywords: [
    "Solana",
    "blockchain",
    "learn",
    "academy",
    "NFT",
    "credentials",
    "Anchor",
    "Rust",
    "DeFi",
    "Superteam",
  ],
  openGraph: {
    title: "Superteam Academy",
    description: "Learn Solana. Earn on-chain.",
    type: "website",
    locale: "en_US",
    siteName: "Superteam Academy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Superteam Academy",
    description: "Learn Solana. Earn on-chain.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#050a18",
  width: "device-width",
  initialScale: 1,
};

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }: { children: ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Superteam Academy",
    description: "Master Solana development with interactive courses, code challenges, and on-chain NFT credentials.",
    url: "https://academy.superteam.fun",
    sameAs: [
      "https://twitter.com/superabordo",
      "https://github.com/solanabr",
    ],
    offers: {
      "@type": "Offer",
      category: "Course",
      description: "Free Solana development courses with on-chain credentials",
      price: "0",
      priceCurrency: "USD",
    },
    hasCourse: [
      {
        "@type": "Course",
        name: "Solana 101: Building Your First dApp",
        description: "Learn the fundamentals of Solana development with hands-on coding exercises.",
        provider: { "@type": "Organization", name: "Superteam Academy" },
        educationalLevel: "Beginner",
      },
      {
        "@type": "Course",
        name: "DeFi Deep Dive: AMMs & Lending Protocols",
        description: "Master DeFi concepts and build decentralized finance applications on Solana.",
        provider: { "@type": "Organization", name: "Superteam Academy" },
        educationalLevel: "Intermediate",
      },
      {
        "@type": "Course",
        name: "NFT Mastery with Metaplex Core",
        description: "Create, manage, and trade NFTs using the Metaplex Core standard on Solana.",
        provider: { "@type": "Organization", name: "Superteam Academy" },
        educationalLevel: "Advanced",
      },
    ],
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${syne.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AppShell>{children}</AppShell>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
