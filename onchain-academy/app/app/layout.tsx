import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ClientProviders } from "@/components/providers/client-providers";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans",
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#a855f7',
};

export const metadata: Metadata = {
  title: "Superteam Academy - Learn Solana Development",
  description: "Learn to build on Solana. Earn on-chain XP and credential NFTs. Interactive courses, coding challenges, and verified credentials.",
  keywords: ["Solana", "Web3", "Blockchain", "Development", "Courses", "Learning", "Anchor", "Rust"],
  authors: [{ name: "Superteam Brazil" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "Superteam Academy - Learn Solana Development",
    description: "Learn to build on Solana. Earn on-chain XP and credential NFTs.",
    type: "website",
    locale: "en_US",
    siteName: "Superteam Academy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Superteam Academy",
    description: "Learn to build on Solana. Earn on-chain XP and credential NFTs.",
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
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script 
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-config" dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');` }} />
          </>
        )}
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script id="clarity-script" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,'clarity','script','${process.env.NEXT_PUBLIC_CLARITY_ID}');` }} />
        )}
      </head>
      <body className="antialiased font-sans">
        <ClientProviders>
          <ThemeProvider>{children}</ThemeProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
