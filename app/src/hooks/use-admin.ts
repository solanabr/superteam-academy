"use client";

import { useAuth } from "@/hooks/use-auth";
import { isAdminWallet } from "@/lib/admin";

export function useAdmin() {
  const { publicKey, connected } = useAuth();
  const walletAddress = publicKey?.toBase58() ?? null;
  const isAdmin = connected && isAdminWallet(walletAddress);
  return { isAdmin, walletAddress };
}
