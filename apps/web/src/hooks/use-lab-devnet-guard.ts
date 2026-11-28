"use client";

import { useCallback, useEffect, useState } from "react";
import { useLabConnection } from "@/lib/solana/lab-connection";
import { verifyLabDevnet } from "@/lib/solana/lab-guard";

/** `refused`: the lab RPC is not on devnet, or its genesis hash was unreadable. */
export type LabGuardStatus = "checking" | "devnet" | "refused";

export interface LabDevnetGuard {
  status: LabGuardStatus;
  /**
   * Resolves `true` only when the lab connection is on devnet. Await it before
   * every lab action that signs or sends, and stop on `false`.
   */
  ensureDevnet: () => Promise<boolean>;
}

/**
 * The lab's devnet guard for a component (`lib/solana/lab-guard.ts`). It
 * checks on mount so a refused lab shows the paused notice before the learner
 * acts.
 */
export function useLabDevnetGuard(): LabDevnetGuard {
  const { connection } = useLabConnection();
  const [status, setStatus] = useState<LabGuardStatus>("checking");

  useEffect(() => {
    let cancelled = false;
    void verifyLabDevnet(connection).then((devnet) => {
      if (!cancelled) setStatus(devnet ? "devnet" : "refused");
    });
    return () => {
      cancelled = true;
    };
  }, [connection]);

  const ensureDevnet = useCallback(async () => {
    const devnet = await verifyLabDevnet(connection);
    setStatus(devnet ? "devnet" : "refused");
    return devnet;
  }, [connection]);

  return { status, ensureDevnet };
}
