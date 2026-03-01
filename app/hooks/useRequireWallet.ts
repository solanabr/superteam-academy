"use client";

import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { toast } from "sonner";

/**
 * Use when a user action requires a connected wallet (enroll, create thread, reply).
 * If not connected, opens the wallet modal and toasts; returns false.
 * If connected, runs the callback and returns true.
 */
export function useRequireWallet() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  const requireWallet = useCallback(
    (onReady?: () => void): boolean => {
      if (connected) {
        onReady?.();
        return true;
      }
      setVisible(true);
      toast.info("Connect your wallet to participate.");
      return false;
    },
    [connected, setVisible]
  );

  return { connected, requireWallet };
}
