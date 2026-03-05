import type { Metadata } from "next";
import Script from "next/script";
import {
  DM_Sans,
  IBM_Plex_Mono,
  Sora,
  Instrument_Serif,
} from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import { SiteShell } from "@/components/layout/site-shell";
import "@/app/globals.css";

const display = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400"],
  style: ["normal", "italic"],
});

const gaId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: {
    template: "%s | Superteam Academy",
    default: "Superteam Academy | The Premier Solana Learning Platform",
  },
  description:
    "Learn Solana protocol engineering through interactive, gamified missions. Build real-world projects, earn XP, and unlock on-chain credentials.",
  keywords: [
    "Solana",
    "Web3",
    "Blockchain Development",
    "Rust",
    "Anchor",
    "Smart Contracts",
    "Superteam",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://academy.superteam.fun",
    title: "Superteam Academy",
    description:
      "Learn Solana protocol engineering through interactive, gamified missions.",
    siteName: "Superteam Academy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Superteam Academy",
    description:
      "Learn Solana protocol engineering through interactive, gamified missions.",
    creator: "@superteam",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <body>
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`}
            </Script>
          </>
        ) : null}

        <AppProviders>
          <SiteShell>{children}</SiteShell>
        </AppProviders>
      </body>
    </html>
  );
}
