import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import dynamic from "next/dynamic";
import { XpAnimationProvider } from "@/context/XpAnimationContext";
import { LanguageProvider } from "@/context/LanguageContext"
import Script from "next/script";
import * as Sentry from '@sentry/nextjs';
import { Suspense } from "react";
import { RootProviders } from "@/components/RootProviders";
import { ThemeProvider } from "@/components/ThemeProvider";

const SolanaProviders = dynamic(
  () => import("@/components/SolanaProviders").then(m => m.SolanaProviders),
  { ssr: false }
);

const AnalyticsProvider = dynamic(
  () => import("@/components/AnalyticsProvider").then(m => m.AnalyticsProvider),
  { ssr: false }
);

const Header = dynamic(
  () => import("@/components/layout/Header").then((mod) => mod.Header),
  { ssr: false }
);
const QueryProvider = dynamic(
  () => import("@/providers/QueryProvider").then(m => m.QueryProvider),
  { ssr: false }
);
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export function generateMetadata(): Metadata {
  return {
    title: "Superteam Academy - Learn & Earn on Solana",
    description:
      "Decentralized learning platform where you can earn XP, level up, and get verifiable credentials on the Solana blockchain",
    other: {
      ...Sentry.getTraceData(),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.devnet.solana.com" />
        <link rel="dns-prefetch" href="https://api.devnet.solana.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
              <Script id="ga-init" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){window.dataLayer.push(arguments);}
                  window.gtag = gtag;
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `}
              </Script>
              </>
            )}
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
            `}
          </Script>
        )}
      <RootProviders>
        <QueryProvider>
          <ThemeProvider>
          

          <SolanaProviders>
            <LanguageProvider>
              <Header />
            <XpAnimationProvider>
              
              <Suspense fallback={null}>
                <AnalyticsProvider />
              </Suspense>
              <main className="min-h-screen">
                {children}
              </main>
            </XpAnimationProvider>
            </LanguageProvider>
          </SolanaProviders>
          
          </ThemeProvider>
        </QueryProvider>
      </RootProviders>
      </body>
    </html>
  );
}