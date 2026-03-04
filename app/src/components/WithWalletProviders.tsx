"use client"

import dynamic from "next/dynamic"
import { ReactNode } from "react"

// Wallet adapter has SSR incompatibilities — always load client-side only.
const WalletProviders = dynamic(
  () => import("@/app/WalletProviders").then((m) => m.WalletProviders),
  { ssr: false }
)

export function WithWalletProviders({ children }: { children: ReactNode }) {
  return <WalletProviders>{children}</WalletProviders>
}
