import type { Metadata } from 'next';
import { AnalyticsScripts } from '@/components/providers/analytics-scripts';
import { AppProviders } from '@/components/providers/app-providers';
import { SiteShell } from '@/components/layout/site-shell';
import '@solana/wallet-adapter-react-ui/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Superteam Academy Brasil',
  description: 'Open-source Solana LMS with gamification and on-chain credentials.'
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AppProviders>
          <SiteShell>{children}</SiteShell>
        </AppProviders>
        <AnalyticsScripts />
      </body>
    </html>
  );
}
