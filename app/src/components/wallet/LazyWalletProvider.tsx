"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const WalletProvider = dynamic(
  () => import("@/components/wallet/WalletProvider").then(m => m.WalletProvider),
  { ssr: false, loading: () => null }
);

export function LazyWalletProvider({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
