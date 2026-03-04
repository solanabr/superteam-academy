"use client";

import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  {
    ssr: false,
    // Renders a placeholder with identical size so the nav doesn't shift
    // while the wallet module loads.
    loading: () => (
      <button
        className="wallet-adapter-button wallet-adapter-button-trigger"
        disabled
        aria-label="Loading wallet"
      >
        Select Wallet
      </button>
    ),
  },
);

export function WalletButton() {
  return <WalletMultiButton />;
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function useWalletAddress(): string | null {
  const { publicKey } = useWallet();
  return publicKey ? truncateAddress(publicKey.toBase58()) : null;
}
