import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caminho. | Learn Solana Development",
  description:
    "The ultimate interactive learning platform for Solana developers. Master blockchain development with hands-on courses, earn on-chain credentials, and join a community of builders.",
  keywords: [
    "Solana",
    "blockchain",
    "developer education",
    "Web3",
    "Rust",
    "Anchor",
    "DeFi",
    "NFT",
    "learn Solana",
  ],
  openGraph: {
    title: "Caminho. | Learn Solana Development",
    description:
      "Interactive learning platform for Solana developers. Hands-on courses, on-chain credentials, and gamified progression.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
