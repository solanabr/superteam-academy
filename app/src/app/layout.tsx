import type { Metadata } from 'next';
import './globals.css';
import SolanaProvider from '@/components/wallet/SolanaProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { I18nProvider } from '@/i18n';

export const metadata: Metadata = {
  title: 'Superteam Academy | Learn Solana, Earn On-Chain Credentials',
  description: 'Decentralized learning platform on Solana. Earn verifiable credentials and XP tokens.',
  openGraph: {
    title: 'Superteam Academy',
    description: 'Master Solana development. Earn on-chain credentials.',
    siteName: 'Superteam Academy',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col">
        <I18nProvider>
          <SolanaProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </SolanaProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
