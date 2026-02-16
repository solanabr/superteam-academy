"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";

export type AppUserRole = "student" | "professor" | "admin";

export type AppUser = {
  id: string;
  walletAddress: string;
  email: string | null;
  role: string;
};

export function useAppUser(): { user: AppUser | null; role: AppUserRole | null; isLoading: boolean } {
  const { authenticated, user: privyUser } = usePrivy();
  const { wallets } = useWallets();
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const walletAddress =
    privyUser?.wallet?.address ??
    privyUser?.linkedAccounts?.find((a) => a.type === "wallet")?.address ??
    wallets?.[0]?.address;

  useEffect(() => {
    if (!authenticated || !walletAddress) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetch(`/api/user?wallet=${encodeURIComponent(walletAddress)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          setUser(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authenticated, walletAddress]);

  const role = user?.role as AppUserRole | undefined;
  return {
    user,
    role: role && ["student", "professor", "admin"].includes(role) ? role : null,
    isLoading,
  };
}
