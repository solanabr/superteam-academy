import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { AnalyticsProvider } from "@/components/analytics";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Superteam Academy | Learn Solana Development",
    template: "%s | Superteam Academy",
  },
  description:
    "The most comprehensive Solana learning platform. Interactive courses, on-chain credentials, and a community of builders. Master Solana from zero to production dApps.",
  keywords: [
    "Solana",
    "blockchain",
    "web3",
    "learn",
    "development",
    "Anchor",
    "DeFi",
    "NFT",
    "smart contracts",
    "Superteam",
    "Brazil",
  ],
  openGraph: {
    title: "Superteam Academy | Learn Solana Development",
    description:
      "Interactive courses, on-chain credentials, and gamified learning. The best Solana education platform in Latin America.",
    siteName: "Superteam Academy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Superteam Academy",
    description: "Master Solana Development — Interactive Courses & On-Chain Credentials",
    creator: "@SuperteamBR",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 pt-16">{children}</main>
              <Footer />
            </div>
          </Providers>
        </NextIntlClientProvider>
        <AnalyticsProvider />
      </body>
    </html>
  );
}
