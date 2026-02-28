"use client";

import { useState, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useWalletCompat } from "@/lib/hooks/use-wallet-compat";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { buildEnrollTransaction, isEnrolledOnChain } from "@/lib/onchain/enroll-tx";
import bs58 from "bs58";

export type OnChainEnrollState =
  | "idle"
  | "checking"
  | "building"
  | "signing"
  | "confirming"
  | "success"
  | "already_enrolled"
  | "error";

export interface UseEnrollOnChainReturn {
  enroll: (courseId: string) => Promise<boolean>;
  state: OnChainEnrollState;
  txSignature: string | null;
  error: string | null;
  reset: () => void;
}

export function useEnrollOnChain(): UseEnrollOnChainReturn {
  const { publicKey, connected, wallet } = useWalletCompat();
  const { connection } = useConnection();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const [state, setState] = useState<OnChainEnrollState>("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setState("idle");
    setTxSignature(null);
    setError(null);
  }, []);

  const enroll = useCallback(
    async (courseId: string): Promise<boolean> => {
      if (!connected || !publicKey || !wallet) {
        setError("Connect your wallet to enroll");
        setState("error");
        return false;
      }

      setState("checking");
      setError(null);

      try {
        const alreadyEnrolled = await isEnrolledOnChain(courseId, publicKey, connection);
        if (alreadyEnrolled) {
          setState("already_enrolled");
          return true;
        }

        setState("building");
        const tx = await buildEnrollTransaction(courseId, publicKey, connection);

        setState("signing");
        const serialized = tx.serialize({ requireAllSignatures: false });
        const receipt = await signAndSendTransaction({
          transaction: new Uint8Array(serialized),
          wallet,
        });

        setState("confirming");
        const sig = bs58.encode(receipt.signature);
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");

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

  return { enroll, state, txSignature, error, reset };
}
