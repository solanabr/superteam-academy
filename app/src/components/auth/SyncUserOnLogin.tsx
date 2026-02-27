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
  const synced = useRef(false);

  const linkedAddress =
    user?.wallet?.address ?? (user?.linkedAccounts?.find((a: any) => a.type === "wallet") as any)?.address;
  const solanaAddress = wallets?.[0]?.address;
  const walletAddress = linkedAddress ?? solanaAddress;

  useEffect(() => {
    // Check for referral code in URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      sessionStorage.setItem("referral_code", ref);
    }

    if (!authenticated || !walletAddress || synced.current) return;
    synced.current = true;

    const email =
      user?.email?.address ?? (user?.linkedAccounts?.find((a: any) => a.type === "email") as any)?.address;

    const storedReferral = sessionStorage.getItem("referral_code");

    fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet: walletAddress,
        email: email ?? undefined,
        referrerCode: storedReferral ?? undefined
      }),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          // Also trigger progress fetch once user is synced
          fetchProgress(walletAddress);
          // Clear referral after successful sync
          sessionStorage.removeItem("referral_code");
        } else {
          synced.current = false;
          setError("Failed to create profile. Please check your connection or try again later.");
        }
      })
      .catch(() => {
        synced.current = false;
        setError("Failed to connect to the server for profile creation.");
      });
  }, [authenticated, walletAddress, user?.email?.address, user?.linkedAccounts, setUser, setError, fetchProgress]);

  return null;
}
