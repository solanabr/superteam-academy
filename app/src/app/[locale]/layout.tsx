import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { WalletProvider } from '@/components/providers/wallet-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';
import '../globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Superteam Academy',
    template: '%s | Superteam Academy',
  },
  description:
    'Learn Solana development through interactive courses, earn soulbound XP tokens and verifiable credential NFTs.',
  keywords: ['Solana', 'blockchain', 'development', 'courses', 'Web3', 'education'],
  manifest: '/manifest.json',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          <WalletProvider>
            <NextIntlClientProvider messages={messages}>
              <TooltipProvider>
                {children}
                <Toaster />
                <AnalyticsProvider />
              </TooltipProvider>
            </NextIntlClientProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
