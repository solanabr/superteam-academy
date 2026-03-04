"use client";

import { useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useUserStore } from "@/store/user-store";
import type { UserState } from "@/store/user-store";

/** Syncs the authenticated user (wallet) to our DB on login. Renders nothing. */
export function SyncUserOnLogin() {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const setUser = useUserStore((s: UserState) => s.setUser);
  const setError = useUserStore((s: UserState) => s.setError);
  const fetchProgress = useUserStore((s: UserState) => s.fetchProgress);
  const setProgressDirect = useUserStore((s: UserState) => s.setProgressDirect);
  const setSyncComplete = useUserStore((s: UserState) => s.setSyncComplete);
  const synced = useRef(false);

  const linkedAddress =
    user?.wallet?.address ?? (user?.linkedAccounts?.find((a: any) => a.type === "wallet") as any)?.address;
  const solanaAddress = wallets?.[0]?.address;
  const walletAddress = linkedAddress ?? solanaAddress;

  useEffect(() => {
    if (!authenticated || !walletAddress || synced.current) return;
    synced.current = true;

    const email =
      user?.email?.address ?? (user?.linkedAccounts?.find((a: any) => a.type === "email") as any)?.address;

    fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet: walletAddress,
        email: email ?? undefined,
      }),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data);

          // If the user API piggybacked progress data, set it INSTANTLY
          // This makes XP display without waiting for the separate /api/progress call
          if (data.progress) {
            setProgressDirect(data.progress);
          }

          // Still fetch full progress in background for any additional data
          fetchProgress(walletAddress);
        } else {
          // If sync fails, we don't block the UI, but we log it for debugging
          console.error("SyncUserOnLogin: Failed to sync user profile");
          synced.current = false;
        }
      })
      .catch((err) => {
        console.error("SyncUserOnLogin: Network error during sync", err);
        synced.current = false;
      })
      .finally(() => {
        // Signal that the sync attempt has completed (success or failure)
        // so AuthGuard can safely evaluate the onboarding gate
        setSyncComplete(true);
      });
  }, [authenticated, walletAddress, user?.email?.address, user?.linkedAccounts, setUser, fetchProgress, setProgressDirect, setSyncComplete]);

  return null;
}
