import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import { WalletProvider } from '@/components/WalletProvider';
import { I18nProvider } from '@/lib/i18n/context';
import { Footer } from '@/components/Footer';
import { SkipToContent } from '@/components/SkipToContent';
import { DocumentLang } from '@/components/DocumentLang';
import { ThemeProvider } from '@/lib/theme/context';
import { SessionProvider } from '@/components/SessionProvider';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
  title: {
    default: 'Superteam Brazil LMS — Learn Solana. Build. Ship.',
    template: '%s | Superteam Brazil LMS',
  },
  description:
    'Learning Management System dApp for Superteam Brazil Academy. Connect your Solana wallet to track progress across courses. Built for the Superteam Earn bounty.',
  keywords: ['Solana', 'Superteam Brazil', 'LMS', 'learning', 'dApp', 'web3'],
  authors: [{ name: 'Superteam Brazil', url: 'https://x.com/superteambr' }],
  openGraph: {
    title: 'Superteam Brazil LMS — Learn Solana. Build. Ship.',
    description: 'LMS dApp for Superteam Brazil Academy. Connect wallet, take courses, track progress.',
    url: 'https://superteam.fun/earn/listing/superteam-academy/',
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakarta.variable} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0c101c" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#f6f7fa" media="(prefers-color-scheme: light)" />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <WalletProvider>
          <SessionProvider>
            <I18nProvider>
              <ThemeProvider>
                <DocumentLang />
                <div className="flex min-h-screen flex-col">
                  <SkipToContent />
                  {children}
                  <Footer />
                </div>
              </ThemeProvider>
            </I18nProvider>
          </SessionProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
