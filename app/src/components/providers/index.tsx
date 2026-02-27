"use client";

import { ReactNode } from "react";
import { WalletProvider } from "./WalletProvider";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <WalletProvider>
        <TooltipProvider delayDuration={200}>
          {children}
        </TooltipProvider>
      </WalletProvider>
    </SessionProvider>
  );
}
