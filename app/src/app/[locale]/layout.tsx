import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
// Header and Footer removed for custom page layouts
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SyncUserOnLogin } from "@/components/auth/SyncUserOnLogin";
import { ThirdPartyScripts } from "@/components/analytics/ThirdPartyScripts";
import "../globals.css"; // Adjusted path
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Superteam Academy",
  description: "Master Solana at the metal level",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#14F195" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} flex min-h-screen flex-col font-body antialiased bg-void text-text-primary selection:bg-solana/20 selection:text-solana`}
      >
        <div className="bg-noise opacity-12 pointer-events-none fixed inset-0 z-50 mix-blend-overlay"></div>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <SyncUserOnLogin />
            <Suspense fallback={null}>
              <ThirdPartyScripts />
            </Suspense>
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
