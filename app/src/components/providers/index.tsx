'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import { WalletProvider } from './wallet-provider';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SessionProvider } from './session-provider';
import { AuthProvider } from './auth-provider';
import { ServiceWorkerProvider } from './service-worker-provider';
import { AnalyticsProvider } from './analytics-provider';
import { PageTransitionProvider } from './page-transition-provider';
import { PWAInstallPrompt, OfflineIndicator, PWAUpdatePrompt } from '@/components/pwa';
import { Toaster } from '@/components/ui/sonner';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider defaultTheme="dark">
        <AnalyticsProvider>
          <ServiceWorkerProvider>
            <WalletProvider>
              <WalletModalProvider>
                <AuthProvider>
                  <PageTransitionProvider>
                    {children}
                    <Toaster position="bottom-right" />
                    <PWAInstallPrompt />
                    <PWAUpdatePrompt />
                    <OfflineIndicator />
                  </PageTransitionProvider>
                </AuthProvider>
              </WalletModalProvider>
            </WalletProvider>
          </ServiceWorkerProvider>
        </AnalyticsProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

export { ThemeProvider, useThemeContext } from './theme-provider';
export { WalletProvider, useWalletContext } from './wallet-provider';
export { SessionProvider } from './session-provider';
export { AuthProvider, useAuth } from './auth-provider';

export { ServiceWorkerProvider, useServiceWorker } from './service-worker-provider';
export { AnalyticsProvider, useAnalytics } from './analytics-provider';
