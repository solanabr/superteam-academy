"use client";

import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import { buildCloseEnrollmentInstruction } from "@/lib/solana/instructions";
import { trackEvent } from "@/lib/analytics";
import {
  parseProgramError,
  preflightTransaction,
} from "@/lib/solana/program-errors";
import { dispatchToast } from "@/components/ui/toast-container";

const TX_TIMEOUT_MS = 30_000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
        ms
      )
    ),
  ]);
}

interface UseOnChainUnenrollOptions {
  courseId: string;
  userId: string | null;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

interface UseOnChainUnenrollResult {
  isUnenrolling: boolean;
  handleUnenroll: () => Promise<void>;
  unenrollError: string | null;
}

export function useOnChainUnenroll({
  courseId,
  userId,
  onSuccess,
  onError,
}: UseOnChainUnenrollOptions): UseOnChainUnenrollResult {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [unenrollError, setUnenrollError] = useState<string | null>(null);

  const handleUnenroll = useCallback(async () => {
    if (isUnenrolling || !userId) return;

    if (!publicKey) {
      setWalletModalVisible(true);
      return;
    }

    setUnenrollError(null);
    setIsUnenrolling(true);

    try {
      let onChainSignature: string;

      try {
        const ix = buildCloseEnrollmentInstruction(courseId, publicKey);
        const tx = new Transaction().add(ix);
        await preflightTransaction(tx, connection, publicKey);
        onChainSignature = await withTimeout(
          sendTransaction(tx, connection, { skipPreflight: true }),
          TX_TIMEOUT_MS,
          "Wallet signing"
        );
        await withTimeout(
          connection.confirmTransaction(onChainSignature, "confirmed"),
          TX_TIMEOUT_MS,
          "Transaction confirmation"
        );
        trackEvent("unenrollment_onchain", {
          courseId,
          signature: onChainSignature,
        });
      } catch (err: unknown) {
        const parsed = parseProgramError(err);
        const msg = parsed.fallback;
        setUnenrollError(msg);
        dispatchToast(msg, "warning");
        onError?.(msg);
        return;
      }

      // On-chain TX succeeded — sync to Supabase via API
      const res = await fetch("/api/enrollment/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          txSignature: onChainSignature,
          action: "close",
        }),
      });

      if (res.ok) {
        onSuccess?.();
        return;
      }

      const msg =
        "Unenrollment confirmed on-chain but sync failed. Please refresh the page.";
      setUnenrollError(msg);
      dispatchToast(msg, "warning");
      onError?.(msg);
    } finally {
      setIsUnenrolling(false);
    }
  }, [
    userId,
    courseId,
    publicKey,
    sendTransaction,
    connection,
    onSuccess,
    onError,
    setWalletModalVisible,
    isUnenrolling,
  ]);

  return { isUnenrolling, handleUnenroll, unenrollError };
}
