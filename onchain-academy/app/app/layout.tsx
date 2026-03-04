/**
 * app/layout.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Root layout — injects WalletProvider, i18n, and global styles.
 *
 * PLACE THIS FILE AT:
 *   app/layout.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// ─── Wallet adapter styles (required) ────────────────────────────────────────
// This import makes the "Connect Wallet" modal look correct.
// You MUST include this, or the modal will be unstyled.
import "@solana/wallet-adapter-react-ui/styles.css";

import { WalletProvider } from "@/components/providers/WalletProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Superteam Academy",
  description: "Interactive Solana learning platform with gamification, multi-language support, and on-chain credentials.",
  openGraph: {
    title: "Superteam Academy",
    description: "Master Solana development with interactive courses, gamification, and on-chain credentials.",
    url: "https://superteam-academy.vercel.app",
    siteName: "Superteam Academy",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/*
          ✅ WalletProvider wraps everything so any component in the tree
          can call useWallet(), useConnection(), etc.

          The order matters:
            ConnectionProvider → WalletProvider → WalletModalProvider
          All three are handled inside our WalletProvider component.
        */}
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
