"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function WalletButton() {
  return (
    <WalletMultiButton className="bg-primary text-white border-3 border-black shadow-neo hover:shadow-neo-hover transition-all" />
  );
}
