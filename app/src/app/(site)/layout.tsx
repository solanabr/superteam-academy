import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: "Superteam Academy — The Ultimate Interactive Hub for Solana Native Builders",
  description: "Learn Rust, Anchor, and Solana development with interactive coding challenges, earn XP on-chain, and mint cNFT certificates — all in your browser.",
  keywords: ["Solana", "Web3", "Blockchain", "Learn", "Rust", "Anchor", "NFT", "DeFi", "Superteam"],
  openGraph: {
    title: "Superteam Academy",
    description: "The Ultimate Interactive Hub for Solana Native Builders",
    type: "website",
    locale: "en_US",
  },
  metadataBase: new URL("https://superteam-academy.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}

