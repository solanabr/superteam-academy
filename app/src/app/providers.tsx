"use client";

import { WalletProvider } from "@/components/wallet/WalletProvider";
import { type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
