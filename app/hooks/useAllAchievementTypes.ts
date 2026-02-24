"use client";

import { useQuery } from "@tanstack/react-query";
import { useProgram } from "./useProgram";

export function useAllAchievementTypes() {
  const program = useProgram();

  return useQuery({
    queryKey: ["achievementTypes"],
    queryFn: async () => {
      if (!program) return [];
      const accounts = await (
        program.account as {
          achievementType: {
            all: () => Promise<
              Array<{ publicKey: import("@solana/web3.js").PublicKey; account: unknown }>
            >;
          };
        }
      ).achievementType.all();
      return accounts;
    },
    enabled: !!program,
    refetchInterval: 30_000,
  });
}
