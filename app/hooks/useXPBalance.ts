"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { fetchXPBalance } from "@/lib/onchain/LearningProgressService";

function getLevelFromXP(xp: number) {
  return Math.floor(Math.sqrt(xp / 100));
}

function getXPProgressPercent(xp: number) {
  const level = getLevelFromXP(xp);
  const current = level * level * 100;
  const next = (level + 1) * (level + 1) * 100;
  if (next === current) return 100;
  return Math.round(((xp - current) / (next - current)) * 100);
}

function getXPForNextLevel(xp: number) {
  const level = getLevelFromXP(xp);
  return (level + 1) * (level + 1) * 100;
}

export function useXPBalance() {
  const { publicKey } = useWallet();
  const [xp, setXp] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setXp(0);
      return;
    }
    setIsLoading(true);
    try {
      const balance = await fetchXPBalance(publicKey);
      setXp(balance);
    } catch {
      setXp(0);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    refresh();
    // Refresh every 30 seconds
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    xp,
    level: getLevelFromXP(xp),
    progressPercent: getXPProgressPercent(xp),
    xpForNextLevel: getXPForNextLevel(xp),
    isLoading,
    refresh,
  };
}
