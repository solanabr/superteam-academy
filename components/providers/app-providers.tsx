'use client';

import { AuthProvider } from '@/components/auth/auth-provider';
import { I18nProvider } from '@/components/i18n/i18n-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { SolanaWalletProvider } from '@/components/wallet/solana-wallet-provider';

export function AppProviders({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <SolanaWalletProvider>{children}</SolanaWalletProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
