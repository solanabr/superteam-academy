"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";
import {
  getRoleForWallet,
  hasPermission,
  type AdminPermission,
} from "@/lib/admin-constants";

export function useAdminGuard() {
  const router = useRouter();
  const { publicKey, connecting } = useWallet();
  const { isAuthenticated, isLoading, status } = useWalletAuth();

  // Grace period: on page reload, wallet adapter needs time to auto-connect.
  // Wait up to 1.5s before deciding the user is not admin.
  const [graceExpired, setGraceExpired] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setGraceExpired(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const walletAddress = publicKey?.toBase58() ?? null;
  const role = walletAddress ? getRoleForWallet(walletAddress) : null;
  const isAdmin = role !== null;

  // Still waiting if: wallet reconnecting, auth in progress, or grace period active
  const waiting =
    connecting ||
    isLoading ||
    (!graceExpired && (status === "idle" || status === "checking"));

  useEffect(() => {
    if (waiting) return;
    if (!isAuthenticated || !isAdmin) {
      router.replace("/");
    }
  }, [waiting, isAuthenticated, isAdmin, router]);

  // Clear grace period early once authenticated
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      setGraceExpired(true);
    }
  }, [isAuthenticated, isAdmin]);

  const can = (permission: AdminPermission): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  };

  return {
    isAdmin,
    role,
    can,
    isLoading: waiting || !isAuthenticated,
  };
}
