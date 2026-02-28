import type { Metadata } from "next";
import Script from "next/script";
import {
  Geist,
  Geist_Mono,
  Space_Grotesk,
  Instrument_Serif,
  Caveat,
} from "next/font/google";
import localFont from "next/font/local";
import { getLocale } from "next-intl/server";
import { PWARegister } from "@/components/pwa-register";
import "./globals.css";

// Critical fonts (used on landing page hero/body) — preloaded
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

// Diatype — Solana Foundation brand font (not preloaded — hero uses Instrument Serif,
// so preloading 182 KiB of Diatype wastes critical-path bandwidth)
const diatype = localFont({
  src: [
    { path: "../fonts/diatype/ABCDiatype-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/diatype/ABCDiatype-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/diatype/ABCDiatype-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-diatype",
  display: "swap",
  preload: false,
});

// DSemi — Solana Foundation semi-mono (stats, numbers) — not preloaded (not LCP-critical)
const dsemi = localFont({
  src: [
    { path: "../fonts/semimono/ABCDiatypeSemi-Mono-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/semimono/ABCDiatypeSemi-Mono-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-dsemi",
  display: "swap",
  preload: false,
});

// Secondary fonts — loaded on demand, not preloaded (saves ~180KB on initial load)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  preload: false,
});

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export const metadata: Metadata = {
  metadataBase: new URL("https://app-seven-mu-27.vercel.app"),
  title: {
    default: "Superteam Academy | Master Solana Development",
    template: "%s | Superteam Academy",
  },
  description:
    "The gamified learning platform for Solana developers. Earn XP, collect on-chain credentials, and level up your skills.",
  keywords: [
    "Solana",
    "blockchain",
    "development",
    "learning",
    "Web3",
    "DeFi",
    "Rust",
    "Anchor",
    "cryptocurrency",
    "smart contracts",
  ],
  openGraph: {
    title: "Superteam Academy | Master Solana Development",
    description:
      "The gamified learning platform for Solana developers. Earn XP, collect on-chain credentials, and level up your skills.",
    url: "https://app-seven-mu-27.vercel.app",
    siteName: "Superteam Academy",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Superteam Academy",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Superteam Academy | Master Solana Development",
    description:
      "The gamified learning platform for Solana developers. Earn XP, collect on-chain credentials, and level up your skills.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://app-seven-mu-27.vercel.app",
    languages: {
      en: "https://app-seven-mu-27.vercel.app/en",
      "pt-BR": "https://app-seven-mu-27.vercel.app/pt-br",
      es: "https://app-seven-mu-27.vercel.app/es",
      "x-default": "https://app-seven-mu-27.vercel.app/en",
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const lang = locale === "pt-br" ? "pt-BR" : locale;

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#FAFAFA" media="(prefers-color-scheme: light)" />
        <link rel="dns-prefetch" href="https://api.devnet.solana.com" />
        <link
          rel="preconnect"
          href="https://api.devnet.solana.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://us.i.posthog.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${instrumentSerif.variable} ${caveat.variable} ${diatype.variable} ${dsemi.variable} antialiased`}
      >
        {children}
        <PWARegister />
        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Superteam Academy",
              url: "https://app-seven-mu-27.vercel.app",
              logo: "https://app-seven-mu-27.vercel.app/icon.svg",
              description:
                "The gamified learning platform for Solana developers.",
              sameAs: ["https://twitter.com/SuperteamBR"],
            }),
          }}
        />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', { analytics_storage: 'denied' });
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
              try {
                if (localStorage.getItem('sa_cookie_consent') === 'granted') {
                  gtag('consent', 'update', { analytics_storage: 'granted' });
                }
              } catch(e) {}
            `}</Script>
          </>
        )}
      </body>
    </html>
  );
}
