"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeSync } from "@/hooks/useTheme";
import { AchievementToastManager } from "@/components/AchievementToast";
import type { WalletError } from "@solana/wallet-adapter-base";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { track } from "@/lib/analytics";

function AnalyticsTracker() {
  const { publicKey } = useWallet();
  const pathname = usePathname();
  const locale = useLocale();

  // Track page views
  useEffect(() => {
    if (pathname) {
      if (typeof window !== "undefined") {
        setTimeout(() => track.pageView(pathname, locale), 100);
      }
    }
  }, [pathname, locale]);

  // Track wallet connect
  useEffect(() => {
    if (publicKey && typeof window !== "undefined") {
      setTimeout(() => track.walletConnect(publicKey.toBase58().slice(0, 8)), 100);
    }
  }, [publicKey]);

  return null;
}

function WalletAuthHint() {
  const { publicKey } = useWallet();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const secure =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "; Secure"
        : "";

    if (publicKey) {
      const encoded = encodeURIComponent(publicKey.toBase58());
      document.cookie = `academy_wallet_hint=${encoded}; Path=/; Max-Age=2592000; SameSite=Lax${secure}`;
      return;
    }

    document.cookie = `academy_wallet_hint=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  }, [publicKey]);

  return null;
}

// CSS moved to globals.css for reliable global loading in Turbopack

// Log wallet errors. WalletConnectionError on auto-connect (no extension) is
// suppressed; all other errors including user-initiated failures are logged.
function handleWalletError(error: WalletError) {
  // Suppress the auto-connect noise when no wallet extension is installed.
  // WalletNotReadyError means extension not found — also not actionable.
  if (
    error.name === "WalletNotReadyError" ||
    error.name === "WalletConnectionError"
  ) {
    return;
  }
  console.error("[wallet]", error.name, error.message);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 2, refetchOnWindowFocus: false },
        },
      }),
  );

  const endpoint =
    process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network: "devnet" as never }),
    ],
    [],
  );

  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider
            wallets={wallets}
            autoConnect={true}
            onError={handleWalletError}
          >
            <WalletModalProvider>
              <AnalyticsTracker />
              <WalletAuthHint />
              <TooltipProvider>
                <AchievementToastManager />
                <ThemeSync />
                {children}
              </TooltipProvider>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
