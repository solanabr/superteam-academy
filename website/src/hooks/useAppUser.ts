"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useUserStore } from "@/store/user-store";
import type { AppUser } from "@/store/user-store";

export type AppUserRole = "student" | "professor" | "admin";

/**
 * Thin wrapper around useUserStore + Privy.
 * Discovers the wallet address from Privy and triggers fetchUser in the Zustand store.
 * All state lives in the store — no local useState / fetch duplication.
 */
export function useAppUser(): { user: AppUser | null; role: AppUserRole | null; isLoading: boolean } {
  const { authenticated, user: privyUser } = usePrivy();
  const { wallets } = useWallets();

  const user = useUserStore((s) => s.user);
  const isLoading = useUserStore((s) => s.isLoading);
  const fetchUser = useUserStore((s) => s.fetchUser);
  const setUser = useUserStore((s) => s.setUser);

  // Discover wallet address from Privy
  const walletAddress =
    privyUser?.wallet?.address ??
    privyUser?.linkedAccounts?.find((a) => a.type === "wallet")?.address ??
    wallets?.[0]?.address;

  useEffect(() => {
    if (!authenticated || !walletAddress) {
      setUser(null);
      return;
    }

    // Only fetch if we don't already have this user loaded
    if (!user || user.walletAddress !== walletAddress) {
      fetchUser(walletAddress);
    }
  }, [authenticated, walletAddress, fetchUser, setUser, user]);

  const role = user?.role as AppUserRole | undefined;
  return {
    user,
    role: role && ["student", "professor", "admin"].includes(role) ? role : null,
    isLoading,
  };
}
