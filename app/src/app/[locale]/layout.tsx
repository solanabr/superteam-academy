import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { WalletContextProvider } from '@/components/WalletContextProvider';
import { Toaster } from 'react-hot-toast';
import { Navbar } from '@/components/Navbar';

const locales = ['en', 'pt'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: 'Superteam Brazil LMS - Learn, Build, Earn on Solana',
  description: 'A comprehensive Learning Management System for Solana blockchain education with NFT certificates',
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) notFound();

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <WalletContextProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Toaster position="bottom-right" />
        </div>
      </WalletContextProvider>
    </NextIntlClientProvider>
  );
}
