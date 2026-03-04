// app/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { ProvidersWrapper } from "@/components/providers-wrapper";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { getMessages } from 'next-intl/server';
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from 'next-intl';
import { GoogleAnalytics } from '@next/third-parties/google'


const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "Superteam Academy",
  description: "The ultimate interactive learning platform for Solana developers.",
  keywords: "Solana, Web3, Rust, Anchor, Smart Contracts, LMS, Education",
  openGraph: {
    title: "Superteam Academy",
    description: "The ultimate interactive learning platform for Solana developers.",
    type: "website",
  },
  manifest: "/manifest.json",
  themeColor: "#a855f7",
  
  // ИСПРАВЛЕНИЕ: Замени appleWebApp на современный формат
  appleWebApp: {
    title: "Academy",
    statusBarStyle: "black-translucent",
  },
  // И добавь это для Android/Chrome PWA
  other: {
    "mobile-web-app-capable": "yes"
  }
};

export default async function RootLayout({
  children,
  params: { locale }
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        
          <NextIntlClientProvider messages={messages} locale={locale}>
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
                  <ProvidersWrapper>
                      {children}
                  </ProvidersWrapper>
                  <Toaster />
              </ThemeProvider>
          </NextIntlClientProvider>
        
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
    </html>
  );
}