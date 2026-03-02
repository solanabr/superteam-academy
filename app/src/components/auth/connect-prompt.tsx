"use client";

import { Wallet } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface ConnectPromptProps {
  message?: string;
}

export function ConnectPrompt({
  message = "Connect your wallet to get started",
}: ConnectPromptProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-full bg-primary/10 mb-4">
        <Wallet className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Wallet Required</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{message}</p>
      <WalletMultiButton />
    </div>
  );
}
