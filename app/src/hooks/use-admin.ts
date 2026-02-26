"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { isAdminWallet } from "@/lib/admin";

export function useAdmin() {
  const { profile, isAuthenticated } = useAuth();

  const isAdmin = useMemo(
    () => isAuthenticated && isAdminWallet(profile?.walletAddress),
    [isAuthenticated, profile?.walletAddress],
  );

  return { isAdmin };
}
