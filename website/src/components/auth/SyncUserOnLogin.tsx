"use client";

import { useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";

/** Syncs the authenticated user (wallet) to our DB on login. Renders nothing. */
export function SyncUserOnLogin() {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const synced = useRef(false);

  const linkedAddress =
    user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;
  const solanaAddress = wallets?.[0]?.address;
  const walletAddress = linkedAddress ?? solanaAddress;

  useEffect(() => {
    if (!authenticated || !walletAddress || synced.current) return;
    synced.current = true;
    const email =
      user?.email?.address ?? user?.linkedAccounts?.find((a) => a.type === "email")?.address;
    fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: walletAddress, email: email ?? undefined }),
    }).catch(() => {
      synced.current = false;
    });
  }, [authenticated, walletAddress, user?.email?.address, user?.linkedAccounts]);

  return null;
}
