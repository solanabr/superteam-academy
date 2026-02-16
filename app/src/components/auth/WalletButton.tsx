"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WalletButtonProps = {
  className?: string;
};

export function WalletButton({ className }: WalletButtonProps) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();

  const linkedAddress = user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;
  const solanaWalletAddress = wallets?.[0]?.address;
  const walletAddress = linkedAddress ?? solanaWalletAddress;

  if (!ready) {
    return (
      <Button variant="outline" size="sm" className={cn("min-w-[120px]", className)} disabled>
        Loading…
      </Button>
    );
  }

  if (authenticated && walletAddress) {
    const short = `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`;
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn("min-w-[120px]", className)}
        onClick={logout}
      >
        {short}
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      className={cn("min-w-[120px]", className)}
      onClick={login}
    >
      Log in
    </Button>
  );
}
