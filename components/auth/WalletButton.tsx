"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function WalletButton(): JSX.Element {
  return <WalletMultiButton className="!h-10 !rounded-md !bg-primary !text-primary-foreground" />;
}
