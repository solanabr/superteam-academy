"use client";

import { useMemo, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { I18nProvider } from "@/lib/i18n/provider";
import { getSolanaEndpoint, getWalletAdapters } from "@/lib/solana/wallet";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps): JSX.Element {
  const endpoint = getSolanaEndpoint();
  const wallets = useMemo(() => getWalletAdapters(), []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <I18nProvider>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>{children}</WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
