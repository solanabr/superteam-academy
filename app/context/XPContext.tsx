"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

function getLevelFromXP(xp: number) {
  return Math.floor(Math.sqrt(xp / 100));
}

function getXPProgressPercent(xp: number) {
  const level = getLevelFromXP(xp);
  const current = level * level * 100;
  const next = (level + 1) * (level + 1) * 100;
  return ((xp - current) / (next - current)) * 100;
}

interface XPContextType {
  xp: number;
  level: number;
  progressPercent: number;
  addXP: (amount: number) => void;
}

const XPContext = createContext<XPContextType>({
  xp: 0, level: 0, progressPercent: 0, addXP: () => {},
});

export function XPProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet();
  const [xp, setXp] = useState(0);

  useEffect(() => {
    if (!publicKey) { setXp(0); return; }
    try {
      const stored = localStorage.getItem(`xp_${publicKey.toBase58()}`);
      if (stored) setXp(Number(stored));
      else setXp(0);
    } catch {}
  }, [publicKey]);

  function addXP(amount: number) {
    if (!publicKey) return;
    setXp((prev) => {
      const newXP = prev + amount;
      localStorage.setItem(`xp_${publicKey.toBase58()}`, newXP.toString());
      return newXP;
    });
  }

  return (
    <XPContext.Provider value={{
      xp,
      level: getLevelFromXP(xp),
      progressPercent: getXPProgressPercent(xp),
      addXP,
    }}>
      {children}
    </XPContext.Provider>
  );
}

export function useXP() {
  return useContext(XPContext);
}