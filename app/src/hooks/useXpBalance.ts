"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { fetchConfig, fetchXpBalance } from "@/lib/solana/queries";
import { XP_MINT } from "@/lib/solana/constants";
import logger from "@/lib/logger";

export function useXpBalance() {
  const { publicKey } = useWallet();
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;
    let cancelled = false;

    const poll = async () => {
      if (document.visibilityState === "hidden") return;
      setLoading(true);
      try {
        let xpMintPubkey: import("@solana/web3.js").PublicKey | null = null;
        if (XP_MINT) {
          xpMintPubkey = XP_MINT;
        } else {
          const config = await fetchConfig();
          if (config) xpMintPubkey = config.xpMint;
        }
        if (xpMintPubkey && !cancelled) {
          const balance = await fetchXpBalance(publicKey, xpMintPubkey);
          if (!cancelled) {
            setXp(balance);
            setError(null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          logger.error("[useXpBalance] Failed to load XP balance:", err);
          setError("Failed to load XP balance");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && !cancelled) poll();
    };

    poll();
    const interval = setInterval(poll, 30000);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [publicKey]);

  return { xp, loading, error };
}
