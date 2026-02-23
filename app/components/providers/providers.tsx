"use client";

import dynamic from "next/dynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";

const SolanaProvider = dynamic(
  () =>
    import("./solana-provider").then((mod) => mod.SolanaProvider),
  { ssr: false }
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

  return (
    <SessionProvider>
    <QueryClientProvider client={queryClient}>
      <SolanaProvider>
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
      </SolanaProvider>
    </QueryClientProvider>
    </SessionProvider>
  );
}
