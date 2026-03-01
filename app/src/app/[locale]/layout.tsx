import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { WalletProvider } from '@/components/wallet/wallet-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { TooltipProvider } from '@/components/ui/tooltip';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Superteam Academy — Learn Solana',
  description:
    'Decentralized learning platform on Solana. Earn soulbound XP tokens, verifiable credentials, and master Solana development.',
  keywords: ['Solana', 'blockchain', 'education', 'NFT', 'credentials', 'XP', 'Web3'],
  openGraph: {
    title: 'Superteam Academy',
    description: 'Learn Solana. Earn credentials. Build the future.',
    type: 'website',
  },
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <WalletProvider>
            <TooltipProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </TooltipProvider>
          </WalletProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
