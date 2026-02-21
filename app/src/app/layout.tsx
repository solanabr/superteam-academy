import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Superteam Academy",
    template: "%s | Superteam Academy",
  },
  description:
    "The ultimate learning platform for Solana developers. From zero to deploying production-ready dApps.",
  keywords: [
    "Solana",
    "blockchain",
    "developer",
    "education",
    "Anchor",
    "Rust",
    "Web3",
  ],
  authors: [{ name: "Superteam Brazil" }],
  openGraph: {
    title: "Superteam Academy",
    description:
      "Master Solana development with interactive courses and on-chain credentials.",
    url: "https://academy.superteam.fun",
    siteName: "Superteam Academy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Superteam Academy",
    description:
      "Master Solana development with interactive courses and on-chain credentials.",
    creator: "@SuperteamBR",
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
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
