"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
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
import { celebrate } from "@/lib/gamification/celebration";
import { useAuth } from "@/lib/auth/auth-provider";
import { trackEvent } from "@/lib/analytics";
import { isDynamicSessionExpiredError } from "@/lib/dynamic/solana";
import {
  saveDeploymentWithRetry,
  type SaveStatus,
} from "@/lib/deploy/save-deployment";
import {
  clearDeployState,
  decryptSessionKey,
  encryptSessionKey,
  readDeployState,
  writeDeployState,
  type StoredDeployState,
} from "@/lib/deploy/session-key-storage";
import { useDeploySigner } from "@/hooks/use-deploy-signer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LinkedWalletPrompt } from "@/components/wallet/linked-wallet-prompt";
import { cn } from "@/lib/utils";
import { DeploySaveStatus } from "./deploy-save-status";
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
  onBuildExpired?: () => void;
}

interface TxLogEntry {
  signature: string;
  step: DeployStep;
  message: string;
  timestamp: number;
}

type PanelState = "ready" | "deploying" | "success" | "paused" | "error";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXPLORER_BASE = "https://explorer.solana.com";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateSig(sig: string): string {
  return sig.slice(0, 8);
}

function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// ---------------------------------------------------------------------------
// Step indicator data
// ---------------------------------------------------------------------------

const DEPLOY_STEPS: { key: DeployStep; labelKey: string }[] = [
  { key: "buffer", labelKey: "createBuffer" },
  { key: "upload", labelKey: "uploadChunks" },
  { key: "finalize", labelKey: "finalize" },
];

function stepIndex(step: DeployStep): number {
  const idx = DEPLOY_STEPS.findIndex((s) => s.key === step);
  return idx >= 0 ? idx : 0;
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
  onBuildExpired,
}: DeployPanelProps) {
  const t = useTranslations("deploy.deployment");
  // Extension wallet or Dynamic embedded wallet — the deploy is signed and paid
  // by whichever one this learner actually has.
  const {
    status: signerStatus,
    signer,
    kind: signerKind,
    batchSize,
    startReauth,
  } = useDeploySigner();
  const publicKey = signer?.publicKey ?? null;
  const { connection } = useConnection();
  const { profile, isLoading: authLoading } = useAuth();

  // Panel state
  const [panelState, setPanelState] = useState<PanelState>("ready");
  // Server-record status — the deploy is only "recorded" (source of truth for
  // the capstone credential gate) once the save succeeds (#622). Separate from
  // panelState, which tracks the on-chain deploy itself.
  const [saveStatus, setSaveStatus] = useState<SaveStatus | "idle">("idle");
  const [currentStep, setCurrentStep] = useState<DeployStep>("buffer");
  const [chunkCurrent, setChunkCurrent] = useState(0);
  const [chunkTotal, setChunkTotal] = useState(0);
  const [txLog, setTxLog] = useState<TxLogEntry[]>([]);
  const [result, setResult] = useState<DeployResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedState, setSavedState] = useState<DeploymentState | null>(null);
  const [batchInfo, setBatchInfo] = useState<{
    batchNumber: number;
    totalBatches: number;
  } | null>(null);
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

  // Timing
  const startTimeRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);

  // Ref for scrollable log
  const logEndRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [txLog]);

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
  });

  const persistStored = useCallback(() => {
    writeDeployState(buildUuid, walletPrefix, storedRef.current);
  }, [buildUuid, walletPrefix]);

  const resetSession = useCallback(() => {
    sessionSecretRef.current = null;
    setSessionAddress(null);
    setClaim(null);
    setRefundFailed(false);
    storedRef.current = {
      deployment: null,
      session: null,
      sessionAddress: null,
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

  useEffect(() => {
    if (!needsFunding || fundingTrackedRef.current) return;
    fundingTrackedRef.current = true;
    trackEvent("deploy_funding_required", {
      signerKind,
      shortfallLamports,
      costLamports,
    });
  }, [needsFunding, shortfallLamports, costLamports, signerKind]);

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
    if (
      !deployment ||
      deployment.phase === "complete" ||
      !isResumableDeploymentState(deployment, {
        buildUuid,
        programKeypairSecret,
      })
    ) {
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
      if (stored.session && !secret) {
        clearDeployState(buildUuid, walletPrefix);
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
  }, [buildUuid, walletPrefix, programKeypairSecret]);

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
      },
      onTransactionConfirmed: (info: {
        signature: string;
        step: DeployStep;
        message: string;
      }) => {
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
        setErrorMessage(error.message);
        setPanelState(error.retryable ? "paused" : "error");
      },
      onStateUpdate: (state: DeploymentState) => {
        storedRef.current = { ...storedRef.current, deployment: state };
        persistStored();
        setSavedState(state);
      },
      onBatchStart: (info) => {
        setBatchInfo(info);
      },
    };
  }, [persistStored]);

  /** One log line per phase, alongside the per-chunk lines from the package. */
  const logPhase = useCallback(
    (signature: string, step: DeployStep, message: string) => {
      setTxLog((prev) => [
        ...prev,
        { signature, step, message, timestamp: Date.now() },
      ]);
    },
    []
  );

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
      setClaim(null);
      clearDeployState(buildUuid, walletPrefix);

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
    [buildUuid, courseSlug, lessonId, walletPrefix, runSave, signerKind]
  );

  /**
   * The learner's single signature: a transfer of the estimated cost into the
   * session key. Built with the learner as payer so the fee is theirs too.
   */
  const fundSessionKey = useCallback(
    async (lamports: number, to: PublicKey): Promise<string> => {
      if (!signer?.publicKey) throw new Error("Wallet not connected");
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      const tx = createFundingTransfer({
        learner: signer.publicKey,
        sessionKey: to,
        lamports,
        blockhash,
      });
      const signed = await signer.signTransaction(tx);
      return connection.sendRawTransaction(signed.serialize());
    },
    [signer, connection]
  );

  /** Deploy (or resume) through a local session key — the embedded path. */
  const runEmbedded = useCallback(
    async (resume: { state: DeploymentState; secret: number[] } | null) => {
      if (!signer?.publicKey) return;
      const learner = signer.publicKey;

      setPanelState("deploying");
      setErrorMessage(null);
      setBatchInfo(null);
      setSessionExpired(false);
      setRefundFailed(false);
      setClaim(null);
      startTimeRef.current = Date.now();
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
        storedRef.current = {
          deployment: null,
          session: null,
          sessionAddress: null,
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
          callbacks: buildCallbacks(),
          programKeypairSecret,
          persistedSessionKey: resume?.secret ?? null,
          resumeState: resume?.state ?? null,
          events: {
            onSessionKey: async (secret, sessionPubkey) => {
              // Persisted BEFORE the transfer: a crash right after it would
              // otherwise strand the funds with no key left to spend them.
              sessionSecretRef.current = secret;
              setSessionAddress(sessionPubkey.toBase58());
              const ciphertext = await encryptSessionKey(secret, buildUuid);
              storedRef.current = {
                ...storedRef.current,
                session: ciphertext,
                sessionAddress: sessionPubkey.toBase58(),
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
          sessionSecretRef.current = err.sessionKeySecret;
          setClaim(err.deployResult);
          setErrorMessage(t("ownershipFailed"));
          setPanelState("paused");
          return;
        }
        if (isDynamicSessionExpiredError(err)) {
          trackEvent("deploy_session_expired", {
            signerKind,
            phase: resume ? "resume" : "deploy",
          });
          setSessionExpired(true);
          setReauthDismissed(false);
          setPanelState("paused");
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        setErrorMessage(message);
        setPanelState(
          message.toLowerCase().includes("expired") || message.includes("404")
            ? "error"
            : "paused"
        );
      }
    },
    [
      signer,
      signerKind,
      connection,
      buildUuid,
      programKeypairSecret,
      fundSessionKey,
      buildCallbacks,
      handleSuccess,
      logPhase,
      persistStored,
      costLamports,
      t,
    ]
  );

  /** Re-run only the SetAuthority step after it failed post-deploy. */
  const handleClaimOwnership = useCallback(async () => {
    const secret = sessionSecretRef.current;
    if (!claim || !secret || !signer?.publicKey) return;
    const learner = signer.publicKey;
    setErrorMessage(null);
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
      setErrorMessage(err instanceof Error ? err.message : String(err));
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
  ]);

  /** Retry a sweep that failed after an otherwise complete deploy. */
  const handleRetryRefund = useCallback(async () => {
    const secret = sessionSecretRef.current;
    if (!secret || !signer?.publicKey) return;
    try {
      const refund = await sweepSessionKey({
        connection,
        sessionKeySecret: secret,
        destination: signer.publicKey,
      });
      if (refund) {
        trackEvent("deploy_refunded", {
          signerKind,
          lamports: refund.lamports,
        });
      }
      setRefundFailed(false);
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
    setErrorMessage(null);
    setResult(null);
    setBatchInfo(null);
    setSaveStatus("idle");
    setSessionExpired(false);
    saveCancelledRef.current = true;
    startTimeRef.current = Date.now();

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
      // An expired embedded session is not a deploy failure: the uploaded
      // chunks survive (the buffer authority is the payer, the same key after
      // re-auth), so this pauses for re-auth rather than reporting an error.
      if (isDynamicSessionExpiredError(err)) {
        trackEvent("deploy_session_expired", { signerKind, phase: "deploy" });
        setSessionExpired(true);
        setReauthDismissed(false);
        setPanelState("paused");
        return;
      }

      const message = err instanceof Error ? err.message : String(err);
      setErrorMessage(message);

      // Determine if this is a build expired error
      if (
        message.toLowerCase().includes("expired") ||
        message.includes("404")
      ) {
        setPanelState("error");
      } else {
        setPanelState("paused");
      }
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
    isEmbedded,
    runEmbedded,
  ]);

  // Resume handler
  const handleResume = useCallback(async () => {
    if (!signer || !savedState) return;
    if (isEmbedded) {
      const secret = sessionSecretRef.current;
      // Without the session key there is nothing to resume WITH: the buffer's
      // authority is that key, so a fresh deploy (and transfer) is the only way
      // forward.
      if (!secret) {
        setErrorMessage(t("sessionKeyLost"));
        setPanelState("paused");
        return;
      }
      await runEmbedded({ state: savedState, secret });
      return;
    }

    setPanelState("deploying");
    setErrorMessage(null);
    setBatchInfo(null);
    setSessionExpired(false);
    startTimeRef.current = Date.now();

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
      if (isDynamicSessionExpiredError(err)) {
        trackEvent("deploy_session_expired", { signerKind, phase: "resume" });
        setSessionExpired(true);
        setReauthDismissed(false);
        setPanelState("paused");
        return;
      }

      const message = err instanceof Error ? err.message : String(err);
      setErrorMessage(message);
      setPanelState("paused");
    }
  }, [
    signer,
    signerKind,
    batchSize,
    connection,
    savedState,
    buildCallbacks,
    handleSuccess,
    isEmbedded,
    runEmbedded,
    t,
  ]);

  // Start over handler
  const handleStartOver = useCallback(() => {
    // A session key that is about to be discarded still holds the learner's
    // SOL, and its buffer still holds rent. Close and sweep before the key is
    // gone; both are best effort — a devnet balance must not block a retry.
    const secret = sessionSecretRef.current;
    if (secret && signer?.publicKey) {
      const destination = signer.publicKey;
      void startOverSessionKey({
        connection,
        sessionKeySecret: secret,
        bufferKeypairSecret: storedRef.current.deployment?.bufferKeypairSecret,
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
        .catch(() => setRefundFailed(true));
    }

    clearDeployState(buildUuid, walletPrefix);
    resetSession();
    setSavedState(null);
    setPanelState("ready");
    setTxLog([]);
    setChunkCurrent(0);
    setChunkTotal(0);
    setErrorMessage(null);
    setResult(null);
    setBatchInfo(null);
    setCurrentStep("buffer");
    setSaveStatus("idle");
    saveCancelledRef.current = true;
  }, [buildUuid, walletPrefix, connection, signer, signerKind, resetSession]);

  // Copy program ID
  const handleCopyProgramId = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.programId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  }, [result]);

  // Chunk progress percentage
  const chunkPercent =
    chunkTotal > 0 ? Math.round((chunkCurrent / chunkTotal) * 100) : 0;

  // Estimated time remaining (rough -- based on elapsed vs progress)
  const estimatedTimeRemaining =
    chunkCurrent > 0 && chunkTotal > 0 && panelState === "deploying"
      ? Math.round(
          ((elapsed / chunkCurrent) * (chunkTotal - chunkCurrent)) / 1000
        )
      : null;

  // -------------------------------------------------------------------------
  // Render: Success state
  // -------------------------------------------------------------------------
  if (panelState === "success" && result) {
    return (
      <Card className="border-[var(--success-border)] bg-[var(--success-bg)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-success">
            {/* Checkmark icon */}
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {t("success")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Program ID with copy */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t("programId")}
            </p>
            <button
              onClick={handleCopyProgramId}
              className="bg-muted/50 group flex w-full items-center gap-2 rounded-md px-3 py-2 font-mono text-sm transition-colors hover:bg-muted"
            >
              <span className="flex-1 truncate text-left">
                {result.programId}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground group-hover:text-foreground">
                {copied ? t("copied") : ""}
              </span>
              {/* Copy icon */}
              <svg
                className="h-4 w-4 shrink-0 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                />
              </svg>
            </button>
          </div>

          {/* Explorer link */}
          <a
            href={`${EXPLORER_BASE}/address/${result.programId}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {t("viewOnExplorer")}
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </a>

          {/* Deployment stats — only show when we have real data */}
          {result.totalChunks > 0 && (
            <div className="bg-muted/30 grid grid-cols-2 gap-3 rounded-lg p-3">
              <div>
                <p className="text-xs text-muted-foreground">{t("size")}</p>
                <p className="text-sm font-semibold">
                  {formatBytes(result.totalChunks * 1000)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("chunks")}</p>
                <p className="text-sm font-semibold">
                  {result.totalChunks + 2}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("time")}</p>
                <p className="text-sm font-semibold">
                  {formatDuration(result.durationMs)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("rent")}</p>
                <p className="text-sm font-semibold">
                  {(result.rentLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL
                </p>
              </div>
            </div>
          )}

          {/* The sweep is the one step allowed to fail without failing the
              deploy: the program is live and owned by the learner either way. */}
          {refundFailed && (
            <div className="flex flex-wrap items-center gap-2 rounded-md bg-yellow-500/10 px-3 py-2 text-xs text-yellow-500">
              <span className="flex-1">
                {t("refundFailed", { address: sessionAddress ?? "" })}
              </span>
              <Button size="sm" variant="outline" onClick={handleRetryRefund}>
                {t("retryRefund")}
              </Button>
            </div>
          )}

          {/* Server-record status — the deploy only counts toward the capstone
              credential once it's recorded; un-recorded shows a retry. */}
          <DeploySaveStatus
            ref={saveErrorRef}
            status={saveStatus}
            onRetry={() => {
              if (result) runSave(result);
            }}
          />
        </CardContent>
      </Card>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Deploying state
  // -------------------------------------------------------------------------
  if (panelState === "deploying") {
    return (
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
          {/* 3-step stepper */}
          <div className="flex items-center gap-1">
            {DEPLOY_STEPS.map((step, idx) => {
              const currentIdx = stepIndex(currentStep);
              const isComplete = idx < currentIdx;
              const isCurrent = idx === currentIdx;

              return (
                <div key={step.key} className="flex flex-1 items-center gap-1">
                  <div className="flex flex-1 flex-col items-center gap-1">
                    {/* Step circle */}
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                        isComplete && "border-success bg-success text-white",
                        isCurrent &&
                          "border-primary bg-gradient-to-r from-solana-purple to-solana-green text-white",
                        !isComplete &&
                          !isCurrent &&
                          "border-muted-foreground/30 text-muted-foreground/50"
                      )}
                    >
                      {isComplete ? (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      ) : isCurrent ? (
                        <div
                          className="h-2.5 w-2.5 animate-pulse rounded-full bg-white"
                          aria-hidden="true"
                        />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    {/* Step label */}
                    <span
                      className={cn(
                        "text-center text-[10px] leading-tight",
                        isCurrent
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {t(step.labelKey)}
                    </span>
                  </div>
                  {/* Connector line */}
                  {idx < DEPLOY_STEPS.length - 1 && (
                    <div
                      className={cn(
                        "mb-5 h-0.5 flex-1",
                        isComplete ? "bg-success" : "bg-muted-foreground/20"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Chunk progress bar */}
          {currentStep === "upload" && chunkTotal > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {t("chunkProgress", {
                    current: String(chunkCurrent),
                    total: String(chunkTotal),
                  })}
                </span>
                <span className="font-mono font-semibold">{chunkPercent}%</span>
              </div>
              <Progress value={chunkPercent} size="thin" variant="primary" />
              {estimatedTimeRemaining !== null &&
                estimatedTimeRemaining > 0 && (
                  <p className="text-right text-[10px] text-muted-foreground">
                    {t("timeRemaining", {
                      seconds: String(estimatedTimeRemaining),
                    })}
                  </p>
                )}
            </div>
          )}

          {/* Batch signing prompt — tied to the real signAllTransactions
              batch (via onBatchStart), so it's only shown while there's
              actually more than one upload batch to approve. */}
          {currentStep === "upload" &&
            batchInfo &&
            batchInfo.totalBatches > 1 && (
              <div className="flex items-center gap-2 rounded-md bg-yellow-500/10 px-3 py-2 text-xs text-yellow-500">
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                {t("approvingBatch", {
                  current: String(batchInfo.batchNumber),
                  total: String(batchInfo.totalBatches),
                })}
              </div>
            )}

          {/* Transaction log */}
          {txLog.length > 0 && (
            <div className="bg-muted/30 max-h-32 overflow-y-auto rounded-md p-2">
              <div className="space-y-1">
                {txLog.map((entry, idx) => (
                  <div
                    key={`${entry.signature}-${idx}`}
                    className="flex items-center gap-2 text-[11px]"
                  >
                    <a
                      href={`${EXPLORER_BASE}/tx/${entry.signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 font-mono text-primary hover:underline"
                    >
                      {truncateSig(entry.signature)}
                    </a>
                    <span className="truncate text-muted-foreground">
                      {entry.message}
                    </span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Paused / Error state
  // -------------------------------------------------------------------------
  if (panelState === "paused" || panelState === "error") {
    const isExpired =
      panelState === "error" &&
      errorMessage &&
      (errorMessage.toLowerCase().includes("expired") ||
        errorMessage.includes("404"));

    return (
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-yellow-500">
            {/* Warning icon */}
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            {isExpired ? t("buildExpired") : t("paused")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isExpired ? (
            <p className="text-sm text-muted-foreground">{t("rebuildHint")}</p>
          ) : errorMessage ? (
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          ) : null}

          {/* Transaction log from before the pause */}
          {txLog.length > 0 && (
            <div className="bg-muted/30 max-h-24 overflow-y-auto rounded-md p-2">
              <div className="space-y-1">
                {txLog.map((entry, idx) => (
                  <div
                    key={`${entry.signature}-${idx}`}
                    className="flex items-center gap-2 text-[11px]"
                  >
                    <a
                      href={`${EXPLORER_BASE}/tx/${entry.signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 font-mono text-primary hover:underline"
                    >
                      {truncateSig(entry.signature)}
                    </a>
                    <span className="truncate text-muted-foreground">
                      {entry.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            <div className="bg-muted/30 space-y-2 rounded-md p-3">
              <p className="break-all font-mono text-xs">{claim.programId}</p>
              <Button onClick={handleClaimOwnership} className="w-full">
                {t("claimOwnership")}
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            {!isExpired && !claim && savedState && (
              <Button
                onClick={handleResume}
                className="flex-1"
                disabled={!signer}
              >
                {t("resume")}
              </Button>
            )}
            {isExpired && onBuildExpired ? (
              <Button
                onClick={() => {
                  handleStartOver();
                  onBuildExpired();
                }}
                variant="outline"
                className="flex-1"
              >
                {t("startOver")}
              </Button>
            ) : (
              <Button
                onClick={handleStartOver}
                variant="outline"
                className={cn(!isExpired && savedState ? "" : "flex-1")}
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
  // don't show the "ready" UI — the check-on-mount effect handles it.
  if (!buildUuid) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {/* Rocket icon */}
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
            />
          </svg>
          {t("deployToDevnet")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <p className="text-xs text-muted-foreground">
          {isEmbedded ? t("sessionKeyNotice") : t("batchExplainer")}
        </p>

        {/* Build UUID */}
        <div className="bg-muted/30 rounded-md px-3 py-2">
          <span className="text-xs text-muted-foreground">Build: </span>
          <span className="font-mono text-xs">{buildUuid.slice(0, 12)}...</span>
        </div>

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
            onClick={handleDeploy}
            className="w-full bg-gradient-to-r from-solana-purple to-solana-green font-semibold text-white hover:opacity-90"
            disabled={!signer || needsFunding}
          >
            {signerStatus === "resolving"
              ? t("resolvingWallet")
              : needsFunding
                ? t("insufficientSol", {
                    amount: (shortfallLamports / LAMPORTS_PER_SOL).toFixed(2),
                  })
                : t("deployToDevnet")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
