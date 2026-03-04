import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Archivo, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://academy.superteam.fun"),
  title: {
    default: "Superteam Academy",
    template: "%s | Superteam Academy",
  },
  description: "Learn Solana. Earn Credentials. Build the Future.",
  keywords: ["Solana", "Web3", "blockchain", "learn", "academy", "credentials", "XP", "Superteam"],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Superteam Academy",
    title: "Superteam Academy",
    description: "Learn Solana. Earn Credentials. Build the Future.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Superteam Academy",
    description: "Learn Solana. Earn Credentials. Build the Future.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffd23f" },
    { media: "(prefers-color-scheme: dark)", color: "#1b231d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Academy" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#ffd23f" />
        <meta name="msapplication-TileColor" content="#1b231d" />
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
          </>
        )}
      </head>
      <body
        className={`${archivo.variable} ${inter.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Script id="sw-register" strategy="lazyOnload">
          {`if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`}
        </Script>
      </body>
    </html>
  );
}
