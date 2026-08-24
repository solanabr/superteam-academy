"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import type { Connection, PublicKey } from "@solana/web3.js";
import { useAuth } from "@/lib/auth/auth-provider";
import { truncateAddress } from "@/lib/utils";
import { buildEnrollInstruction } from "@/lib/solana/instructions";
import {
  findWalletMismatch,
  isSameWallet,
  parseWalletAddress,
} from "@/lib/solana/linked-wallet";
import {
  isDynamicSessionExpiredError,
  signWithDynamicWallet,
} from "@/lib/dynamic/solana";
import {
  startDynamicSocialSignIn,
  type DynamicSocialProvider,
} from "@/lib/dynamic/social";
import { isDynamicEnabled } from "@/lib/dynamic/config";
import { useDynamicSessionState } from "@/hooks/use-dynamic-session-state";
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
type EnrollBuild =
  | { kind: "tx"; tx: Transaction }
  /** The sponsor built for a wallet that is not the one about to sign. */
  | { kind: "wrongLearner"; learner: string }
  /** Self-pay was the only route left, with no linked wallet to check against. */
  | { kind: "unverifiedWallet" };

async function buildEnrollTransaction(
  courseId: string,
  learner: PublicKey,
  linkedWallet: string | null,
  connection: Connection
): Promise<EnrollBuild> {
  try {
    const res = await fetch("/api/enroll/sponsor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        transaction?: string;
        learner?: string;
      };
      if (data.transaction) {
        // The route builds for the SESSION PROFILE's linked wallet, never for
        // one named by the client. If that is not the wallet about to sign,
        // the transaction is unsignable here and self-paying instead would
        // enrol the wrong wallet — stop. Checked against the linked wallet too
        // when one is known, so a route that ever built for something else
        // cannot pass just because the browser holds that same key.
        if (
          data.learner &&
          (!isSameWallet(data.learner, learner.toBase58()) ||
            (linkedWallet && !isSameWallet(data.learner, linkedWallet)))
        ) {
          return { kind: "wrongLearner", learner: data.learner };
        }
        // Decoded without Buffer: this runs in the browser, where Next does not
        // guarantee a Buffer polyfill in the App Router.
        const bytes = Uint8Array.from(atob(data.transaction), (c) =>
          c.charCodeAt(0)
        );
        // Deliberately NOT preflighted — preflightTransaction assigns the
        // learner as fee payer, which would undo the sponsorship.
        return { kind: "tx", tx: Transaction.from(bytes) };
      }
    }
  } catch {
    // Fall through to self-pay.
  }

  // Self-pay is reached whenever sponsorship is unavailable — including the
  // 400 a learner with no linked wallet gets. That learner is exactly who must
  // NOT self-pay: the webhook resolves an enrollment by linked wallet, so the
  // transaction would spend their SOL on a record no account can claim.
  if (!isSameWallet(linkedWallet, learner.toBase58())) {
    return { kind: "unverifiedWallet" };
  }

  const tx = new Transaction().add(buildEnrollInstruction(courseId, learner));
  await preflightTransaction(tx, connection, learner);
  return { kind: "tx", tx };
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
  /**
   * Non-null when the learner's embedded-wallet session has expired and the
   * only way on is re-authenticating with their social provider. Consumers
   * render `<LinkedWalletPrompt variant="reauth" …>` from it.
   */
  reauthPrompt: {
    /** The learner picks the provider — the app cannot know which one. */
    start: (provider: DynamicSocialProvider) => Promise<void>;
    dismiss: () => void;
  } | null;
  /**
   * The Dynamic SDK has not finished deciding whether this learner has an
   * embedded wallet. Disable the CTA rather than guessing — guessing is what
   * showed the connect modal to learners with a perfectly valid session.
   */
  isWalletResolving: boolean;
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
  const { profile } = useAuth();
  const dynamicSession = useDynamicSessionState();
  const t = useTranslations("walletPrompt");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [showReauth, setShowReauth] = useState(false);
  const linkedWallet = profile?.wallet_address ?? null;
  // Gated on the feature switch: with Dynamic off there is no redirect to
  // offer, so a reauth card would be a button that silently does nothing. The
  // kill switch has to degrade to the pre-existing behaviour, not to a
  // dead-end card — `lib/dynamic/config.ts` states that contract.
  const isEmbeddedLearner =
    profile?.wallet_kind === "embedded" && isDynamicEnabled();

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
    const dynamicAccount = publicKey ? null : dynamicSession.account;
    // An unparseable embedded address is no wallet at all, not a crash.
    const learner =
      publicKey ?? parseWalletAddress(dynamicAccount?.address ?? null);
    if (!learner) {
      // Still initialising: the SDK simply has not answered yet. Any prompt
      // here is the init race — a valid session shown the connect modal purely
      // because the click was early. Do nothing; the CTA is disabled anyway.
      if (dynamicSession.status === "loading") return;

      // An embedded learner can never answer "connect a wallet": they have no
      // extension, and the modal offers no route back to Dynamic. Offer the
      // one thing that works. `isEmbeddedLearner` is checked alongside the
      // session status so this holds even if Dynamic is switched off under a
      // learner who already has an embedded wallet.
      if (dynamicSession.status === "expired" || isEmbeddedLearner) {
        setShowReauth(true);
        return;
      }

      setWalletModalVisible(true);
      return;
    }

    const reportMismatch = (linked: string) => {
      const msg = t("enrollMismatch", { linked: truncateAddress(linked) });
      setEnrollError(msg);
      dispatchToast(msg, "warning");
      onError?.(msg);
    };

    // Both enrolment paths bind to the linked wallet: the sponsor builds for
    // it, and the webhook resolves the on-chain enrollment back to a user by
    // it. Signing with anything else — sponsored or self-paid — produces an
    // enrollment no account owns.
    const mismatch = findWalletMismatch(learner.toBase58(), linkedWallet);
    if (mismatch) {
      reportMismatch(mismatch);
      return;
    }

    setEnrollError(null);
    setIsEnrolling(true);

    try {
      let onChainSignature: string;

      try {
        const build = await buildEnrollTransaction(
          courseId,
          learner,
          linkedWallet,
          connection
        );
        if (build.kind === "wrongLearner") {
          reportMismatch(build.learner);
          return;
        }
        if (build.kind === "unverifiedWallet") {
          const msg = t("enrollNoLinkedWallet");
          setEnrollError(msg);
          dispatchToast(msg, "warning");
          onError?.(msg);
          return;
        }
        const tx = build.tx;
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
        // The session can die BETWEEN the wallet read and the signature. That
        // is not a program error and must not be parsed as one — the learner
        // would be told the enrolment failed when what they need is to sign in
        // again.
        if (isDynamicSessionExpiredError(err)) {
          setShowReauth(true);
          return;
        }

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
    linkedWallet,
    isEmbeddedLearner,
    dynamicSession,
    t,
  ]);

  const reauthPrompt = useMemo(
    () =>
      showReauth
        ? {
            /** The learner picks the provider — see LinkedWalletPrompt. */
            start: (provider: DynamicSocialProvider) =>
              startDynamicSocialSignIn(provider),
            dismiss: () => setShowReauth(false),
          }
        : null,
    [showReauth]
  );

  return {
    isEnrolling,
    handleEnroll,
    enrollError,
    reauthPrompt,
    isWalletResolving: !publicKey && dynamicSession.status === "loading",
  };
}
