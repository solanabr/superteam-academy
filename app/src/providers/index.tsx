"use client";

import type { ReactNode } from "react";
import { SolanaProvider } from "./solana-provider";
import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <SolanaProvider>
          <TooltipProvider delayDuration={300}>
            {children}
          </TooltipProvider>
        </SolanaProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
