import type { Metadata } from "next";
import Script from "next/script";
import {
  Geist,
  Geist_Mono,
  Playfair_Display,
  DM_Sans,
  Space_Mono,
  Space_Grotesk,
  Instrument_Serif,
} from "next/font/google";
import { PWARegister } from "@/components/pwa-register";
import "./globals.css";

// Critical fonts (used on landing page hero/body) — preloaded
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "optional",
});
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "optional",
});

// Secondary fonts — loaded on demand, not preloaded (saves ~180KB on initial load)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  preload: false,
});
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  style: ["normal", "italic"],
  preload: false,
});
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
});

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export const metadata: Metadata = {
  metadataBase: new URL("https://superteam-academy.vercel.app"),
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
    url: "https://superteam-academy.vercel.app",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
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
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${dmSans.variable} ${spaceMono.variable} ${spaceGrotesk.variable} ${instrumentSerif.variable} antialiased`}
      >
        {children}
        <PWARegister />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Superteam Academy",
              url: "https://superteam-academy.vercel.app",
              logo: "https://superteam-academy.vercel.app/icon.svg",
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
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}</Script>
          </>
        )}
      </body>
    </html>
  );
}
