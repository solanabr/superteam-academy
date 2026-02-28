import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { PrivyAuthProvider } from "@/components/layout/wallet-provider";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { PostHogProvider } from "@/components/layout/posthog-provider";
import { ClarityScript } from "@/components/layout/clarity-script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1e3a28" },
    { media: "(prefers-color-scheme: light)", color: "#f2ebd4" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://academy.superteam.fun"
  ),
  title: {
    default: "Superteam Academy | Learn Solana Development",
    template: "%s | Superteam Academy",
  },
  description:
    "The open-source learning platform for Solana developers. Interactive courses, on-chain credentials, and gamified progression. Built by Superteam Brazil.",
  keywords: [
    "Solana",
    "blockchain",
    "development",
    "learning",
    "courses",
    "Anchor",
    "Rust",
    "Web3",
    "Superteam",
    "Brazil",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ST Academy",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Superteam Academy",
    title: "Superteam Academy | Learn Solana Development",
    description:
      "Interactive courses, on-chain credentials, and gamified progression for Solana developers.",
  },
  twitter: {
    card: "summary_large_image",
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
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <PrivyAuthProvider>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider>
              <PostHogProvider>
                {children}
              </PostHogProvider>
            </ThemeProvider>
          </NextIntlClientProvider>
        </PrivyAuthProvider>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        <ClarityScript />
      </body>
    </html>
  );
}
