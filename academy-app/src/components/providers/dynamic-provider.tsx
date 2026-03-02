'use client'

import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { SolanaWalletConnectors } from '@dynamic-labs/solana'
// import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

// const DynamicContextProvider = dynamic(
//    () => import('@dynamic-labs/sdk-react-core').then(m => DynamicContextProvider),
//    {ssr: false}
// )

export const DynamicProvider = ({ children }: { children: ReactNode }) => {
   return (
      <DynamicContextProvider
         settings={{
            environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
            walletConnectors: [SolanaWalletConnectors],
         }}
      >
         {children}
      </DynamicContextProvider>
   )
}