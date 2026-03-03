"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  deployProgram,
  resumeDeployment,
  type DeploymentCallbacks,
  type DeploymentState,
  type DeployResult,
  type DeployStep,
} from "@superteam-lms/deploy";
import confetti from "canvas-confetti";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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
const STORAGE_PREFIX = "deploy-state-";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sessionKey(buildUuid: string): string {
  return `${STORAGE_PREFIX}${buildUuid}`;
}

function loadSavedState(buildUuid: string): DeploymentState | null {
  try {
    const raw = sessionStorage.getItem(sessionKey(buildUuid));
    if (!raw) return null;
    return JSON.parse(raw) as DeploymentState;
  } catch {
    return null;
  }
}

function savePersistentState(buildUuid: string, state: DeploymentState): void {
  try {
    sessionStorage.setItem(sessionKey(buildUuid), JSON.stringify(state));
  } catch {
    // sessionStorage full or unavailable — non-critical
  }
}

function clearSavedState(buildUuid: string): void {
  try {
    sessionStorage.removeItem(sessionKey(buildUuid));
  } catch {
    // ignore
  }
}

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
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();

  // Panel state
  const [panelState, setPanelState] = useState<PanelState>("ready");
  const [currentStep, setCurrentStep] = useState<DeployStep>("buffer");
  const [chunkCurrent, setChunkCurrent] = useState(0);
  const [chunkTotal, setChunkTotal] = useState(0);
  const [txLog, setTxLog] = useState<TxLogEntry[]>([]);
  const [result, setResult] = useState<DeployResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedState, setSavedState] = useState<DeploymentState | null>(null);

  // Timing
  const startTimeRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);

  // Ref for scrollable log
  const logEndRef = useRef<HTMLDivElement>(null);

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

  // Check for existing deployment on mount — try localStorage first (has stats),
  // then fall back to server API (only has programId).
  useEffect(() => {
    async function checkExistingDeployment() {
      // 1. Try localStorage (preserves stats across refresh)
      try {
        const cached = localStorage.getItem(
          `deploy-result-${courseSlug}-${lessonId}`
        );
        if (cached) {
          const parsed = JSON.parse(cached) as {
            programId: string;
            totalChunks: number;
            durationMs: number;
            rentLamports: number;
          };
          if (parsed.programId) {
            setResult({
              programId: parsed.programId,
              programIdPubkey: new PublicKey(parsed.programId),
              totalChunks: parsed.totalChunks,
              durationMs: parsed.durationMs,
              rentLamports: parsed.rentLamports,
            });
            setPanelState("success");
            window.dispatchEvent(new CustomEvent("superteam:deploy-complete"));
            return;
          }
        }
      } catch {
        // fall through to server check
      }

      // 2. Fall back to server API (no stats, but at least has programId)
      try {
        const res = await fetch(
          `/api/deploy/save?lessonId=${encodeURIComponent(lessonId)}&courseId=${encodeURIComponent(courseId)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.deployed && data.programId) {
          setResult({
            programId: data.programId,
            programIdPubkey: new PublicKey(data.programId),
            totalChunks: 0,
            durationMs: 0,
            rentLamports: 0,
          });
          setPanelState("success");
          window.dispatchEvent(new CustomEvent("superteam:deploy-complete"));
        }
      } catch {
        // Non-critical — fall back to normal flow
      }
    }
    checkExistingDeployment();
  }, [lessonId, courseId, courseSlug]);

  // Check for resumable state on mount
  useEffect(() => {
    const existing = loadSavedState(buildUuid);
    if (existing && existing.phase !== "complete") {
      setSavedState(existing);
      setPanelState("paused");
    }
  }, [buildUuid]);

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
        savePersistentState(buildUuid, state);
        setSavedState(state);
      },
    };
  }, [buildUuid]);

  // Save program ID on success
  const handleSuccess = useCallback(
    (deployResult: DeployResult) => {
      setResult(deployResult);
      setPanelState("success");
      clearSavedState(buildUuid);

      // Save program ID + stats to localStorage for use in later lessons and refresh
      try {
        localStorage.setItem(`program-${courseSlug}`, deployResult.programId);
        localStorage.setItem(
          `deploy-result-${courseSlug}-${lessonId}`,
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

      // Fire confetti celebration
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

      // Notify challenge runner that deployment is complete (enables submit)
      window.dispatchEvent(new CustomEvent("superteam:deploy-complete"));

      // Attempt to persist to server (silently fail -- API route not yet created)
      try {
        fetch("/api/deploy/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId,
            courseId,
            courseSlug,
            programId: deployResult.programId,
            totalChunks: deployResult.totalChunks,
            durationMs: deployResult.durationMs,
            rentLamports: deployResult.rentLamports,
          }),
        }).catch(() => {
          // API route not yet implemented -- localStorage is primary persistence
        });
      } catch {
        // ignore
      }
    },
    [buildUuid, courseSlug, lessonId, courseId]
  );

  // Deploy handler
  const handleDeploy = useCallback(async () => {
    if (!publicKey || !signTransaction || !signAllTransactions) return;

    setPanelState("deploying");
    setTxLog([]);
    setChunkCurrent(0);
    setChunkTotal(0);
    setErrorMessage(null);
    setResult(null);
    startTimeRef.current = Date.now();

    const callbacks = buildCallbacks();

    try {
      const deployResult = await deployProgram({
        connection,
        wallet: { publicKey, signTransaction, signAllTransactions },
        buildServerUrl: "/api",
        buildUuid,
        callbacks,
        programKeypairSecret,
      });
      handleSuccess(deployResult);
    } catch (err) {
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
    publicKey,
    signTransaction,
    signAllTransactions,
    connection,
    buildUuid,
    programKeypairSecret,
    buildCallbacks,
    handleSuccess,
  ]);

  // Resume handler
  const handleResume = useCallback(async () => {
    if (!publicKey || !signTransaction || !signAllTransactions || !savedState)
      return;

    setPanelState("deploying");
    setErrorMessage(null);
    startTimeRef.current = Date.now();

    // Restore chunk progress from saved state
    setChunkCurrent(savedState.lastUploadedChunk + 1);
    setChunkTotal(savedState.totalChunks);

    const callbacks = buildCallbacks();

    try {
      const deployResult = await resumeDeployment({
        connection,
        wallet: { publicKey, signTransaction, signAllTransactions },
        buildServerUrl: "/api",
        state: savedState,
        callbacks,
      });
      handleSuccess(deployResult);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMessage(message);
      setPanelState("paused");
    }
  }, [
    publicKey,
    signTransaction,
    signAllTransactions,
    connection,
    savedState,
    buildCallbacks,
    handleSuccess,
  ]);

  // Start over handler
  const handleStartOver = useCallback(() => {
    clearSavedState(buildUuid);
    setSavedState(null);
    setPanelState("ready");
    setTxLog([]);
    setChunkCurrent(0);
    setChunkTotal(0);
    setErrorMessage(null);
    setResult(null);
    setCurrentStep("buffer");
  }, [buildUuid]);

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
      <Card className="border-green-500/30 bg-green-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-green-500">
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
                {copied ? "Copied!" : ""}
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
                        isComplete &&
                          "border-green-500 bg-green-500 text-white",
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
                        isComplete ? "bg-green-500" : "bg-muted-foreground/20"
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

          {/* Batch signing prompt */}
          {currentStep === "upload" &&
            chunkTotal > 0 &&
            chunkCurrent > 0 &&
            chunkCurrent < chunkTotal &&
            chunkCurrent % 30 === 0 && (
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
                {t("batchSigning")}
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

          <div className="flex gap-2">
            {!isExpired && savedState && (
              <Button
                onClick={handleResume}
                className="flex-1"
                disabled={!publicKey}
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

        {/* Build UUID */}
        <div className="bg-muted/30 rounded-md px-3 py-2">
          <span className="text-xs text-muted-foreground">Build: </span>
          <span className="font-mono text-xs">{buildUuid.slice(0, 12)}...</span>
        </div>

        <Button
          onClick={handleDeploy}
          className="w-full bg-gradient-to-r from-solana-purple to-solana-green font-semibold text-white hover:opacity-90"
          disabled={!publicKey}
        >
          {t("deployToDevnet")}
        </Button>
      </CardContent>
    </Card>
  );
}
