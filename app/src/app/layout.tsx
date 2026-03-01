import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Superteam Academy | Learn Solana Development",
  description:
    "The decentralized learning platform for Solana developers. Earn soulbound XP tokens, collect verifiable credentials, and level up your on-chain skills.",
  keywords: ["Solana", "Blockchain", "Education", "DeFi", "NFT", "Web3", "Anchor"],
  openGraph: {
    title: "Superteam Academy",
    description: "Learn Solana. Earn XP. Collect Credentials.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#0a0a1a] text-white antialiased`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
