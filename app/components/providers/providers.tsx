"use client";

import dynamic from "next/dynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { SessionProvider } from "next-auth/react";
import { useState, useEffect } from "react";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const WalletProvider = dynamic(() =>
  isDemoMode
    ? import("./demo-wallet-provider").then((mod) => mod.DemoWalletProvider)
    : import("./solana-provider").then((mod) => mod.SolanaProvider),
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    if (!isDemoMode) return;
    (window as unknown as Record<string, unknown>).__demoQueryClient = queryClient;
    import("bn.js").then((mod) => {
      (window as unknown as Record<string, unknown>).__BN = mod.default;
    });
  }, [queryClient]);

  return (
    <SessionProvider>
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <AnalyticsProvider>
        {children}
        </AnalyticsProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-primary)",
              backdropFilter: "blur(12px)",
              color: "var(--text-primary)",
            },
          }}
        />
      </WalletProvider>
    </QueryClientProvider>
    </SessionProvider>
  );
}
