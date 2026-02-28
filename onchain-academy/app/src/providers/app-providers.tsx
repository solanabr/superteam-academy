"use client";

import { Suspense, type ReactNode } from "react";
import { SessionProvider } from "./session-provider";
import { ThemeProvider } from "./theme-provider";
import { LazyWalletProvider } from "./wallet-lazy-provider";
import { ToastProvider } from "@/lib/hooks/use-toast";
import { AnalyticsProvider } from "./analytics-provider";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { TurnstileGate } from "@/components/turnstile/turnstile-gate";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <TurnstileGate>
          <LazyWalletProvider>
            <ToastProvider>
              <Suspense fallback={null}>
                <AnalyticsProvider />
              </Suspense>
              {children}
              <CookieConsent />
            </ToastProvider>
          </LazyWalletProvider>
        </TurnstileGate>
      </ThemeProvider>
    </SessionProvider>
  );
}
