"use client";

import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import { buildEnrollInstruction } from "@/lib/solana/instructions";
import { trackEvent } from "@/lib/analytics";

interface UseOnChainEnrollOptions {
  courseId: string;
  userId: string | null;
  onSuccess?: () => void;
}

interface UseOnChainEnrollResult {
  isEnrolling: boolean;
  handleEnroll: () => Promise<void>;
  enrollError: string | null;
}

export function useOnChainEnroll({
  courseId,
  userId,
  onSuccess,
}: UseOnChainEnrollOptions): UseOnChainEnrollResult {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const handleEnroll = useCallback(async () => {
    if (isEnrolling || !userId) return;

    if (!publicKey) {
      setWalletModalVisible(true);
      return;
    }

    setEnrollError(null);
    setIsEnrolling(true);

    try {
      let onChainSignature: string;

      try {
        const ix = buildEnrollInstruction(courseId, publicKey);
        const tx = new Transaction().add(ix);
        onChainSignature = await sendTransaction(tx, connection);
        await connection.confirmTransaction(onChainSignature, "confirmed");
        trackEvent("enrollment_onchain", {
          courseId,
          signature: onChainSignature,
        });
      } catch (err) {
        setEnrollError(
          err instanceof Error ? err.message : "Transaction failed"
        );
        return;
      }

      // On-chain TX succeeded — sync to Supabase via API.
      // All enrollment writes must go through the server-side route which
      // verifies the transaction on-chain before writing to the DB.
      const res = await fetch("/api/enrollment/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          txSignature: onChainSignature,
          action: "enroll",
        }),
      });

      if (res.ok) {
        onSuccess?.();
        return;
      }

      // Sync failed — the on-chain Enrollment PDA exists but the Supabase
      // mirror could not be updated. Surface the error so the user can retry.
      setEnrollError(
        "Enrollment confirmed on-chain but sync failed. Please refresh the page."
      );
    } finally {
      setIsEnrolling(false);
    }
  }, [
    userId,
    courseId,
    publicKey,
    sendTransaction,
    connection,
    onSuccess,
    setWalletModalVisible,
    isEnrolling,
  ]);

  return { isEnrolling, handleEnroll, enrollError };
}
