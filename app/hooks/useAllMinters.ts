"use client";

import { useQuery } from "@tanstack/react-query";
import { useProgram } from "./useProgram";

export function useAllMinters() {
  const program = useProgram();

  return useQuery({
    queryKey: ["minters"],
    queryFn: async () => {
      if (!program) return [];
      const accounts = await (
        program.account as {
          minterRole: {
            all: () => Promise<
              Array<{ publicKey: import("@solana/web3.js").PublicKey; account: unknown }>
            >;
          };
        }
      ).minterRole.all();
      return accounts;
    },
    enabled: !!program,
    refetchInterval: 30_000,
  });
}
