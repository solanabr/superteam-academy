import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner';
import { WalletProvider } from '@/context/WalletProvider';
import { GamificationProvider } from '@/context/GamificationContext';
import { ThemeProvider } from '@/components/theme-provider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Superteam Academy",
  description: "Learn Solana Development",
};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0A0A0F] text-white min-h-screen custom-scrollbar`}>
        <NextIntlClientProvider messages={messages}>
          <WalletProvider>
             <GamificationProvider>
                <div className="flex flex-col min-h-screen">
                  <Navbar />
                  <main className="flex-grow pt-16">
                    {children}
                  </main>
                  <Footer />
                </div>
                <Toaster richColors position="top-right" theme="dark" />
                <AnalyticsProvider />
             </GamificationProvider>
          </WalletProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
