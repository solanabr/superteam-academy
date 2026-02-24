"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getXpBalance } from "@/lib/xp-token";

export function useXpBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  return useQuery({
    queryKey: ["xpBalance", publicKey?.toBase58()],
    queryFn: () => getXpBalance(connection, publicKey!),
    enabled: !!publicKey,
    staleTime: 30_000,
  });
}
