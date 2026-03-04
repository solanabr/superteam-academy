import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Superteam Academy | Learn Solana Development",
    template: "%s | Superteam Academy",
  },
  description:
    "The ultimate learning platform for Solana-native developers. Interactive courses, on-chain credentials, and a community-driven experience.",
  keywords: [
    "Solana",
    "blockchain",
    "web3",
    "development",
    "learning",
    "courses",
    "Anchor",
    "Rust",
    "DeFi",
    "NFT",
  ],
  authors: [{ name: "Superteam Brazil" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://academy.superteam.fun",
    title: "Superteam Academy | Learn Solana Development",
    description:
      "The ultimate learning platform for Solana-native developers. Interactive courses, on-chain credentials, and a community-driven experience.",
    siteName: "Superteam Academy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Superteam Academy | Learn Solana Development",
    description:
      "The ultimate learning platform for Solana-native developers. Interactive courses, on-chain credentials, and a community-driven experience.",
    creator: "@SuperteamBR",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
