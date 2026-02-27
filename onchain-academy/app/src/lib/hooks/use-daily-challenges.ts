"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/lib/wallet/context";
import {
  challengeService,
  type DailyChallenge,
} from "@/lib/services/challenge-service";
import type { ChallengeType } from "@/lib/data/challenge-pool";

export function useDailyChallenges() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58();

  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [timeUntilReset, setTimeUntilReset] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const state = challengeService.getDailyChallenges(wallet);
    setChallenges(state.challenges);
    setTimeUntilReset(challengeService.getTimeUntilReset());
    setLoading(false);
  }, [wallet]);

  // Initial load and wallet change
  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  // Countdown timer — updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = challengeService.getTimeUntilReset();
      setTimeUntilReset(remaining);

      // If we crossed midnight, refresh challenges
      if (remaining > 86_400_000 - 1500) {
        refresh();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [refresh]);

  const updateProgress = useCallback(
    (type: ChallengeType, increment: number) => {
      if (!wallet) return;
      challengeService.updateProgress(wallet, type, increment);
      refresh();
    },
    [wallet, refresh],
  );

  const claimReward = useCallback(
    (challengeId: string): number => {
      if (!wallet) return 0;
      const xp = challengeService.claimReward(wallet, challengeId);
      refresh();
      return xp;
    },
    [wallet, refresh],
  );

  return {
    challenges,
    timeUntilReset,
    updateProgress,
    claimReward,
    loading,
  };
}
