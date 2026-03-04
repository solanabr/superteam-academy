import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SolanaWalletProvider } from '@/components/providers/SolanaWalletProvider';
import { Navbar } from '@/components/layout/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Superteam Academy - Learn Solana, Earn XP, Get Hired',
  description: 'Interactive learning platform for Solana developers in Latin America. Master blockchain development through hands-on challenges and earn verifiable credentials.',
  keywords: ['Solana', 'Blockchain', 'Web3', 'Learning', 'Education', 'LATAM', 'Brazil', 'Superteam'],
  authors: [{ name: 'Superteam Academy' }],
  openGraph: {
    title: 'Superteam Academy - Learn Solana Development',
    description: 'Master Solana blockchain development through interactive lessons and earn XP',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SolanaWalletProvider>
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </SolanaWalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
