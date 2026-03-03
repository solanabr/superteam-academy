
"use client";
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

import { FC, ReactNode, useMemo } from "react"
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect';
import { LedgerWalletAdapter } from '@solana/wallet-adapter-ledger';
import { TorusWalletAdapter } from '@solana/wallet-adapter-torus';
import { Coin98WalletAdapter } from '@solana/wallet-adapter-coin98';
import { BitKeepWalletAdapter } from '@solana/wallet-adapter-bitkeep';
import { TrustWalletAdapter } from '@solana/wallet-adapter-trust';
import { CloverWalletAdapter } from '@solana/wallet-adapter-clover';
import { CoinhubWalletAdapter } from '@solana/wallet-adapter-coinhub';
import { OntoWalletAdapter } from '@solana/wallet-adapter-onto';
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase';
import { clusterApiUrl } from "@solana/web3.js"
import "@solana/wallet-adapter-react-ui/styles.css"

interface Props {
  children: ReactNode
}

export const WalletProvider: FC<Props> = ({ children }) => {
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("devnet")

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new WalletConnectWalletAdapter({ network: WalletAdapterNetwork.Devnet, options: {} }),
      new LedgerWalletAdapter(),
      new TorusWalletAdapter(),
      new Coin98WalletAdapter(),
      new BitKeepWalletAdapter(),
      new TrustWalletAdapter(),
      new CloverWalletAdapter(),
      new CoinhubWalletAdapter(),
      new OntoWalletAdapter(),
      new CoinbaseWalletAdapter(),
    ],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider
        wallets={wallets}
        autoConnect
        localStorageKey="superteam-academy-wallet"
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
