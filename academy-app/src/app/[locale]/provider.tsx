'use client'

import dynamic from "next/dynamic";
import { PropsWithChildren } from "react";
// import { SolanaProvider } from "~/components/providers/wallet-provider";

const WalletProvider = dynamic(
   () => import("~/components/providers/wallet-provider").then(m => m.SolanaProvider), {
      ssr: false
   }
)


export default function Providers({ children}: PropsWithChildren) {

   return (
      <WalletProvider>
         {children}
      </WalletProvider>
   )
}