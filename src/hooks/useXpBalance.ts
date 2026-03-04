"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { XP_MINT, TOKEN_2022_PROGRAM_ID } from "@/lib/anchor";

export interface XpBalance {
  amount: number;
  level: number;
  ataExists: boolean;
}

export function useXpBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  return useQuery<XpBalance>({
    queryKey: ["xp-balance", publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return { amount: 0, level: 0, ataExists: false };

      const xpAta = getAssociatedTokenAddressSync(
        XP_MINT,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
      );

      try {
        const balance = await connection.getTokenAccountBalance(xpAta);
        const amount = Number(balance.value.amount);
        return {
          amount,
          level: Math.floor(Math.sqrt(amount / 100)),
          ataExists: true,
        };
      } catch {
        return { amount: 0, level: 0, ataExists: false };
      }
    },
    staleTime: 30 * 1000,
    enabled: !!publicKey,
  });
}
