"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { WalletContextProvider } from "@/contexts/WalletProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ServiceProvider } from "@/contexts/ServiceContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LanguageProvider>
          <WalletContextProvider>
            <AuthProvider>
              <ServiceProvider>
                {children}
              </ServiceProvider>
            </AuthProvider>
          </WalletContextProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
