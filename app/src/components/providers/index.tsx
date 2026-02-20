"use client";

import { Suspense, type ReactNode } from "react";
import { ThemeProvider } from "./theme-provider";
import { SolanaProvider } from "./solana-provider";
import { AuthProvider } from "./auth-provider";
import { AnalyticsProvider } from "./analytics-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SolanaProvider>
        <AuthProvider>
          <TooltipProvider delayDuration={200}>
            <Suspense fallback={null}>
              <AnalyticsProvider>
                {children}
              </AnalyticsProvider>
            </Suspense>
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </AuthProvider>
      </SolanaProvider>
    </ThemeProvider>
  );
}
