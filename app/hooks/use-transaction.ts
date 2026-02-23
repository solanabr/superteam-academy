"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { solscanTxUrl } from "@/lib/format";
import { mapAnchorError } from "@/lib/errors";

export type TxState = "idle" | "signing" | "confirming" | "confirmed" | "error";

interface UseTxReturn {
  state: TxState;
  signature: string | null;
  error: string | null;
  execute: (fn: () => Promise<string>, locale?: string) => Promise<string | null>;
  reset: () => void;
}

export function useTransaction(): UseTxReturn {
  const [state, setState] = useState<TxState>("idle");
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setState("idle");
    setSignature(null);
    setError(null);
  }, []);

  const execute = useCallback(
    async (fn: () => Promise<string>, locale = "en"): Promise<string | null> => {
      try {
        setState("signing");
        setError(null);
        toast.loading("Waiting for signature...", { id: "tx" });

        const sig = await fn();
        setSignature(sig);
        setState("confirming");
        toast.loading("Confirming transaction...", { id: "tx" });

        setState("confirmed");
        toast.success("Transaction confirmed!", {
          id: "tx",
          action: {
            label: "View on Solscan",
            onClick: () => window.open(solscanTxUrl(sig), "_blank"),
          },
        });
        return sig;
      } catch (err) {
        setState("error");
        const msg = mapAnchorError(err, locale);
        setError(msg);
        toast.error(msg, { id: "tx" });
        return null;
      }
    },
    []
  );

  return { state, signature, error, execute, reset };
}
