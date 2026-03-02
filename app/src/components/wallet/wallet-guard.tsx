"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { ConnectPrompt } from "@/components/auth/connect-prompt";

interface WalletGuardProps {
  children: React.ReactNode;
  message?: string;
}

export function WalletGuard({ children, message }: WalletGuardProps) {
  const { connected } = useWallet();

  if (!connected) {
    return <ConnectPrompt message={message} />;
  }

  return <>{children}</>;
}
