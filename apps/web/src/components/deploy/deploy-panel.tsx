"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  closeBuffer,
  deployProgram,
  estimateDeployCost,
  getCachedBinary,
  getCachedBinaryLength,
  isResumableDeploymentState,
  resumeDeployment,
  setCachedBinary,
  type DeploymentCallbacks,
  type DeploymentState,
  type DeployResult,
  type DeployStep,
} from "@superteam-lms/deploy";
import { useTranslations } from "next-intl";
import { Rocket } from "@phosphor-icons/react";
import { celebrate } from "@/lib/gamification/celebration";
import { useAuth } from "@/lib/auth/auth-provider";
import { trackEvent } from "@/lib/analytics";
import { signLabDeployProof } from "@/lib/deploy/lab-deploy-proof";
import {
  saveDeploymentWithRetry,
  type SaveStatus,
} from "@/lib/deploy/save-deployment";
import {
  toFriendlyError,
  type FriendlyError,
} from "@/lib/deploy/friendly-error";
import {
  DEPLOY_EDITOR_ANCHOR_ID,
  DEPLOY_PANEL_ANCHOR_ID,
  revealElement,
} from "@/lib/deploy/scroll";
import type { DeployPhase } from "@/lib/deploy/progress";
import {
  clearDeployState,
  readDeployBinary,
  readDeployState,
  saveDeployBinary,
  writeDeployState,
} from "@/lib/deploy/deploy-state-storage";
import { useLabConnection } from "@/lib/solana/lab-connection";
import { useLabDevnetGuard } from "@/hooks/use-lab-devnet-guard";
import { useLabKey } from "@/hooks/use-lab-key";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeploySaveStatus } from "./deploy-save-status";
import { DeployErrorNotice } from "./deploy-error-notice";
import { DeployPausedNotice } from "./deploy-paused-notice";
import { LabKeyNote } from "./lab-key-note";
import { LabNetworkNote } from "./lab-network-note";
import { DeployProgressView, type DeployLogEntry } from "./deploy-progress";
import { DeploySuccessCard } from "./deploy-success-card";
import { WalletFundingCard } from "./wallet-funding-card";

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
  /** The lesson is already complete (submit is done). */
  isCompleted?: boolean;
  /**
   * Every other graded block in the lesson is done. False means a submit would
   * be refused by the server for a block the learner has not reached — on a
   * deploy lesson the quiz sits BELOW this card, so that was the normal path.
   * Defaults to true: a lesson with nothing else to grade is always submittable.
   */
  canSubmit?: boolean;
  onBuildExpired?: () => void;
}

interface TxLogEntry extends DeployLogEntry {
  step: DeployPhase;
  timestamp: number;
}

type PanelState = "ready" | "deploying" | "success" | "paused" | "error";

/** The lesson's submit path, reached from the success card. */
const REQUEST_SUBMIT_EVENT = "superteam:request-submit";

/** Analytics label for the deploy's signer: always the lab key. */
const SIGNER_KIND = "lab";

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
  isCompleted = false,
  canSubmit = true,
  onBuildExpired,
}: DeployPanelProps) {
  const t = useTranslations("deploy.deployment");
  // The lab connection, never the app's: the deploy goes to devnet whatever
  // chain the Academy program is on.
  const { connection } = useLabConnection();
  const { status: labStatus, ensureDevnet } = useLabDevnetGuard();
  // Every button handler below that signs or sends awaits this first. The
  // check is async, so a second click can arrive while it is open: only the
  // first click goes on, or one deploy would start twice.
  const labCheckOpenRef = useRef(false);
  const ensureLabDevnet = useCallback(async () => {
    if (labCheckOpenRef.current) return false;
    labCheckOpenRef.current = true;
    try {
      return await ensureDevnet();
    } finally {
      labCheckOpenRef.current = false;
    }
  }, [ensureDevnet]);
  const { userId } = useAuth();

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
  const [savedState, setSavedState] = useState<DeploymentState | null>(null);
  // A saved deploy that cannot be resumed (its program is gone from this tab).
  // Its buffer still holds rent the lab key paid, so the next deploy or start
  // over closes it first.
  const staleStateRef = useRef<DeploymentState | null>(null);
  // Funding gate: what this deploy costs, and what the signer holds.
  const [costLamports, setCostLamports] = useState<number | null>(null);
  const [balanceLamports, setBalanceLamports] = useState<number | null>(null);
  const fundingTrackedRef = useRef(false);

  // The learner's lab key signs and pays for the whole deploy on devnet, and
  // stays the program's upgrade authority. The learner's own wallet signs
  // nothing here.
  const { status: labKeyStatus, signer } = useLabKey();
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

  // Storage keys carry the start of the lab key's address, so one account's
  // cached deploy is never shown to the next account on this browser.
  const walletPrefix = publicKey ? publicKey.toBase58().slice(0, 8) : "";

  // Clears the saved deploy and the program bytes kept for a resume.
  const clearStored = useCallback(() => {
    clearDeployState({ keyPrefix: walletPrefix, courseId, lessonId });
  }, [walletPrefix, courseId, lessonId]);

  // A new lab key starts at zero SOL, so "can this learner afford the
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
          estimateDeployCost(connection, programLen),
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
  }, [gateActive, signer, connection, buildUuid]);

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
      signerKind: SIGNER_KIND,
      shortfallLamports,
      costLamports,
    });
  }, [needsFunding, shortfallLamports, costLamports]);

  // A finished build means the next thing to do is down here, in the other
  // column. Take the learner to it rather than leaving them on a Compile button
  // that has nothing more to say. This scroll is all that is left of #1231's
  // Build → Fund → Deploy → Submit stepper, which the owner had removed.
  //
  // If a build indicator is ever wanted again, do NOT derive it from "a
  // buildUuid exists" the way the stepper did: `buildUuid` survives the failed
  // re-build that follows it, so the step kept its tick while the editor was
  // showing a compile error. Any such indicator must key on the LATEST run's
  // result, not on the presence of an id from an earlier one.
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

  // Check for a saved deploy once the lab key is known.
  //
  // A reload leaves no build in memory, so the saved deploy names its own
  // build, and the program it uploads is read back from storage. sessionStorage
  // is writable by anything on this origin, so the state is validated before it
  // is offered: against its own program bytes, and against this build's
  // injected program keypair when the build is still the same one.
  useEffect(() => {
    // A saved deploy belongs to one key: another key cannot write its buffer.
    staleStateRef.current = null;
    setSavedState(null);

    const scope = { keyPrefix: walletPrefix, courseId, lessonId };
    const stored = readDeployState(scope);
    if (!stored) return;

    const savedBuild = (stored as Partial<DeploymentState>).buildUuid;
    if (typeof savedBuild !== "string" || !savedBuild) {
      clearDeployState(scope);
      return;
    }
    if (getCachedBinaryLength(savedBuild) === null) {
      const binary = readDeployBinary(scope, savedBuild);
      if (binary) setCachedBinary(savedBuild, binary);
    }

    const valid = isResumableDeploymentState(stored, {
      buildUuid: savedBuild,
      programKeypairSecret:
        savedBuild === buildUuid ? programKeypairSecret : undefined,
    });
    if (!valid || stored.phase === "complete") {
      clearDeployState(scope);
      return;
    }
    if (getCachedBinaryLength(savedBuild) === null) {
      // The program is gone, so the upload cannot go on. Keep the record: its
      // buffer is closed, for its rent, by the next deploy or start over.
      staleStateRef.current = stored;
      return;
    }
    setSavedState(stored);
    setPanelState("paused");
    // Only when the key or the lesson changes: a new build must not replace a
    // deploy that is paused or running.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletPrefix, courseId, lessonId]);

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
        setFriendlyError(toFriendlyError(error.message, { shortfallSol }));
        setPanelState(error.retryable ? "paused" : "error");
      },
      onStateUpdate: (state: DeploymentState) => {
        writeDeployState(
          { keyPrefix: walletPrefix, courseId, lessonId },
          state
        );
        setSavedState(state);
      },
      onBatchStart: () => {},
    };
  }, [walletPrefix, courseId, lessonId, shortfallSol]);

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
          // The server records the deploy only for the holder of the program's
          // upgrade authority key. The lab key signs that claim; the secret
          // stays in this browser.
          signProof: async () => {
            if (!signer || !userId) throw new Error("No lab key to sign with");
            return signLabDeployProof(
              {
                userId,
                courseId,
                lessonId,
                programId: deployResult.programId,
              },
              signer
            );
          },
        },
        {
          onStatus: (status) => {
            if (mountedRef.current) setSaveStatus(status);
          },
          isCancelled: () => saveCancelledRef.current || !mountedRef.current,
        }
      );
    },
    [lessonId, courseId, signer, userId]
  );

  // Save program ID on success
  const handleSuccess = useCallback(
    (deployResult: DeployResult) => {
      setResult(deployResult);
      setPanelState("success");
      setSavedState(null);
      clearStored();

      // Save program ID + stats to localStorage for use in later lessons and refresh.
      // Keys are scoped by lab key to prevent cross-user cache leaks.
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
        signerKind: SIGNER_KIND,
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
    [clearStored, courseSlug, lessonId, walletPrefix, runSave]
  );

  /** Shared failure handling for both the fresh deploy and the resume. */
  const handleFailure = useCallback(
    (err: unknown): void => {
      const friendly = toFriendlyError(err, { shortfallSol });
      setFriendlyError(friendly);
      setPanelState(friendly.action === "rebuild" ? "error" : "paused");
    },
    [shortfallSol]
  );

  /**
   * Close an abandoned upload's buffer, so the rent the lab key paid for it
   * comes back to the lab key. Best effort: test SOL must not block a deploy.
   */
  const reclaimBuffer = useCallback(
    async (state: DeploymentState | null) => {
      if (!state || !signer) return;
      try {
        await closeBuffer({
          connection,
          wallet: signer,
          bufferKeypairSecret: state.bufferKeypairSecret,
        });
      } catch {
        // The buffer stays open. Only test SOL is left in it.
      }
    },
    [connection, signer]
  );

  // Deploy handler
  const handleDeploy = useCallback(async () => {
    if (!signer || needsFunding) return;
    if (!(await ensureLabDevnet())) return;

    setPanelState("deploying");
    setTxLog([]);
    setChunkCurrent(0);
    setChunkTotal(0);
    setFriendlyError(null);
    setResult(null);
    setSaveStatus("idle");
    saveCancelledRef.current = true;
    startTimeRef.current = Date.now();
    setElapsed(0);

    const callbacks = buildCallbacks();
    trackEvent("deploy_started", { signerKind: SIGNER_KIND });

    // This deploy replaces any earlier upload for the lesson.
    const abandoned = savedState ?? staleStateRef.current;
    staleStateRef.current = null;
    setSavedState(null);

    try {
      await reclaimBuffer(abandoned);
      // Kept for the tab's life, so a reload can resume this upload.
      const binary = getCachedBinary(buildUuid);
      if (binary) {
        saveDeployBinary(
          { keyPrefix: walletPrefix, courseId, lessonId },
          buildUuid,
          binary
        );
      }
      const deployResult = await deployProgram({
        connection,
        wallet: signer,
        buildServerUrl: "/api",
        buildUuid,
        callbacks,
        programKeypairSecret,
      });
      handleSuccess(deployResult);
    } catch (err) {
      handleFailure(err);
    }
  }, [
    signer,
    needsFunding,
    connection,
    ensureLabDevnet,
    buildUuid,
    programKeypairSecret,
    buildCallbacks,
    handleSuccess,
    handleFailure,
    reclaimBuffer,
    savedState,
    walletPrefix,
    courseId,
    lessonId,
  ]);

  // Resume handler
  const handleResume = useCallback(async () => {
    if (!signer || !savedState) return;
    if (!(await ensureLabDevnet())) return;

    setPanelState("deploying");
    setFriendlyError(null);
    startTimeRef.current = Date.now();
    setElapsed(0);

    // Restore chunk progress from saved state
    setChunkCurrent(savedState.lastUploadedChunk + 1);
    setChunkTotal(savedState.totalChunks);

    const callbacks = buildCallbacks();
    trackEvent("deploy_started", { signerKind: SIGNER_KIND, resumed: true });

    try {
      const deployResult = await resumeDeployment({
        connection,
        wallet: signer,
        buildServerUrl: "/api",
        state: savedState,
        callbacks,
      });
      handleSuccess(deployResult);
    } catch (err) {
      handleFailure(err);
    }
  }, [
    signer,
    connection,
    ensureLabDevnet,
    savedState,
    buildCallbacks,
    handleSuccess,
    handleFailure,
  ]);

  // Start over handler
  const handleStartOver = useCallback(() => {
    // The abandoned upload's buffer holds rent the lab key paid. Close it so
    // that test SOL comes back; nothing is sent unless the lab is on devnet.
    const abandoned = savedState ?? staleStateRef.current;
    staleStateRef.current = null;
    if (abandoned) {
      void ensureDevnet().then((devnet) => {
        if (devnet) return reclaimBuffer(abandoned);
      });
    }

    clearStored();
    setSavedState(null);
    setPanelState("ready");
    setTxLog([]);
    setChunkCurrent(0);
    setChunkTotal(0);
    setFriendlyError(null);
    setResult(null);
    setCurrentStep("buffer");
    setSaveStatus("idle");
    saveCancelledRef.current = true;
  }, [clearStored, ensureDevnet, reclaimBuffer, savedState]);

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

  /** Everything renders inside this shell, so the anchor is always present. */
  const shell = (children: React.ReactNode) => (
    <div
      id={DEPLOY_PANEL_ANCHOR_ID}
      ref={panelRef}
      tabIndex={-1}
      className="space-y-3 outline-none"
    >
      {children}
    </div>
  );

  // The lab RPC is not on devnet, or could not say: the lab is paused in every
  // state, and nothing above signs or sends.
  if (labStatus === "refused") {
    return shell(<DeployPausedNotice variant="deploy" />);
  }

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
        isComplete={isCompleted}
        canSubmit={canSubmit}
        onSubmit={handleRequestSubmit}
        saveStatus={saveStatus}
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
    const canResume = Boolean(savedState) && !isRebuild;

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
            {/* Rebuild's own action already lives in the DeployErrorNotice
                above (errorActions.rebuild) — a second "Back to the editor"
                button here would just repeat it. */}
            {!isRebuild && (
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
        <LabNetworkNote />

        {/* The funding card shows the lab key itself. Without it, the key and
            its "forget" control are shown here. */}
        {!needsFunding && <LabKeyNote />}

        {/* The deploy costs rent and fees in test SOL. A new lab key starts
            at zero, so fund it here rather than failing on the first tx. */}
        {needsFunding && (
          <WalletFundingCard
            requiredLamports={costLamports ?? undefined}
            onBalance={setBalanceLamports}
          />
        )}

        <Button
          onClick={() => void handleDeploy()}
          className="w-full"
          disabled={!signer || needsFunding}
        >
          {labKeyStatus === "resolving"
            ? t("resolvingKey")
            : needsFunding
              ? t("insufficientSol", {
                  amount: shortfallSol.toFixed(2),
                })
              : t("deployToDevnet")}
        </Button>
      </CardContent>
    </Card>
  );
}
