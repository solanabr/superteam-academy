import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SolanaWalletProvider } from "@/providers/wallet-provider";
import { Navbar } from "@/components/layout/navbar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Superteam Academy | Learn Solana Development",
  description:
    "Decentralized learning platform on Solana with gamified progression, verifiable credentials, and on-chain XP tracking.",
  keywords: ["Solana", "Web3", "Blockchain", "Education", "DeFi", "Anchor", "Rust"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-[family-name:var(--font-geist-sans)]`}
      >
        <SolanaWalletProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <footer className="border-t py-8">
            <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Built on</span>
                <span className="gradient-text font-semibold">Solana</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Superteam Academy v0.1.0</span>
                <span>|</span>
                <span>Devnet</span>
              </div>
            </div>
          </footer>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
