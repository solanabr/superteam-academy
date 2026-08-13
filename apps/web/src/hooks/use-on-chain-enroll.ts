"use client";

import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction } from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";
import { buildEnrollInstruction } from "@/lib/solana/instructions";
import {
  getDynamicSolanaAccount,
  signWithDynamicWallet,
} from "@/lib/dynamic/solana";
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
 * An embedded wallet (Dynamic) arrives with zero SOL, so the self-paid
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

    // Prefer the wallet-adapter wallet; fall back to the Dynamic embedded
    // wallet an email sign-up holds. Asking the learner to CONNECT a wallet is
    // only the right answer when neither exists — an email sign-up already has
    // one, and the connect modal was the exact dead end embedded wallets were
    // brought in to remove.
    const dynamicAccount = publicKey ? null : getDynamicSolanaAccount();
    const learner =
      publicKey ??
      (dynamicAccount ? new PublicKey(dynamicAccount.address) : null);
    if (!learner) {
      setWalletModalVisible(true);
      return;
    }

    setEnrollError(null);
    setIsEnrolling(true);

    try {
      let onChainSignature: string;

      try {
        const tx = await buildEnrollTransaction(courseId, learner, connection);
        // The embedded wallet signs via Dynamic's MPC service — no prompt, no
        // wallet-adapter — and the signed bytes are submitted directly. The
        // MPC signer attaches its signature to the existing transaction, so a
        // sponsored enroll keeps the backend's signature.
        const sendViaWallet = dynamicAccount
          ? async () => {
              const signed = await signWithDynamicWallet(tx, dynamicAccount);
              return connection.sendRawTransaction(signed.serialize(), {
                skipPreflight: true,
              });
            }
          : () => sendTransaction(tx, connection, { skipPreflight: true });
        onChainSignature = await withTimeout(
          sendViaWallet(),
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
