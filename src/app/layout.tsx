import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AnalyticsScripts } from '@/components/shared/analytics-scripts';
import './globals.css';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Solana Quest - Your Adventure into Solana Development',
    template: '%s | Solana Quest',
  },
  description:
    'An RPG-themed learning platform that transforms Solana development education into an epic quest. Level up your skills, earn on-chain credentials, and join the builder community.',
  keywords: [
    'Solana',
    'blockchain',
    'development',
    'learning',
    'web3',
    'Rust',
    'Anchor',
    'DeFi',
    'NFT',
    'education',
  ],
  authors: [{ name: 'Superteam Brazil' }],
  openGraph: {
    title: 'Solana Quest - Your Adventure into Solana Development',
    description:
      'Level up your Solana development skills through interactive quests, earn XP, and collect on-chain credentials.',
    type: 'website',
    siteName: 'Solana Quest',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solana Quest',
    description: 'Your RPG adventure into Solana development',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <AnalyticsScripts />
        </Providers>
      </body>
    </html>
  );
}
