import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import { GAScript } from "@/components/analytics/ga-script";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://academy.superteam.fun"),
  title: {
    default: "Superteam Academy — Master Solana Development",
    template: "%s | Superteam Academy",
  },
  description:
    "The premier Solana learning platform for Latin American developers. Interactive courses, on-chain credentials, XP rewards, and a thriving developer community.",
  keywords: [
    "Solana",
    "blockchain",
    "development",
    "learning",
    "web3",
    "cryptocurrency",
    "dApp",
    "Anchor",
    "Rust",
    "TypeScript",
    "Superteam",
    "Brazil",
    "LATAM",
  ],
  authors: [{ name: "Superteam Brazil" }],
  creator: "Superteam Brazil",
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["pt_BR", "es_ES"],
    url: "https://academy.superteam.fun",
    siteName: "Superteam Academy",
    title: "Superteam Academy — Master Solana Development",
    description:
      "Interactive Solana courses, on-chain XP tokens, and credentials. Build real dApps from day one.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Superteam Academy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Superteam Academy",
    description: "Master Solana development with interactive courses and on-chain credentials.",
    creator: "@SuperteamBR",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <GAScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-background`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
