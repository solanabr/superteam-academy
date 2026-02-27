import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const geistSans = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CapySolBuild Academy | Learn Solana Development',
  description:
    'The ultimate learning platform for Solana-native developers. From zero to deploying production-ready dApps.',
  keywords: ['Solana', 'blockchain', 'web3', 'development', 'education', 'courses', 'dApp'],
  authors: [{ name: 'Musab Mubaraq Mburaimoh' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CapySolBuild Academy',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'CapySolBuild Academy | Learn Solana Development',
    description: 'The ultimate learning platform for Solana-native developers.',
    type: 'website',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#9945FF" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
