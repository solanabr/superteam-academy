"use client";

import { useContext } from "react";
import { AuthContext } from "@/components/auth-provider";
import type { AuthState } from "@/components/auth-provider";

export type { AuthState };
export type { ConnectedStandardSolanaWallet } from "@privy-io/react-auth/solana";

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
