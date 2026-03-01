"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getCredentials } from "@/services/credentials";
import { getAchievements } from "@/services/credentials";
import type { Credential, Achievement } from "@/types";

export function useCredentials() {
  const { publicKey } = useWallet();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setCredentials([]);
      setAchievements([]);
      return;
    }
    setLoading(true);
    try {
      const [creds, achvs] = await Promise.all([
        getCredentials(publicKey.toBase58()),
        getAchievements(publicKey.toBase58()),
      ]);
      setCredentials(creds);
      setAchievements(achvs);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { credentials, achievements, loading, refresh };
}
