"use client";

import type { ReactNode } from "react";
import { WalletProvider } from "@/contexts/wallet-provider";
import { ThemeProvider } from "@/contexts/theme-context";
import { LocaleProvider } from "@/contexts/locale-context";
import { LearningProvider } from "@/contexts/learning-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <WalletProvider>
          <LearningProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </LearningProvider>
        </WalletProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
