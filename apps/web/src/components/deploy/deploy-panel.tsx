"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import {
  createFundingTransfer,
  deployProgram,
  estimateDeployCost,
  estimateSessionKeyDeployCost,
  getCachedBinaryLength,
  isResumableDeploymentState,
  OwnershipTransferError,
  resumeDeployment,
  runSessionKeyDeploy,
  startOverSessionKey,
  sweepSessionKey,
  transferProgramAuthority,
  type DeploymentCallbacks,
  type DeploymentState,
  type DeployResult,
  type DeployStep,
  type WalletAdapter,
} from "@superteam-lms/deploy";
import { useTranslations } from "next-intl";
import { Rocket } from "@phosphor-icons/react";
import { celebrate } from "@/lib/gamification/celebration";
import { useAuth } from "@/lib/auth/auth-provider";
import { trackEvent } from "@/lib/analytics";
import { isDynamicSessionExpiredError } from "@/lib/dynamic/solana";
import { isDynamicRateLimitError } from "@/lib/dynamic/rate-limit";
import {
  saveDeploymentWithRetry,
  type SaveStatus,
} from "@/lib/deploy/save-deployment";
import {
  toFriendlyError,
  type FriendlyError,
} from "@/lib/deploy/friendly-error";
import { setDeployFlow } from "@/lib/deploy/flow-store";
import {
  DEPLOY_EDITOR_ANCHOR_ID,
  DEPLOY_PANEL_ANCHOR_ID,
  revealElement,
} from "@/lib/deploy/scroll";
import type { DeployPhase } from "@/lib/deploy/progress";
import {
  clearDeployState,
  decryptSessionKey,
  encryptSessionKey,
  readDeployState,
  writeDeployState,
  type StoredDeployState,
} from "@/lib/deploy/session-key-storage";
import { useDeployFlow } from "@/hooks/use-deploy-flow";
import { useDeploySigner } from "@/hooks/use-deploy-signer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkedWalletPrompt } from "@/components/wallet/linked-wallet-prompt";
import { DeploySaveStatus } from "./deploy-save-status";
import { DeployStepper } from "./deploy-stepper";
import { DeployErrorNotice } from "./deploy-error-notice";
import { DeployProgressView, type DeployLogEntry } from "./deploy-progress";
import { DeploySuccessCard } from "./deploy-success-card";
import { WalletFundingCard } from "./wallet-funding-card";
import { WalletMismatchWarning } from "./wallet-mismatch-warning";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeployPanelProps {
  buildUuid: string;
  lessonId: string;
  courseSlug: string;
  courseId: string;
  /** Pre-generated program keypair from build-time declare_id injection. */
  programKeypairSecret?: number[];
  /** Lesson XP, for the success card's submit affordance. */
  xpReward?: number;
  /** XP actually credited once the lesson is complete. */
  earnedXp?: number | null;
  /** The lesson is already complete (submit is done). */
  isCompleted?: boolean;
  nextLessonHref?: string | null;
  onBuildExpired?: () => void;
}

interface TxLogEntry extends DeployLogEntry {
  step: DeployPhase;
  timestamp: number;
}

type PanelState = "ready" | "deploying" | "success" | "paused" | "error";

/** The lesson's submit path, reached from the success card. */
const REQUEST_SUBMIT_EVENT = "superteam:request-submit";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * The signer, with per-batch signing time logged outside production.
 *
 * EMBEDDED_BATCH_SIZE is provisional: MPC signing latency for N transactions
 * against a real Dynamic session cannot be measured from a test environment.
 * This is how it gets measured on a real session — without shipping a console
 * line to learners.
 */
function instrumentSigner(base: WalletAdapter): WalletAdapter {
  if (process.env.NODE_ENV === "production") return base;
  const signAllTransactions: WalletAdapter["signAllTransactions"] = async (
    txs
  ) => {
    const started = Date.now();
    const signed = await base.signAllTransactions(txs);
    console.debug(
      `[deploy] signAllTransactions(${txs.length}) took ${Date.now() - started}ms`
    );
    return signed;
  };
  return { ...base, signAllTransactions };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DeployPanel({
  buildUuid,
  lessonId,
  courseSlug,
  courseId,
  programKeypairSecret,
  xpReward = 0,
  earnedXp = null,
  isCompleted = false,
  nextLessonHref = null,
  onBuildExpired,
}: DeployPanelProps) {
  const t = useTranslations("deploy.deployment");
  const { connection } = useConnection();
  const { profile, isLoading: authLoading } = useAuth();

  // Panel state
  const [panelState, setPanelState] = useState<PanelState>("ready");
  // Server-record status — the deploy is only "recorded" (source of truth for
  // the capstone credential gate) once the save succeeds (#622). Separate from
  // panelState, which tracks the on-chain deploy itself.
  const [saveStatus, setSaveStatus] = useState<SaveStatus | "idle">("idle");
  const [currentStep, setCurrentStep] = useState<DeployPhase>("buffer");
  const [chunkCurrent, setChunkCurrent] = useState(0);
  const [chunkTotal, setChunkTotal] = useState(0);
  const [txLog, setTxLog] = useState<TxLogEntry[]>([]);
  const [result, setResult] = useState<DeployResult | null>(null);
  const [friendlyError, setFriendlyError] = useState<FriendlyError | null>(
    null
  );
  // The signer is waiting out a throttle and will ask again on its own. This is
  // never "paused" — there is nothing for the learner to press.
  const [autoRetrySeconds, setAutoRetrySeconds] = useState<number | null>(null);
  const [savedState, setSavedState] = useState<DeploymentState | null>(null);
  // The Dynamic session died mid-deploy. Distinct from the hook's `expired`,
  // which describes the session BEFORE a deploy starts.
  const [sessionExpired, setSessionExpired] = useState(false);
  const [reauthDismissed, setReauthDismissed] = useState(false);
  // Funding gate: what this deploy costs, and what the signer holds.
  const [costLamports, setCostLamports] = useState<number | null>(null);
  const [balanceLamports, setBalanceLamports] = useState<number | null>(null);
  const fundingTrackedRef = useRef(false);
  // Session-key upload (embedded wallets): the local key that pays for and
  // signs the whole upload after the wallet's single funding signature.
  const sessionSecretRef = useRef<number[] | null>(null);
  const [sessionAddress, setSessionAddress] = useState<string | null>(null);
  // The deploy landed but the upgrade authority is still the session key —
  // the learner does not own it yet and the server record is refused.
  const [claim, setClaim] = useState<DeployResult | null>(null);
  const [refundFailed, setRefundFailed] = useState(false);
  // A reload took the wrapping nonce with it, so the key that holds the
  // learner's SOL can no longer be signed with. Its address is all that is
  // left, and the panel keeps showing it until a new deploy replaces it.
  const [lostSessionAddress, setLostSessionAddress] = useState<string | null>(
    null
  );
  const lostSessionAddressRef = useRef<string | null>(null);
  const [lostCopied, setLostCopied] = useState(false);
  // A start-over sweep that rejected. Held so "retry refund" has a key to
  // sweep WITH — `resetSession` runs before the sweep settles.
  const strandedSweepRef = useRef<{
    secret: number[];
    bufferKeypairSecret: number[] | null;
  } | null>(null);

  const flow = useDeployFlow();

  // Extension wallet or Dynamic embedded wallet — the deploy is signed and paid
  // by whichever one this learner actually has. A throttled embedded signing
  // request becomes the "waiting for the wallet service" state: nothing has
  // failed, the signer is waiting before it asks again.
  const {
    status: signerStatus,
    signer,
    kind: signerKind,
    batchSize,
    startReauth,
  } = useDeploySigner({
    onRateLimitWait: ({ waitMs }) => {
      const seconds = Math.max(1, Math.round(waitMs / 1000));
      setAutoRetrySeconds(seconds);
      setTxLog((prev) => [
        ...prev,
        {
          step: "upload",
          message: t("rateLimitWaiting", { seconds: String(seconds) }),
          timestamp: Date.now(),
        },
      ]);
    },
  });
  const publicKey = signer?.publicKey ?? null;

  // Timing
  const startTimeRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);

  // The panel is the scroll/focus target after a build, and the anchor every
  // stepper step past "build" points at.
  const panelRef = useRef<HTMLDivElement>(null);

  // Save-loop lifecycle: cancel the in-flight save + suppress setState after
  // unmount (the retry loop can outlive the component).
  const mountedRef = useRef(true);
  const saveCancelledRef = useRef(false);
  // Focus target for the un-recorded (retryable/rejected) error surface.
  const saveErrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      saveCancelledRef.current = true;
    };
  }, []);

  // Move focus to the save-error surface when a deploy ends up un-recorded, so
  // the learner (and screen readers) can't miss that the credential-gated
  // record didn't land.
  useEffect(() => {
    if (saveStatus === "retryable" || saveStatus === "rejected") {
      saveErrorRef.current?.focus();
    }
  }, [saveStatus]);

  // Elapsed timer
  useEffect(() => {
    if (panelState !== "deploying") return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [panelState]);

  // Wallet-scoped localStorage key prefix to prevent cross-user cache leaks
  const walletPrefix = publicKey ? publicKey.toBase58().slice(0, 8) : "";

  // An embedded wallet signs through Dynamic's rate-limited MPC service, so it
  // signs ONE transaction (the funding transfer) and a local session key signs
  // the rest. Extension wallets are unchanged: they sign their own batches.
  const isEmbedded = signerKind === "embedded";

  // Everything worth resuming, in one record: the upload offset and the
  // encrypted session key that owns the buffer that offset points into.
  const storedRef = useRef<StoredDeployState>({
    deployment: null,
    session: null,
    sessionAddress: null,
    fundingSignature: null,
  });

  const persistStored = useCallback(() => {
    writeDeployState(buildUuid, walletPrefix, storedRef.current);
  }, [buildUuid, walletPrefix]);

  const rememberLostAddress = useCallback((address: string | null) => {
    lostSessionAddressRef.current = address;
    setLostSessionAddress(address);
  }, []);

  /**
   * Drop the saved deploy, keeping the stranded key's address if there is one.
   * That address is not UI state — it is the only record of where a reload sent
   * the learner's SOL, and it outlives the deploy that created it.
   */
  const clearStored = useCallback(() => {
    const lost = lostSessionAddressRef.current;
    if (!lost) {
      clearDeployState(buildUuid, walletPrefix);
      return;
    }
    storedRef.current = {
      deployment: null,
      session: null,
      sessionAddress: lost,
      fundingSignature: null,
    };
    writeDeployState(buildUuid, walletPrefix, storedRef.current);
  }, [buildUuid, walletPrefix]);

  const resetSession = useCallback(() => {
    sessionSecretRef.current = null;
    strandedSweepRef.current = null;
    setSessionAddress(null);
    setClaim(null);
    setRefundFailed(false);
    storedRef.current = {
      deployment: null,
      session: null,
      sessionAddress: null,
      fundingSignature: null,
    };
  }, []);

  // Pre-flight wallet check: the server records a deploy against the LINKED
  // wallet (profiles.wallet_address), while the deploy signs with the CONNECTED
  // wallet. When they differ, a successful deploy can't be recorded and the
  // capstone credential gate (LX-E2) would later deny it — so warn before the
  // learner spends SOL (#622). Wait for auth to resolve to avoid a false
  // "not linked" flash.
  const linkedWallet = profile?.wallet_address ?? null;
  const connectedWallet = publicKey?.toBase58() ?? null;
  const walletWarning: "mismatch" | "unlinked" | null =
    authLoading || !connectedWallet
      ? null
      : !linkedWallet
        ? "unlinked"
        : linkedWallet !== connectedWallet
          ? "mismatch"
          : null;

  const needsReauth =
    (signerStatus === "expired" || sessionExpired) && !reauthDismissed;

  // An embedded wallet starts at zero SOL, so "can this learner afford the
  // deploy?" has to be answered before the button is enabled — otherwise the
  // first thing they meet is a failed buffer-create transaction. The estimate
  // covers buffer + program + programdata rent and every fee (packages/deploy).
  const gateActive = panelState === "ready" || panelState === "paused";
  useEffect(() => {
    if (!gateActive || !signer?.publicKey) return;
    const programLen = getCachedBinaryLength(buildUuid);
    if (programLen === null) return;

    const payer = signer.publicKey;
    let cancelled = false;
    (async () => {
      try {
        const [estimate, lamports] = await Promise.all([
          // The embedded path funds a session key, which then pays for two more
          // transactions of its own — gate on what will actually be transferred.
          isEmbedded
            ? estimateSessionKeyDeployCost(connection, programLen)
            : estimateDeployCost(connection, programLen),
          connection.getBalance(payer, "confirmed"),
        ]);
        if (cancelled) return;
        setCostLamports(estimate.totalLamports);
        setBalanceLamports(lamports);
      } catch {
        // A failed RPC read must not block a deploy the learner can afford:
        // leaving both null keeps the gate open, as before this change.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gateActive, signer, connection, buildUuid, isEmbedded]);

  const shortfallLamports =
    costLamports !== null && balanceLamports !== null
      ? Math.max(costLamports - balanceLamports, 0)
      : 0;
  const needsFunding = shortfallLamports > 0;
  const shortfallSol = shortfallLamports / LAMPORTS_PER_SOL;

  useEffect(() => {
    if (!needsFunding || fundingTrackedRef.current) return;
    fundingTrackedRef.current = true;
    trackEvent("deploy_funding_required", {
      signerKind,
      shortfallLamports,
      costLamports,
    });
  }, [needsFunding, shortfallLamports, costLamports, signerKind]);

  // Publish this panel's half of the flow — the editor publishes build and
  // submit. Both steppers read the same store.
  useEffect(() => {
    const built = Boolean(buildUuid);
    setDeployFlow({
      built,
      funded: built && !needsFunding,
      deployed: panelState === "success" && Boolean(result),
    });
  }, [buildUuid, needsFunding, panelState, result]);

  useEffect(() => {
    setDeployFlow({ submitted: isCompleted });
  }, [isCompleted]);

  // A finished build means the next thing to do is down here, in the other
  // column. Take the learner to it rather than leaving them on a Compile button
  // that has nothing more to say.
  useEffect(() => {
    const handler = () => revealElement(panelRef.current);
    window.addEventListener("superteam:build-complete", handler);
    return () =>
      window.removeEventListener("superteam:build-complete", handler);
  }, []);

  // Check for an existing deployment on mount. The SERVER record is the source
  // of truth for whether this deploy is recorded; localStorage is only an
  // optimistic cache of the on-chain deploy (proof it happened, plus stats).
  useEffect(() => {
    let cancelled = false;

    function readCachedResult(): DeployResult | null {
      try {
        const key = walletPrefix
          ? `deploy-result-${walletPrefix}-${courseSlug}-${lessonId}`
          : null;
        const raw = key ? localStorage.getItem(key) : null;
        if (!raw) return null;
        const parsed = JSON.parse(raw) as {
          programId: string;
          totalChunks: number;
          durationMs: number;
          rentLamports: number;
        };
        if (!parsed.programId) return null;
        return {
          programId: parsed.programId,
          programIdPubkey: new PublicKey(parsed.programId),
          totalChunks: parsed.totalChunks,
          durationMs: parsed.durationMs,
          rentLamports: parsed.rentLamports,
        };
      } catch {
        return null;
      }
    }

    async function checkExistingDeployment() {
      const cached = readCachedResult();

      // Authoritative: does the server have a recorded row for this lesson?
      let serverProgramId: string | null = null;
      try {
        const res = await fetch(
          `/api/deploy/save?lessonId=${encodeURIComponent(lessonId)}&courseId=${encodeURIComponent(courseId)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.deployed && data.programId) {
            serverProgramId = data.programId as string;
          }
        }
      } catch {
        // Server unreachable — fall back to the optimistic cache below.
      }
      if (cancelled) return;

      if (serverProgramId) {
        // Recorded. Reuse cached stats when they describe the same program.
        setResult(
          cached && cached.programId === serverProgramId
            ? cached
            : {
                programId: serverProgramId,
                programIdPubkey: new PublicKey(serverProgramId),
                totalChunks: 0,
                durationMs: 0,
                rentLamports: 0,
              }
        );
        setSaveStatus("saved");
        setPanelState("success");
        window.dispatchEvent(new CustomEvent("superteam:deploy-complete"));
        return;
      }

      if (cached) {
        // The on-chain deploy really happened (we cached its result), but no
        // server row exists — show it, but as UN-RECORDED with a retry, never
        // silently "done".
        setResult(cached);
        setSaveStatus("retryable");
        setPanelState("success");
        window.dispatchEvent(new CustomEvent("superteam:deploy-complete"));
      }
    }

    checkExistingDeployment();
    return () => {
      cancelled = true;
    };
  }, [lessonId, courseId, courseSlug, walletPrefix]);

  // Check for resumable state on mount.
  //
  // sessionStorage is writable by anything on this origin, and a resume replays
  // rent-paying transactions against the accounts the state names, so the state
  // is validated against this build and its injected program keypair before it
  // is offered — and dropped, not repaired, when it fails.
  useEffect(() => {
    let cancelled = false;
    const stored = readDeployState(buildUuid, walletPrefix);
    if (!stored) return;

    const deployment = stored.deployment;
    const resumable =
      deployment &&
      deployment.phase !== "complete" &&
      isResumableDeploymentState(deployment, {
        buildUuid,
        programKeypairSecret,
      });

    // Dropped without waiting on the decrypt: a state that is neither
    // resumable nor attached to a funded key has nothing worth reading.
    if (!resumable && !(stored.session && stored.fundingSignature)) {
      clearDeployState(buildUuid, walletPrefix);
      return;
    }

    (async () => {
      // No session key means the adapter path (or a reload that took the
      // wrapping nonce with it): a session-key deploy cannot resume without it.
      const secret = stored.session
        ? await decryptSessionKey(stored.session, buildUuid)
        : null;
      if (cancelled) return;

      // A reload. The key is unrecoverable, but it is where the learner's SOL
      // went — so the record is kept down to its address, and shown, rather
      // than deleted along with the only way to find the funds again.
      if (stored.session && !secret) {
        if (!stored.sessionAddress) {
          clearDeployState(buildUuid, walletPrefix);
          return;
        }
        storedRef.current = {
          deployment: null,
          session: null,
          sessionAddress: stored.sessionAddress,
          fundingSignature: stored.fundingSignature,
        };
        writeDeployState(buildUuid, walletPrefix, storedRef.current);
        rememberLostAddress(stored.sessionAddress);
        return;
      }
      // Nothing to resume from — but a key with a funding signature against it
      // is a key an earlier attempt may have paid into, and the offset is not
      // what makes it worth keeping. Keep it (and only it, never the state that
      // failed validation) so the next Deploy carries it over instead of
      // transferring a second time.
      if (!resumable) {
        if (!secret) {
          clearDeployState(buildUuid, walletPrefix);
          return;
        }
        sessionSecretRef.current = secret;
        setSessionAddress(stored.sessionAddress);
        storedRef.current = { ...stored, deployment: null };
        writeDeployState(buildUuid, walletPrefix, storedRef.current);
        return;
      }
      sessionSecretRef.current = secret;
      setSessionAddress(stored.sessionAddress);
      storedRef.current = stored;
      setSavedState(deployment);
      setPanelState("paused");
    })();

    return () => {
      cancelled = true;
    };
  }, [buildUuid, walletPrefix, programKeypairSecret, rememberLostAddress]);

  // Build deployment callbacks
  const buildCallbacks = useCallback((): DeploymentCallbacks => {
    return {
      onStepChange: (step: DeployStep) => {
        setCurrentStep(step);
        if (step === "complete") {
          setPanelState("success");
        }
      },
      onChunkProgress: (current: number, total: number) => {
        setChunkCurrent(current);
        setChunkTotal(total);
        // Progress means the throttle let go.
        setAutoRetrySeconds(null);
      },
      onTransactionConfirmed: (info: {
        signature: string;
        step: DeployStep;
        message: string;
      }) => {
        setAutoRetrySeconds(null);
        setTxLog((prev) => [
          ...prev,
          {
            signature: info.signature,
            step: info.step,
            message: info.message,
            timestamp: Date.now(),
          },
        ]);
      },
      onError: (error) => {
        setFriendlyError(toFriendlyError(error.message, { shortfallSol }));
        setPanelState(error.retryable ? "paused" : "error");
      },
      onStateUpdate: (state: DeploymentState) => {
        storedRef.current = { ...storedRef.current, deployment: state };
        persistStored();
        setSavedState(state);
      },
      onBatchStart: () => {
        setAutoRetrySeconds(null);
      },
    };
  }, [persistStored, shortfallSol]);

  /**
   * The embedded path's own callbacks: identical, except the upload finishing
   * is not the deploy finishing. The session key still owns the program until
   * the SetAuthority + sweep below run, so the package's terminal "complete"
   * becomes the transfer phase here instead of flipping the panel to success.
   */
  const buildEmbeddedCallbacks = useCallback((): DeploymentCallbacks => {
    const base = buildCallbacks();
    return {
      ...base,
      onStepChange: (step: DeployStep) => {
        setCurrentStep(step === "complete" ? "transfer" : step);
      },
    };
  }, [buildCallbacks]);

  // Persist the deploy to the server (source of truth for the credential
  // gate), retrying transient failures with backoff and surfacing the outcome
  // via saveStatus. Also used by the manual "retry saving" affordance.
  const runSave = useCallback(
    (deployResult: DeployResult) => {
      saveCancelledRef.current = false;
      void saveDeploymentWithRetry(
        {
          lessonId,
          courseId,
          programId: deployResult.programId,
        },
        {
          onStatus: (status) => {
            if (mountedRef.current) setSaveStatus(status);
          },
          isCancelled: () => saveCancelledRef.current || !mountedRef.current,
        }
      );
    },
    [lessonId, courseId]
  );

  // Save program ID on success
  const handleSuccess = useCallback(
    (deployResult: DeployResult) => {
      setResult(deployResult);
      setPanelState("success");
      setAutoRetrySeconds(null);
      setClaim(null);
      clearStored();

      // Save program ID + stats to localStorage for use in later lessons and refresh.
      // Keys are scoped by wallet to prevent cross-user cache leaks.
      if (walletPrefix) {
        try {
          localStorage.setItem(
            `program-${walletPrefix}-${courseSlug}`,
            deployResult.programId
          );
          localStorage.setItem(
            `deploy-result-${walletPrefix}-${courseSlug}-${lessonId}`,
            JSON.stringify({
              programId: deployResult.programId,
              totalChunks: deployResult.totalChunks,
              durationMs: deployResult.durationMs,
              rentLamports: deployResult.rentLamports,
            })
          );
        } catch {
          // non-critical
        }
      }

      trackEvent("deploy_completed", {
        signerKind,
        durationMs: deployResult.durationMs,
        totalChunks: deployResult.totalChunks,
      });

      // Medium celebration — a successful devnet deploy is one of the two
      // confetti-worthy milestones (LX-B11); respects prefers-reduced-motion.
      celebrate("deploy-success");

      // Notify challenge runner that deployment is complete (enables submit)
      window.dispatchEvent(new CustomEvent("superteam:deploy-complete"));

      // Persist to the server — the recorded row, not localStorage, is what the
      // capstone credential gate reads. Its outcome drives saveStatus so a
      // failed save is surfaced with a retry, never silently swallowed (#622).
      runSave(deployResult);
    },
    [clearStored, courseSlug, lessonId, walletPrefix, runSave, signerKind]
  );

  /** Shared failure handling for both the fresh deploy and the resume. */
  const handleFailure = useCallback(
    (err: unknown, phase: "deploy" | "resume"): void => {
      setAutoRetrySeconds(null);

      // An expired embedded session is not a deploy failure: the uploaded
      // chunks survive (the buffer authority is the payer, the same key after
      // re-auth), so this pauses for re-auth rather than reporting an error.
      if (isDynamicSessionExpiredError(err)) {
        trackEvent("deploy_session_expired", { signerKind, phase });
        setSessionExpired(true);
        setReauthDismissed(false);
        setFriendlyError(toFriendlyError("session expired"));
        setPanelState("paused");
        return;
      }

      // Throttled by Dynamic's wallet API after the signer had already spent
      // its backoff. Nothing on chain failed and the buffer keeps every chunk
      // that landed, so this is a wait, not a broken deploy.
      if (isDynamicRateLimitError(err)) {
        trackEvent("deploy_rate_limited", { signerKind, phase });
        setFriendlyError(toFriendlyError("rate limited"));
        setPanelState("paused");
        return;
      }

      const friendly = toFriendlyError(err, { shortfallSol });
      setFriendlyError(friendly);
      setPanelState(friendly.action === "rebuild" ? "error" : "paused");
    },
    [signerKind, shortfallSol]
  );

  /**
   * The learner's single signature: a transfer of the estimated cost into the
   * session key. Built with the learner as payer so the fee is theirs too.
   */
  const fundSessionKey = useCallback(
    async (
      lamports: number,
      to: PublicKey,
      onSignature: (signature: string) => void
    ): Promise<string> => {
      if (!signer?.publicKey) throw new Error("Wallet not connected");
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      const tx = createFundingTransfer({
        learner: signer.publicKey,
        sessionKey: to,
        lamports,
        blockhash,
      });
      const signed = await signer.signTransaction(tx);
      // The signature exists as soon as the wallet signs, and a send that
      // throws can still have reached the cluster. Report it BEFORE
      // broadcasting, so a retry can ask what happened instead of transferring
      // a second time.
      if (signed.signature) onSignature(bs58.encode(signed.signature));
      return connection.sendRawTransaction(signed.serialize());
    },
    [signer, connection]
  );

  /** One log line per phase, alongside the per-chunk lines from the package. */
  const logPhase = useCallback(
    (signature: string, step: DeployPhase, message: string) => {
      setTxLog((prev) => [
        ...prev,
        { signature, step, message, timestamp: Date.now() },
      ]);
    },
    []
  );

  /** Deploy (or resume) through a local session key — the embedded path. */
  const runEmbedded = useCallback(
    async (resume: { state: DeploymentState; secret: number[] } | null) => {
      if (!signer?.publicKey) return;
      const learner = signer.publicKey;

      // A "fresh" deploy that follows an attempt which already funded a key is
      // not fresh: that key holds the learner's SOL. Generating a new one over
      // it would transfer a second time and orphan the first, so the key is
      // carried over and `runSessionKeyDeploy` decides from the chain whether
      // it still needs funding at all.
      const carryOver =
        !resume && sessionSecretRef.current
          ? {
              secret: sessionSecretRef.current,
              fundingSignature: storedRef.current.fundingSignature,
            }
          : null;

      setPanelState("deploying");
      setFriendlyError(null);
      setSessionExpired(false);
      setRefundFailed(false);
      setClaim(null);
      startTimeRef.current = Date.now();
      setElapsed(0);
      if (resume) {
        setChunkCurrent(resume.state.lastUploadedChunk + 1);
        setChunkTotal(resume.state.totalChunks);
      } else {
        setTxLog([]);
        setChunkCurrent(0);
        setChunkTotal(0);
        setResult(null);
        setSaveStatus("idle");
        saveCancelledRef.current = true;
        // A fresh run gets a fresh key; leaving the previous run's buffer in
        // the record would offer a resume pairing a new key with an old buffer.
        storedRef.current = carryOver
          ? {
              deployment: null,
              session: storedRef.current.session,
              sessionAddress: storedRef.current.sessionAddress,
              fundingSignature: storedRef.current.fundingSignature,
            }
          : {
              deployment: null,
              session: null,
              sessionAddress: null,
              fundingSignature: null,
            };
      }

      trackEvent("deploy_started", {
        signerKind,
        batchSize: null,
        resumed: Boolean(resume),
      });

      try {
        const deployResult = await runSessionKeyDeploy({
          connection,
          learner,
          buildUuid,
          fund: fundSessionKey,
          callbacks: buildEmbeddedCallbacks(),
          programKeypairSecret,
          persistedSessionKey: resume?.secret ?? carryOver?.secret ?? null,
          resumeState: resume?.state ?? null,
          pendingFundingSignature: carryOver?.fundingSignature ?? null,
          events: {
            onSessionKey: async (secret, sessionPubkey) => {
              // Persisted BEFORE the transfer: a crash right after it would
              // otherwise strand the funds with no key left to spend them.
              sessionSecretRef.current = secret;
              setSessionAddress(sessionPubkey.toBase58());
              // This record now names a key that CAN be signed with.
              rememberLostAddress(null);
              const ciphertext = await encryptSessionKey(secret, buildUuid);
              storedRef.current = {
                ...storedRef.current,
                session: ciphertext,
                sessionAddress: sessionPubkey.toBase58(),
              };
              persistStored();
            },
            onFundingBroadcast: ({ signature }) => {
              storedRef.current = {
                ...storedRef.current,
                fundingSignature: signature,
              };
              persistStored();
            },
            onFunded: ({ lamports, signature }) => {
              trackEvent("deploy_session_key_funded", {
                signerKind,
                lamports,
              });
              logPhase(signature, "buffer", t("logFunded"));
            },
            onOwnershipTransferred: ({ signature }) => {
              setCurrentStep("refund");
              trackEvent("deploy_ownership_transferred", {
                signerKind,
                lamports: costLamports ?? 0,
              });
              logPhase(signature, "finalize", t("logOwnershipTransferred"));
            },
            onRefunded: ({ signature, lamports }) => {
              trackEvent("deploy_refunded", { signerKind, lamports });
              logPhase(signature, "complete", t("logRefunded"));
            },
            onRefundFailed: () => setRefundFailed(true),
          },
        });

        handleSuccess(deployResult);
      } catch (err) {
        // The deploy landed but ownership did not move: the program is live and
        // paid for, so this is a claim-ownership retry, not a failed deploy.
        if (err instanceof OwnershipTransferError) {
          // The secret is already in `sessionSecretRef` (persisted from
          // `onSessionKey`); the error carries only addresses.
          setSessionAddress(err.sessionKeyAddress.toBase58());
          setClaim(err.deployResult);
          setPanelState("paused");
          return;
        }
        handleFailure(err, resume ? "resume" : "deploy");
      }
    },
    [
      signer,
      signerKind,
      connection,
      buildUuid,
      programKeypairSecret,
      fundSessionKey,
      buildEmbeddedCallbacks,
      handleSuccess,
      handleFailure,
      logPhase,
      persistStored,
      rememberLostAddress,
      costLamports,
      t,
    ]
  );

  /** Re-run only the SetAuthority step after it failed post-deploy. */
  const handleClaimOwnership = useCallback(async () => {
    const secret = sessionSecretRef.current;
    if (!claim || !secret || !signer?.publicKey) return;
    const learner = signer.publicKey;
    setFriendlyError(null);
    try {
      const signature = await transferProgramAuthority({
        connection,
        sessionKeySecret: secret,
        programId: claim.programIdPubkey,
        newAuthority: learner,
      });
      trackEvent("deploy_ownership_transferred", {
        signerKind,
        lamports: costLamports ?? 0,
      });
      logPhase(signature, "finalize", t("logOwnershipTransferred"));

      try {
        const refund = await sweepSessionKey({
          connection,
          sessionKeySecret: secret,
          destination: learner,
        });
        if (refund) {
          trackEvent("deploy_refunded", {
            signerKind,
            lamports: refund.lamports,
          });
          logPhase(refund.signature, "complete", t("logRefunded"));
        }
      } catch {
        setRefundFailed(true);
      }

      handleSuccess(claim);
    } catch (err) {
      setFriendlyError(toFriendlyError(err, { shortfallSol }));
    }
  }, [
    claim,
    signer,
    signerKind,
    connection,
    costLamports,
    handleSuccess,
    logPhase,
    t,
    shortfallSol,
  ]);

  /**
   * Retry a sweep that failed — after a complete deploy, or after a start over.
   *
   * Those need different transactions: a start over still has a buffer holding
   * rent, so it retries the close-and-sweep, not the sweep alone. Which one is
   * decided by whether `handleStartOver` left a stranded key behind.
   */
  const handleRetryRefund = useCallback(async () => {
    const stranded = strandedSweepRef.current;
    const secret = stranded?.secret ?? sessionSecretRef.current;
    if (!secret || !signer?.publicKey) return;
    const destination = signer.publicKey;
    try {
      const refund = stranded
        ? (
            await startOverSessionKey({
              connection,
              sessionKeySecret: secret,
              bufferKeypairSecret: stranded.bufferKeypairSecret,
              destination,
            })
          ).refund
        : await sweepSessionKey({
            connection,
            sessionKeySecret: secret,
            destination,
          });
      if (refund) {
        trackEvent("deploy_refunded", {
          signerKind,
          lamports: refund.lamports,
        });
      }
      strandedSweepRef.current = null;
      setRefundFailed(false);
      setSessionAddress(null);
    } catch {
      // Still failing — the warning stays, with its retry.
    }
  }, [signer, signerKind, connection]);

  // Deploy handler
  const handleDeploy = useCallback(async () => {
    if (!signer || needsFunding) return;
    if (isEmbedded) {
      await runEmbedded(null);
      return;
    }

    setPanelState("deploying");
    setTxLog([]);
    setChunkCurrent(0);
    setChunkTotal(0);
    setFriendlyError(null);
    setResult(null);
    setAutoRetrySeconds(null);
    setSaveStatus("idle");
    setSessionExpired(false);
    saveCancelledRef.current = true;
    startTimeRef.current = Date.now();
    setElapsed(0);

    const callbacks = buildCallbacks();
    trackEvent("deploy_started", { signerKind, batchSize });

    try {
      const deployResult = await deployProgram({
        connection,
        wallet: instrumentSigner(signer),
        buildServerUrl: "/api",
        buildUuid,
        callbacks,
        programKeypairSecret,
        batchSize,
      });
      handleSuccess(deployResult);
    } catch (err) {
      handleFailure(err, "deploy");
    }
  }, [
    signer,
    signerKind,
    batchSize,
    needsFunding,
    connection,
    buildUuid,
    programKeypairSecret,
    buildCallbacks,
    handleSuccess,
    handleFailure,
    isEmbedded,
    runEmbedded,
  ]);

  // Resume handler
  const handleResume = useCallback(async () => {
    if (!signer || !savedState) return;
    if (isEmbedded) {
      const secret = sessionSecretRef.current;
      // Without the session key there is nothing to resume WITH: the buffer's
      // authority is that key, so the panel falls back to naming the stranded
      // address rather than pretending a resume is possible.
      if (!secret) {
        rememberLostAddress(sessionAddress);
        setPanelState("paused");
        return;
      }
      await runEmbedded({ state: savedState, secret });
      return;
    }

    setPanelState("deploying");
    setFriendlyError(null);
    setAutoRetrySeconds(null);
    setSessionExpired(false);
    startTimeRef.current = Date.now();
    setElapsed(0);

    // Restore chunk progress from saved state
    setChunkCurrent(savedState.lastUploadedChunk + 1);
    setChunkTotal(savedState.totalChunks);

    const callbacks = buildCallbacks();
    trackEvent("deploy_started", { signerKind, batchSize, resumed: true });

    try {
      const deployResult = await resumeDeployment({
        connection,
        wallet: instrumentSigner(signer),
        buildServerUrl: "/api",
        state: savedState,
        callbacks,
        batchSize,
      });
      handleSuccess(deployResult);
    } catch (err) {
      handleFailure(err, "resume");
    }
  }, [
    signer,
    signerKind,
    batchSize,
    connection,
    savedState,
    sessionAddress,
    buildCallbacks,
    handleSuccess,
    handleFailure,
    isEmbedded,
    runEmbedded,
    rememberLostAddress,
  ]);

  // Start over handler
  const handleStartOver = useCallback(() => {
    // A session key that is about to be discarded still holds the learner's
    // SOL, and its buffer still holds rent. Close and sweep before the key is
    // gone; both are best effort — a devnet balance must not block a retry.
    const secret = sessionSecretRef.current;
    if (secret && signer?.publicKey) {
      const destination = signer.publicKey;
      const address = sessionAddress;
      const bufferKeypairSecret =
        storedRef.current.deployment?.bufferKeypairSecret ?? null;
      void startOverSessionKey({
        connection,
        sessionKeySecret: secret,
        bufferKeypairSecret,
        destination,
      })
        .then((outcome) => {
          if (outcome.refund) {
            trackEvent("deploy_refunded", {
              signerKind,
              lamports: outcome.refund.lamports,
            });
          }
        })
        .catch(() => {
          // The reset below has already run, so the retry would have no key to
          // sweep with. Hand it this one back, along with the address the
          // warning names.
          strandedSweepRef.current = { secret, bufferKeypairSecret };
          setSessionAddress(address);
          setRefundFailed(true);
        });
    }

    clearStored();
    resetSession();
    setSavedState(null);
    setPanelState("ready");
    setTxLog([]);
    setChunkCurrent(0);
    setChunkTotal(0);
    setFriendlyError(null);
    setResult(null);
    setAutoRetrySeconds(null);
    setCurrentStep("buffer");
    setSaveStatus("idle");
    saveCancelledRef.current = true;
  }, [
    clearStored,
    connection,
    signer,
    signerKind,
    sessionAddress,
    resetSession,
  ]);

  const handleRebuild = useCallback(() => {
    handleStartOver();
    onBuildExpired?.();
    revealElement(document.getElementById(DEPLOY_EDITOR_ANCHOR_ID));
  }, [handleStartOver, onBuildExpired]);

  // The success card submits through the lesson's normal path — the editor owns
  // enrollment, grading and the verdict; this only asks for it.
  const handleRequestSubmit = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent(REQUEST_SUBMIT_EVENT, { detail: { lessonId } })
    );
  }, [lessonId]);

  const handleCopyLostAddress = useCallback(async () => {
    if (!lostSessionAddress) return;
    try {
      await navigator.clipboard.writeText(lostSessionAddress);
      setLostCopied(true);
      setTimeout(() => setLostCopied(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  }, [lostSessionAddress]);

  /**
   * The sweep is the one step allowed to fail without failing the deploy: the
   * program is live and owned by the learner either way. Rendered wherever the
   * panel can land after a failed sweep — success AND, after a start over,
   * ready — so the retry is never a button on a screen nobody reaches.
   */
  const refundWarning = refundFailed ? (
    <div className="flex flex-wrap items-center gap-2 rounded-md border-2 border-[color:var(--ink-line)] bg-accent-bg p-3 text-xs text-text">
      <span className="flex-1">
        {t("refundFailed", { address: sessionAddress ?? "" })}
      </span>
      <Button size="sm" variant="secondary" onClick={handleRetryRefund}>
        {t("retryRefund")}
      </Button>
    </div>
  ) : null;

  /**
   * A reload took the key that holds the learner's SOL. Nothing here can spend
   * it, so the panel does the one useful thing left: name the account, in a
   * form they can copy into a wallet or the explorer.
   */
  const lostKeyNotice = lostSessionAddress ? (
    <div
      role="alert"
      className="space-y-2 rounded-md border-2 border-[color:var(--ink-line)] bg-accent-bg p-3 text-xs text-text"
    >
      <p>{t("sessionKeyLost", { address: lostSessionAddress })}</p>
      <Button size="sm" variant="secondary" onClick={handleCopyLostAddress}>
        {lostCopied ? t("copied") : t("copyAddress")}
      </Button>
    </div>
  ) : null;

  /** Everything renders inside this shell, so the anchor is always present. */
  const shell = (children: React.ReactNode) => (
    <div
      id={DEPLOY_PANEL_ANCHOR_ID}
      ref={panelRef}
      tabIndex={-1}
      className="space-y-3 outline-none"
    >
      <DeployStepper state={flow} />
      {children}
    </div>
  );

  // -------------------------------------------------------------------------
  // Render: Success state
  // -------------------------------------------------------------------------
  if (panelState === "success" && result) {
    return shell(
      <DeploySuccessCard
        programId={result.programId}
        rentLamports={result.rentLamports}
        durationMs={result.durationMs}
        xpReward={xpReward}
        earnedXp={earnedXp}
        isComplete={isCompleted}
        onSubmit={handleRequestSubmit}
        nextLessonHref={nextLessonHref}
        noticeSlot={refundWarning}
        saveStatusSlot={
          <DeploySaveStatus
            ref={saveErrorRef}
            status={saveStatus}
            onRetry={() => runSave(result)}
          />
        }
      />
    );
  }

  // -------------------------------------------------------------------------
  // Render: Deploying state
  // -------------------------------------------------------------------------
  if (panelState === "deploying") {
    return shell(
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
              aria-hidden="true"
            />
            {t("deploying")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {autoRetrySeconds !== null && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-start gap-2 rounded-md border-2 border-[color:var(--ink-line)] bg-accent-bg p-3 text-sm"
            >
              <div
                className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent"
                aria-hidden="true"
              />
              <span>
                <span className="font-display font-extrabold">
                  {t("waitingForWallet")}
                </span>{" "}
                {t("waitingForWalletBody")}
              </span>
            </div>
          )}

          <DeployProgressView
            phase={currentStep}
            chunkCurrent={chunkCurrent}
            chunkTotal={chunkTotal}
            elapsedMs={elapsed}
            entries={txLog}
          />
        </CardContent>
      </Card>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Paused / Error state
  // -------------------------------------------------------------------------
  if (panelState === "paused" || panelState === "error") {
    const action = friendlyError?.action ?? "resume";
    const isRebuild = action === "rebuild";
    const canResume = Boolean(savedState) && !isRebuild && !claim;

    return shell(
      <Card className="border-2 border-[color:var(--ink-line)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {isRebuild ? t("buildExpired") : t("paused")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {friendlyError ? (
            <DeployErrorNotice
              error={friendlyError}
              onAction={
                action === "rebuild"
                  ? handleRebuild
                  : action === "retry"
                    ? () => void handleDeploy()
                    : action === "resume"
                      ? () => void handleResume()
                      : undefined
              }
            />
          ) : claim ? (
            <p className="text-sm text-text-2">{t("ownershipFailed")}</p>
          ) : (
            <p className="text-sm text-text-2">{t("pausedBody")}</p>
          )}

          {txLog.length > 0 && (
            <DeployProgressView
              phase={currentStep}
              chunkCurrent={chunkCurrent}
              chunkTotal={chunkTotal}
              elapsedMs={elapsed}
              entries={txLog}
            />
          )}

          {lostKeyNotice}
          {refundWarning}

          {needsReauth && (
            <LinkedWalletPrompt
              variant="reauth"
              linkedWallet={linkedWallet}
              onReauth={startReauth}
              onDismiss={() => setReauthDismissed(true)}
            />
          )}

          {/* The program is deployed and paid for; only the authority handover
              is missing, and it is the one step this button re-runs. */}
          {claim && (
            <div className="space-y-2 rounded-md border-2 border-[color:var(--ink-line)] bg-card p-3">
              <p className="break-all font-mono text-xs">{claim.programId}</p>
              <Button
                onClick={() => void handleClaimOwnership()}
                className="w-full"
              >
                {t("claimOwnership")}
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {canResume && (
              <Button
                onClick={() => void handleResume()}
                className="flex-1"
                disabled={!signer}
              >
                {t("resume")}
              </Button>
            )}
            {isRebuild ? (
              <Button
                onClick={handleRebuild}
                variant="outline"
                className="flex-1"
              >
                {t("rebuild")}
              </Button>
            ) : (
              <Button
                onClick={handleStartOver}
                variant="outline"
                className={canResume ? "" : "flex-1"}
              >
                {t("startOver")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Ready state (default)
  // -------------------------------------------------------------------------

  // If no buildUuid yet (panel mounted to check server for existing deploy),
  // the stepper still says where the learner is: on the build step.
  if (!buildUuid) {
    return shell(<p className="text-sm text-text-2">{t("description")}</p>);
  }

  return shell(
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Rocket size={20} weight="duotone" aria-hidden="true" />
          {t("deployToDevnet")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-text-2">{t("description")}</p>
        <p className="text-xs text-text-3">
          {isEmbedded ? t("sessionKeyNotice") : t("batchExplainer")}
        </p>

        {lostKeyNotice}
        {refundWarning}

        {/* Pre-flight: warn (don't block) when this deploy won't be recorded
            against the wallet the learner is connected with. */}
        {walletWarning && (
          <WalletMismatchWarning
            variant={walletWarning}
            linkedWallet={linkedWallet}
          />
        )}

        {/* The deploy costs real rent and fees. An embedded wallet starts at
            zero, so fund it here rather than failing on the first tx. */}
        {needsFunding && (
          <WalletFundingCard
            requiredLamports={costLamports ?? undefined}
            onBalance={setBalanceLamports}
          />
        )}

        {needsReauth ? (
          <LinkedWalletPrompt
            variant="reauth"
            linkedWallet={linkedWallet}
            onReauth={startReauth}
            onDismiss={() => setReauthDismissed(true)}
          />
        ) : (
          <Button
            onClick={() => void handleDeploy()}
            className="w-full"
            disabled={!signer || needsFunding}
          >
            {signerStatus === "resolving"
              ? t("resolvingWallet")
              : needsFunding
                ? t("insufficientSol", {
                    amount: shortfallSol.toFixed(2),
                  })
                : t("deployToDevnet")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
