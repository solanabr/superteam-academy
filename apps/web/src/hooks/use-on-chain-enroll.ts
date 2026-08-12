"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import type { Connection, PublicKey } from "@solana/web3.js";
import { buildEnrollInstruction } from "@/lib/solana/instructions";
import { trackEvent } from "@/lib/analytics";
import {
  parseProgramError,
  preflightTransaction,
} from "@/lib/solana/program-errors";
import { usePhantomConnect } from "@/components/auth/phantom-connect-provider";
import { dispatchToast } from "@/components/ui/toast-container";

const TX_TIMEOUT_MS = 30_000;

/**
 * Pending-enroll marker (walletless enrolment, #1004 follow-up).
 *
 * Provisioning an embedded wallet is a redirect flow, so the Enroll click that
 * started it is gone by the time the learner is back with a wallet. The marker
 * carries that intent across the redirect; the resume effect below completes
 * the enrolment without a second click. sessionStorage on purpose — the
 * redirect returns to the same tab, and the intent must not leak to other tabs
 * or survive the browser closing. The TTL bounds how stale a click can be and
 * still enrol: past it, an abandoned attempt must not surprise-enrol the
 * learner days later.
 */
const PENDING_ENROLL_KEY = "pendingEnrollCourseId";
const PENDING_ENROLL_TTL_MS = 15 * 60 * 1000;

function rememberPendingEnroll(courseId: string): void {
  try {
    sessionStorage.setItem(
      PENDING_ENROLL_KEY,
      JSON.stringify({
        courseId,
        expiresAt: Date.now() + PENDING_ENROLL_TTL_MS,
      })
    );
  } catch {
    // Storage unavailable — the learner just clicks Enroll again after auth.
  }
}

function takePendingEnroll(courseId: string): boolean {
  try {
    const raw = sessionStorage.getItem(PENDING_ENROLL_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as {
      courseId?: unknown;
      expiresAt?: unknown;
    };
    if (parsed.courseId !== courseId) return false;
    // Consumed on match whether fresh or expired — either way this attempt
    // is over and must not re-fire on a later visit.
    sessionStorage.removeItem(PENDING_ENROLL_KEY);
    return (
      typeof parsed.expiresAt === "number" && parsed.expiresAt > Date.now()
    );
  } catch {
    return false;
  }
}

/**
 * Fetch a platform-sponsored `enroll` transaction (#1004): backend-signed,
 * backend pays the fee and PDA rent. Returns null when sponsorship is
 * unavailable so each caller can decide its own fallback.
 */
async function fetchSponsoredEnrollTransaction(
  courseId: string
): Promise<Transaction | null> {
  try {
    const res = await fetch("/api/enroll/sponsor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { transaction?: string };
    if (!data.transaction) return null;
    // Decoded without Buffer: this runs in the browser, where Next does not
    // guarantee a Buffer polyfill in the App Router.
    const bytes = Uint8Array.from(atob(data.transaction), (c) =>
      c.charCodeAt(0)
    );
    return Transaction.from(bytes);
  } catch {
    return null;
  }
}

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
  const sponsored = await fetchSponsoredEnrollTransaction(courseId);
  // Deliberately NOT preflighted — preflightTransaction assigns the learner as
  // fee payer, which would undo the sponsorship.
  if (sponsored) return sponsored;

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
  const {
    enabled: phantomEnabled,
    address: phantomAddress,
    connect: phantomConnect,
    signTransaction: phantomSignTransaction,
  } = usePhantomConnect();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const handleEnroll = useCallback(async () => {
    if (isEnrolling) return;

    if (!userId) {
      // The AuthModal's Phantom path redirects away; the marker lets the
      // resume effect finish this enrolment when the learner lands back.
      rememberPendingEnroll(courseId);
      onRequireAuth();
      return;
    }

    const hasEmbeddedWallet = phantomEnabled && phantomAddress !== null;

    if (!publicKey && !hasEmbeddedWallet) {
      if (phantomEnabled) {
        // Signed in but walletless (Google/GitHub OAuth account). Instead of
        // sending them off to install an extension, provision an embedded
        // wallet on the spot: `connect` redirects, PhantomAuthHandler links
        // the new wallet to this account on return, and the marker resumes
        // the enrolment. Zero installs.
        rememberPendingEnroll(courseId);
        try {
          await phantomConnect("google");
        } catch {
          // Pre-redirect failure (closed popup, Phantom outage). Clear the
          // intent so an abandoned attempt can't resume later, and say what
          // happened — the extension-wallet modal would be a dead end for
          // exactly the walletless learner this path serves.
          takePendingEnroll(courseId);
          dispatchToast(
            "Couldn't set up your wallet. Please try again.",
            "warning"
          );
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
        if (publicKey) {
          // Extension wallet: sponsored when available, self-paid otherwise.
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
        } else {
          // Embedded wallet: sponsored ONLY — it holds zero SOL, so a
          // self-paid fallback could never succeed and would only surface a
          // confusing "insufficient funds" error.
          const tx = await fetchSponsoredEnrollTransaction(courseId);
          if (!tx) {
            throw new Error("Enrollment sponsorship is unavailable");
          }
          const signed = await withTimeout(
            phantomSignTransaction(tx),
            TX_TIMEOUT_MS,
            "Wallet signing"
          );
          // Submitted through the app's own connection rather than the SDK, so
          // the transaction lands on the cluster the app is configured for.
          onChainSignature = await connection.sendRawTransaction(
            signed.serialize(),
            { skipPreflight: true }
          );
        }
        await withTimeout(
          connection.confirmTransaction(onChainSignature, "confirmed"),
          TX_TIMEOUT_MS,
          "Transaction confirmation"
        );
        trackEvent("enrollment_onchain", {
          courseId,
          signature: onChainSignature,
          wallet: publicKey ? "adapter" : "embedded",
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
    phantomEnabled,
    phantomAddress,
    phantomConnect,
    phantomSignTransaction,
  ]);

  // Resume an enrolment interrupted by an auth or wallet-provisioning
  // redirect: fires once a signed-in user with a usable wallet lands back on
  // the course they clicked Enroll for. The ref (not just the consumed
  // marker) guards StrictMode's double effect-run — both runs see the marker
  // before either removal lands.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current) return;
    if (!userId) return;
    const walletReady =
      publicKey !== null || (phantomEnabled && phantomAddress);
    if (!walletReady) return;
    if (!takePendingEnroll(courseId)) return;
    resumedRef.current = true;
    void handleEnroll();
  }, [
    userId,
    courseId,
    publicKey,
    phantomEnabled,
    phantomAddress,
    handleEnroll,
  ]);

  return { isEnrolling, handleEnroll, enrollError };
}
