"use client";

import { useState, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useWalletCompat } from "@/lib/hooks/use-wallet-compat";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { buildCloseEnrollmentTransaction } from "@/lib/onchain/instructions/close-enrollment";
import bs58 from "bs58";

export type CloseEnrollmentState =
  | "idle"
  | "building"
  | "signing"
  | "confirming"
  | "success"
  | "error";

export interface UseCloseEnrollmentReturn {
  closeEnrollment: (courseId: string) => Promise<boolean>;
  state: CloseEnrollmentState;
  txSignature: string | null;
  error: string | null;
  reset: () => void;
}

export function useCloseEnrollment(): UseCloseEnrollmentReturn {
  const { publicKey, connected, wallet } = useWalletCompat();
  const { connection } = useConnection();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const [state, setState] = useState<CloseEnrollmentState>("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setState("idle");
    setTxSignature(null);
    setError(null);
  }, []);

  const closeEnrollment = useCallback(
    async (courseId: string): Promise<boolean> => {
      if (!connected || !publicKey || !wallet) {
        setError("Connect your wallet to close enrollment");
        setState("error");
        return false;
      }

      setState("building");
      setError(null);

      try {
        const tx = await buildCloseEnrollmentTransaction(
          courseId,
          publicKey,
          connection,
        );

        setState("signing");
        const serialized = tx.serialize({ requireAllSignatures: false });
        const receipt = await signAndSendTransaction({
          transaction: new Uint8Array(serialized),
          wallet,
        });

        setState("confirming");
        const sig = bs58.encode(receipt.signature);
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          { signature: sig, blockhash, lastValidBlockHeight },
          "confirmed",
        );

        setTxSignature(sig);
        setState("success");
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        setError(msg);
        setState("error");
        return false;
      }
    },
    [connected, publicKey, wallet, connection, signAndSendTransaction],
  );

  return { closeEnrollment, state, txSignature, error, reset };
}
