"use client";

import { useState, useEffect } from "react";
import type { Credential } from "@/services/interfaces";

interface OnChainProgress {
  credentials: Credential[];
  credentialCoursesCompleted: number;
  loading: boolean;
}

export function useOnChainProgress(
  walletAddress: string | null | undefined,
): OnChainProgress {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) {
      setCredentials([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    import("@/services/credentials")
      .then(({ credentialService }) =>
        credentialService.getCredentials(walletAddress),
      )
      .then((creds) => setCredentials(creds))
      .catch(() => setCredentials([]))
      .finally(() => setLoading(false));
  }, [walletAddress]);

  const credentialCoursesCompleted = credentials.reduce(
    (sum, c) => sum + (c.coursesCompleted ?? 1),
    0,
  );

  return { credentials, credentialCoursesCompleted, loading };
}
