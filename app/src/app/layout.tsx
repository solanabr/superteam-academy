import type { Metadata, Viewport } from "next";
import { Providers } from "@/providers";
import { Sidebar } from "@/components/layout/Sidebar";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

export const metadata: Metadata = {
  title: "Superteam Academy | Learn Solana, Earn Onchain",
  description: "The decentralized learning platform by Superteam Brazil. Complete courses, earn soulbound XP tokens, and receive verifiable NFT credentials.",
  manifest: "/manifest.json",
  keywords: ["Solana", "blockchain", "learning", "NFT", "DeFi", "Web3", "crypto education"],
  openGraph: {
    type: "website",
    title: "Superteam Academy | Learn Solana",
    description: "Complete courses, earn soulbound XP tokens, and receive verifiable NFT credentials on Solana.",
    url: "https://superteam-academy.vercel.app",
    siteName: "Superteam Academy Brazil",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Superteam Academy",
    description: "Learn Solana, Earn Onchain",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <Sidebar />
          <main className="lg:ml-60 pt-14 lg:pt-0 min-h-screen">
            {children}
          </main>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
