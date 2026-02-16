'use client';

import { useMemo, ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { SOLANA_CONFIG } from '@/config/constants';
import { Toaster } from 'react-hot-toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WalletAuthBridge } from '@/components/shared/wallet-auth-bridge';

import '@solana/wallet-adapter-react-ui/styles.css';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ConnectionProvider endpoint={SOLANA_CONFIG.rpcUrl}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <TooltipProvider>
              <WalletAuthBridge />
              {children}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--card-foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                }}
              />
            </TooltipProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
}
