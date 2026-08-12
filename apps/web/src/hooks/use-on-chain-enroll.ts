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
 * still enrol — within the window a wallet connected for any reason on the
 * same course page will complete the pending enrolment (the click WAS consent
 * to enrol in that course); past it, the attempt is dropped.
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
 * A sponsored `enroll` transaction plus the learner it was built FOR. The
 * server reads the learner from `profiles.wallet_address`, never from the
 * caller, so the transaction is only signable by that exact wallet — callers
 * must check `learner` against the wallet they are about to sign with.
 */
interface SponsoredEnroll {
  transaction: Transaction;
  learner: string | null;
}

/**
 * Fetch a platform-sponsored `enroll` transaction (#1004): backend-signed,
 * backend pays the fee and PDA rent. Returns null when sponsorship is
 * unavailable so each caller can decide its own fallback.
 */
async function fetchSponsoredEnrollTransaction(
  courseId: string
): Promise<SponsoredEnroll | null> {
  try {
    const res = await fetch("/api/enroll/sponsor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      transaction?: string;
      learner?: string;
    };
    if (!data.transaction) return null;
    // Decoded without Buffer: this runs in the browser, where Next does not
    // guarantee a Buffer polyfill in the App Router.
    const bytes = Uint8Array.from(atob(data.transaction), (c) =>
      c.charCodeAt(0)
    );
    return {
      transaction: Transaction.from(bytes),
      learner: typeof data.learner === "string" ? data.learner : null,
    };
  } catch {
    return null;
  }
}

type CustodialOutcome =
  | { status: "enrolled"; signature: string | null }
  | { status: "unavailable" }
  | { status: "failed"; message: string };

/**
 * Attempt a fully server-side enrolment via the custodial Academy Wallet
 * route. "unavailable" means this path does not apply (feature off, or the
 * account already has a real wallet) and the caller should fall through to
 * the next option; "failed" is a real error worth surfacing.
 */
async function tryCustodialEnroll(courseId: string): Promise<CustodialOutcome> {
  let res: Response;
  try {
    res = await fetch("/api/enroll/custodial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
  } catch {
    return { status: "unavailable" };
  }

  if (res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      signature?: string | null;
    };
    return { status: "enrolled", signature: data.signature ?? null };
  }

  let errorKey: string | null = null;
  try {
    const data = (await res.json()) as { error?: string };
    if (typeof data.error === "string") errorKey = data.error;
  } catch {
    // Unparseable body — fall through with errorKey null.
  }

  // Not-applicable cases, never worth an error message: the feature is off,
  // or the account has a real linked wallet and must enrol through it.
  if (errorKey === "custodialDisabled" || res.status === 409) {
    return { status: "unavailable" };
  }

  return {
    status: "failed",
    message: errorKey ?? "Enrollment failed. Please try again.",
  };
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
  // fee payer, which would undo the sponsorship. Only usable when the linked
  // wallet the server built it for IS the connected wallet; on a mismatch the
  // self-paid path below still works, because it builds for `learner` directly.
  if (
    sponsored &&
    (sponsored.learner === null || sponsored.learner === learner.toBase58())
  ) {
    return sponsored.transaction;
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
      // First choice for a walletless account: the custodial Academy Wallet —
      // the whole enrolment happens server-side, so there is no redirect, no
      // extension, and no signing prompt at all. The route itself refuses
      // accounts that already linked a real wallet (409 → "unavailable"), so
      // trying it first can never hijack an existing wallet's enrolments.
      setEnrollError(null);
      setIsEnrolling(true);
      try {
        const custodial = await tryCustodialEnroll(courseId);
        if (custodial.status === "enrolled") {
          trackEvent("enrollment_onchain", {
            courseId,
            signature: custodial.signature ?? "already-enrolled",
            wallet: "custodial",
          });
          dispatchToast("Enrolled successfully!", "success");
          onSuccess?.();
          return;
        }
        if (custodial.status === "failed") {
          setEnrollError(custodial.message);
          dispatchToast(custodial.message, "warning");
          onError?.(custodial.message);
          return;
        }
        // "unavailable" — fall through to embedded-wallet provisioning or the
        // extension-wallet modal below.
      } finally {
        setIsEnrolling(false);
      }

      if (phantomEnabled) {
        // Provisioning is only right for an account with NO linked wallet:
        // PhantomAuthHandler deliberately refuses to link a second wallet, so
        // a freshly provisioned one could never sign for the learner address
        // the sponsor route builds for. An account whose linked wallet came
        // from Phantom Connect reconnects the SAME wallet (user-wallet scoped
        // to their Google account), so it may proceed; an extension-linked
        // account is sent to connect that extension instead.
        const { createClient } = await import("@/lib/supabase/client");
        const { data: profile } = await createClient()
          .from("profiles")
          .select("wallet_address, prefs")
          .eq("id", userId)
          .maybeSingle();
        const prefs = profile?.prefs;
        const linkedIsEmbedded =
          typeof prefs === "object" &&
          prefs !== null &&
          !Array.isArray(prefs) &&
          (prefs as Record<string, unknown>).walletProvider ===
            "phantom-embedded";
        if (profile?.wallet_address && !linkedIsEmbedded) {
          setWalletModalVisible(true);
          return;
        }

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
          const sponsored = await fetchSponsoredEnrollTransaction(courseId);
          if (!sponsored) {
            throw new Error("Enrollment sponsorship is unavailable");
          }
          // The server built the transaction for the account's LINKED wallet;
          // if the embedded wallet connected in this browser is a different
          // one (e.g. a Phantom session from another Google account), its
          // signature can never satisfy the transaction. Fail with the real
          // reason instead of an opaque signature error at submission.
          if (
            sponsored.learner !== null &&
            sponsored.learner !== phantomAddress
          ) {
            const msg =
              "This account is linked to a different wallet. Connect that wallet to enroll.";
            setEnrollError(msg);
            dispatchToast(msg, "warning");
            onError?.(msg);
            return;
          }
          const signed = await withTimeout(
            phantomSignTransaction(sponsored.transaction),
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
  // redirect: fires once a signed-in user lands back on the course they
  // clicked Enroll for. Deliberately does NOT wait for a wallet — a plain
  // Google sign-up has none, and handleEnroll's walletless path (custodial
  // first, then embedded-wallet provisioning, then the wallet modal) is
  // exactly the continuation their click asked for. The ref (not just the
  // consumed marker) guards StrictMode's double effect-run — both runs see
  // the marker before either removal lands.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current) return;
    if (!userId) return;
    // With Phantom Connect enabled, a return from ITS provisioning redirect
    // has the session still rehydrating (autoConnect in flight) — resuming
    // walletless here would race it into the wrong path. Wait for a wallet in
    // that case; with Phantom off, resume immediately and let the custodial
    // path finish the click.
    if (phantomEnabled && !phantomAddress && publicKey === null) return;
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
