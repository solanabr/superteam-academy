"use client";

import { Suspense, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "./auth-provider";
import { AnalyticsProvider } from "./analytics-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistration } from "./sw-registration";
import { RouteScrollRestore } from "./route-scroll-restore";

const SolanaProvider = dynamic(
  () => import("./solana-provider").then((m) => ({ default: m.SolanaProvider })),
  { ssr: false }
);

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
            <Toaster position="top-right" />
            <ServiceWorkerRegistration />
            <RouteScrollRestore />
          </TooltipProvider>
        </AuthProvider>
      </SolanaProvider>
    </ThemeProvider>
  );
}
