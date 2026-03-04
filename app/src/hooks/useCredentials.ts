"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import logger from "@/lib/logger";
import type { HeliusAsset } from "@/lib/solana/helius";

export function useCredentials() {
  const { publicKey } = useWallet();
  const [credentials, setCredentials] = useState<HeliusAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;
    let cancelled = false;

    const loadCredentials = async () => {
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/helius/credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner: publicKey.toBase58() }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: HeliusAsset[] = await res.json();
        if (!cancelled) setCredentials(data);
      } catch (err) {
        if (!cancelled) {
          logger.error("[useCredentials] Failed to load credentials:", err);
          setError("Failed to load credentials");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCredentials();
    return () => { cancelled = true; };
  }, [publicKey]);

  return { credentials, loading, error };
}
