"use client";

import { XP_MINT, levelFromXp } from "@/lib/solana/constants";
import { connection } from "@/lib/solana/program";
import { learningProgressService } from "@/lib/services/learning-progress";
import type { StreakData } from "@/types";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

interface XpState {
  totalXp: number;
  onChainXp: number;
  level: number;
  streak?: StreakData;
  loading: boolean;
}

export const useXp = (walletAddress?: string, userId = "u-local") => {
  const [state, setState] = useState<XpState>({
    totalXp: 0,
    onChainXp: 0,
    level: 0,
    loading: true,
  });

  useEffect(() => {
    const load = async (): Promise<void> => {
      const offChainXp = await learningProgressService.getXpBalance(walletAddress ?? userId);
      const streak = await learningProgressService.getStreakData(userId);

      let onChainXp = 0;
      if (walletAddress) {
        try {
          const owner = new PublicKey(walletAddress);
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, {
            programId: TOKEN_2022_PROGRAM_ID,
          });

          const account = tokenAccounts.value.find(
            (item) =>
              item.account.data.parsed.info.mint === XP_MINT.toBase58(),
          );

          const balance = account?.account.data.parsed.info.tokenAmount.uiAmount;
          onChainXp = typeof balance === "number" ? balance : 0;
        } catch {
          onChainXp = 0;
        }
      }

      const totalXp = Math.floor(offChainXp + onChainXp);
      setState({
        totalXp,
        onChainXp,
        level: levelFromXp(totalXp),
        streak,
        loading: false,
      });
    };

    void load();
  }, [walletAddress, userId]);

  return state;
};
