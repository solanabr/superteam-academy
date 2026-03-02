'use client'

import { FC, ReactNode, useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'

import '@solana/wallet-adapter-react-ui/styles.css'

export const SolanaProvider: FC<{ children: ReactNode }> = ({ children }) => {
   const endpoint = useMemo(() => clusterApiUrl('devnet'), []) // or 'mainnet-beta'
   const wallets = useMemo(() => [], []) // auto-detects installed wallets

   return (
      <ConnectionProvider endpoint={endpoint}>
         <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
               {children}
            </WalletModalProvider>
         </WalletProvider>
      </ConnectionProvider>
   )
}