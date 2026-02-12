import type { ReactNode } from 'react';
import { DM_Sans } from 'next/font/google';
import '@solana/wallet-adapter-react-ui/styles.css';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={dmSans.variable}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
