"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getLevelFromXP, getXPProgressPercent } from "@/lib/utils";

export function useXPBalance() {
  const { publicKey } = useWallet();
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) { setXp(0); return; }
    // Load from localStorage for now
    try {
      const stored = localStorage.getItem(`xp_${publicKey.toBase58()}`);
      if (stored) setXp(Number(stored));
    } catch {}
  }, [publicKey]);

  const level = getLevelFromXP(xp);
  const progressPercent = getXPProgressPercent(xp);

  return { xp, level, progressPercent, loading };
}