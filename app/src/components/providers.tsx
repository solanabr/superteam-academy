// app/src/components/providers.tsx
"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { SessionProvider } from "next-auth/react"; // <-- Импорт
import { PostHogProvider } from "@/components/providers/posthog-provider"; // <-- Наш новый провайдер

import "@solana/wallet-adapter-react-ui/styles.css";

const apiKey = process.env.HELIUS_API_KEY;
const HELIUS_RPC = `https://devnet.helius-rpc.com/?api-key=${apiKey}`; 

export function Providers({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;

  const endpoint = useMemo(() => {
    return HELIUS_RPC.includes(`${apiKey}`) 
      ? clusterApiUrl(network) 
      : HELIUS_RPC;
  }, [network]);

  // ВАЖНО: Оставляем массив пустым. 
  // Phantom и Solflare подключатся автоматически через механизм "Standard Wallet".
  const wallets = useMemo(() => [], [network]);

  return (
    <SessionProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <PostHogProvider>
              {children}
            </PostHogProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SessionProvider>
  );
}