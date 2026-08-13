import type { Metadata } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import "@/styles/globals.css";

// Self-hosted (src/fonts): `next/font/google` downloads from fonts.gstatic.com
// AT BUILD TIME, and an unreachable Google Fonts took down an otherwise-green
// production deploy — three retries per file, then a hard webpack error. The
// files are the exact latin variable woff2 subsets Google serves (Nunito
// wght 200..1000, Plus Jakarta Sans wght 200..800, JetBrains Mono
// wght 100..800), so rendering is identical; the build just no longer has a
// network dependency that can fail it.
const fontSans = localFont({
  src: "../fonts/plus-jakarta-sans-latin-wght.woff2",
  weight: "200 800",
  variable: "--font-sans",
  display: "swap",
});

const fontDisplay = localFont({
  src: "../fonts/nunito-latin-wght.woff2",
  weight: "200 1000",
  variable: "--font-display",
  display: "swap",
});

const fontMono = localFont({
  src: "../fonts/jetbrains-mono-latin-wght.woff2",
  weight: "100 800",
  variable: "--font-mono",
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://superteam-academy-web.vercel.app";

const ogImage = {
  url: "/og-navy-1200x630.png",
  width: 1200,
  height: 630,
  alt: "Superteam Academy",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Superteam Academy — Learn Solana Development",
    template: "%s | Superteam Academy",
  },
  description:
    "The definitive learning platform for Solana developers. Interactive courses, on-chain credentials, and a community of builders.",
  keywords: [
    "Solana",
    "blockchain",
    "Web3",
    "developer education",
    "Rust",
    "Anchor",
    "DeFi",
    "NFT",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Superteam Academy",
    title: "Superteam Academy — Learn Solana Development",
    description:
      "The definitive learning platform for Solana developers. Interactive courses, on-chain credentials, and a community of builders.",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Superteam Academy — Learn Solana Development",
    description:
      "The definitive learning platform for Solana developers. Interactive courses, on-chain credentials, and a community of builders.",
    images: [ogImage.url],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      {
        url: "/android-chrome-192x192.png",
        type: "image/png",
        sizes: "192x192",
      },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const locale = headersList.get("x-next-intl-locale") ?? "en";

  const skipText =
    locale === "pt-BR"
      ? "Pular para o conteúdo principal"
      : locale === "es"
        ? "Saltar al contenido principal"
        : "Skip to main content";

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        // overflow-x-clip: the challenge page's full-bleed split uses a 100vw
        // width (mx-[calc(50%-50vw)] w-screen), and 100vw includes the vertical
        // scrollbar gutter — leaving a phantom horizontal scrollbar the width of
        // the scrollbar (#770). Clipping the x-overflow here kills it without a
        // scroll container (so sticky headers still work) and without touching
        // the intentional full-bleed, since body spans the full viewport.
        className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} overflow-x-clip font-sans antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-bg focus:px-4 focus:py-2 focus:text-text focus:ring-2 focus:ring-ring"
        >
          {skipText}
        </a>
        {children}
      </body>
    </html>
  );
}
