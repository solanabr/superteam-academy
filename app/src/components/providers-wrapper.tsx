// app/src/components/providers-wrapper.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { Providers } from "@/components/providers";   // твой Solana провайдер

export function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Providers>
        {children}
      </Providers>
    </SessionProvider>
  );
}