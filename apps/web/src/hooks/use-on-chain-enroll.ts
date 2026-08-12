"use client";

import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import type { Connection, PublicKey } from "@solana/web3.js";
import { buildEnrollInstruction } from "@/lib/solana/instructions";
import { isOfflineEnrollCourse } from "@/lib/events/offline-course";
import { trackEvent } from "@/lib/analytics";
import {
  parseProgramError,
  preflightTransaction,
} from "@/lib/solana/program-errors";
import { dispatchToast } from "@/components/ui/toast-container";

const TX_TIMEOUT_MS = 30_000;

/**
 * Prefer a platform-sponsored enrolment (#1004), fall back to self-paid.
 *
 * A Phantom Connect embedded wallet arrives with zero SOL, so the self-paid
 * path fails for precisely the learners embedded wallets exist to serve. The
 * sponsored route hands back a transaction the backend has already signed and
 * will pay the fee and PDA rent for; the learner's wallet only adds its own
 * signature.
 *
 * Any failure falls through to the original path, so a funded wallet can still
 * enrol if sponsorship is down or unconfigured — this adds a cheaper route in,
 * not a new way to fail.
 */
async function buildEnrollTransaction(
  courseId: string,
  learner: PublicKey,
  connection: Connection
): Promise<Transaction> {
  try {
    const res = await fetch("/api/enroll/sponsor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    if (res.ok) {
      const data = (await res.json()) as { transaction?: string };
      if (data.transaction) {
        // Decoded without Buffer: this runs in the browser, where Next does not
        // guarantee a Buffer polyfill in the App Router.
        const bytes = Uint8Array.from(atob(data.transaction), (c) =>
          c.charCodeAt(0)
        );
        // Deliberately NOT preflighted — preflightTransaction assigns the
        // learner as fee payer, which would undo the sponsorship.
        return Transaction.from(bytes);
      }
    }
  } catch {
    // Fall through to self-pay.
  }

  const tx = new Transaction().add(buildEnrollInstruction(courseId, learner));
  await preflightTransaction(tx, connection, learner);
  return tx;
}

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

interface UseOnChainEnrollOptions {
  courseId: string;
  userId: string | null;
  /**
   * Called instead of enrolling when there is no signed-in user — callers
   * open the AuthModal here. Required so an anonymous Enroll click can never
   * be a silent no-op (#556).
   */
  onRequireAuth: () => void;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

interface UseOnChainEnrollResult {
  isEnrolling: boolean;
  handleEnroll: () => Promise<void>;
  enrollError: string | null;
}

export function useOnChainEnroll({
  courseId,
  userId,
  onRequireAuth,
  onSuccess,
  onError,
}: UseOnChainEnrollOptions): UseOnChainEnrollResult {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const handleEnroll = useCallback(async () => {
    if (isEnrolling) return;

    if (!userId) {
      onRequireAuth();
      return;
    }

    if (!publicKey) {
      // Event mode: a course that may be taken with no wallet at all. Enrol in
      // Supabase and let them start immediately — asking someone at an event to
      // install a wallet app on their phone is where we lose the room. The
      // course is replayed on-chain when they link a wallet later.
      if (isOfflineEnrollCourse(courseId)) {
        setEnrollError(null);
        setIsEnrolling(true);
        try {
          const res = await fetch("/api/enroll/offline", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId }),
          });
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(body.error ?? "Could not enrol");
          }
          trackEvent("enrollment_offline", { courseId });
          onSuccess?.();
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Could not enrol";
          setEnrollError(message);
          onError?.(message);
        } finally {
          setIsEnrolling(false);
        }
        return;
      }

      setWalletModalVisible(true);
      return;
    }

    setEnrollError(null);
    setIsEnrolling(true);

    try {
      let onChainSignature: string;

      try {
        const tx = await buildEnrollTransaction(
          courseId,
          publicKey,
          connection
        );
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
        trackEvent("enrollment_onchain", {
          courseId,
          signature: onChainSignature,
        });
      } catch (err: unknown) {
        const parsed = parseProgramError(err);

        // code 0 = SystemError::AccountAlreadyInUse: the enrollment PDA already
        // exists on-chain (Helius webhook fell behind or a prior tx succeeded but
        // timed out before confirmation). Treat as success so the user reaches
        // the course rather than seeing a cryptic error.
        if (parsed.code === 0) {
          dispatchToast("Enrolled successfully!", "success");
          onSuccess?.();
          return;
        }

        const msg = parsed.fallback;
        setEnrollError(msg);
        dispatchToast(msg, "warning");
        onError?.(msg);
        return;
      }

      // On-chain TX succeeded — Helius webhook will sync to Supabase.
      dispatchToast("Enrolled successfully!", "success");
      onSuccess?.();
    } finally {
      setIsEnrolling(false);
    }
  }, [
    userId,
    courseId,
    onRequireAuth,
    publicKey,
    sendTransaction,
    connection,
    onSuccess,
    onError,
    setWalletModalVisible,
    isEnrolling,
  ]);

  return { isEnrolling, handleEnroll, enrollError };
}
