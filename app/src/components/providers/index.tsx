"use client";

import { ReactNode, Suspense } from "react";
import { WalletProvider } from "./WalletProvider";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PostHogProvider } from "./PostHogProvider";
import { PostHogPageview } from "./PostHogPageview";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <PostHogProvider>
      <SessionProvider>
        <WalletProvider>
          <TooltipProvider delayDuration={200}>
            <Suspense>
              <PostHogPageview />
            </Suspense>
            {children}
          </TooltipProvider>
        </WalletProvider>
      </SessionProvider>
    </PostHogProvider>
  );
}
