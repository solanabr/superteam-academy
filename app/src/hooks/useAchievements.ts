"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { getAchievementReceiptPda } from "@/lib/solana/pdas";
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/gamification/achievements";
import { getConnection } from "@/lib/solana/program";
import logger from "@/lib/logger";

const POLL_INTERVAL_MS = 60_000;

export function useAchievements(walletPublicKey: PublicKey | null | undefined): {
  unlockedBitmap: bigint;
  isLoading: boolean;
  refetch: () => void;
} {
  const [unlockedBitmap, setUnlockedBitmap] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAchievements = useCallback(async () => {
    if (!walletPublicKey) return;
    if (document.visibilityState === "hidden") return;

    setIsLoading(true);
    try {
      const connection = getConnection();

      const pdaAddresses = ACHIEVEMENT_DEFINITIONS.map(
        (achievement) => getAchievementReceiptPda(achievement.id, walletPublicKey)[0]
      );

      const accountInfos = await connection.getMultipleAccountsInfo(pdaAddresses);

      let bitmap = 0n;
      for (let i = 0; i < ACHIEVEMENT_DEFINITIONS.length; i++) {
        const def = ACHIEVEMENT_DEFINITIONS[i];
        if (def && accountInfos[i] !== null) {
          bitmap |= 1n << BigInt(def.bitmapIndex);
        }
      }

      setUnlockedBitmap(bitmap);
    } catch (err) {
      logger.error("[useAchievements] Failed to fetch achievement receipts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [walletPublicKey]);

  useEffect(() => {
    if (!walletPublicKey) {
      setUnlockedBitmap(0n);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const runFetch = async () => {
      if (!walletPublicKey) return;
      if (document.visibilityState === "hidden") return;

      setIsLoading(true);
      try {
        const connection = getConnection();

        const pdaAddresses = ACHIEVEMENT_DEFINITIONS.map(
          (achievement) => getAchievementReceiptPda(achievement.id, walletPublicKey)[0]
        );

        const accountInfos = await connection.getMultipleAccountsInfo(pdaAddresses);

        let bitmap = 0n;
        for (let i = 0; i < ACHIEVEMENT_DEFINITIONS.length; i++) {
          const def = ACHIEVEMENT_DEFINITIONS[i];
          if (def && accountInfos[i] !== null) {
            bitmap |= 1n << BigInt(def.bitmapIndex);
          }
        }

        if (!cancelled) setUnlockedBitmap(bitmap);
      } catch (err) {
        if (!cancelled) logger.error("[useAchievements] Failed to fetch achievement receipts:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runFetch();
      }
    };

    runFetch();
    const interval = setInterval(runFetch, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [walletPublicKey]);

  return { unlockedBitmap, isLoading, refetch: fetchAchievements };
}
