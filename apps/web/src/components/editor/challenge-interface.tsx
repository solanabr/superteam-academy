"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import confetti from "canvas-confetti";
import { useTranslations } from "next-intl";
import {
  Lightbulb,
  Eye,
  ArrowCounterClockwise,
  Trophy,
  Lightning,
} from "@phosphor-icons/react";
import { CodeEditor, resetEditorStorage } from "./code-editor";
import { OutputPanel } from "./output-panel";
import { ChallengeRunner } from "./challenge-runner";
import type {
  ChallengeInterfaceProps,
  ChallengeState,
  ExecutionResult,
} from "./types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LESSON_COMPLETE_EVENT = "superteam:lesson-complete";

export function ChallengeInterface({
  lessonId,
  description,
  initialCode,
  language,
  buildType,
  isDeployable,
  tests,
  hints,
  solution,
  xpReward,
  isAlreadyCompleted,
  isEnrolled: isEnrolledProp,
  onEnroll,
  onComplete,
  hideDescription,
  className,
}: ChallengeInterfaceProps) {
  const t = useTranslations("lesson");
  const tCommon = useTranslations("common");
  const tCourses = useTranslations("courses");
  const tA11y = useTranslations("a11y");

  // Default to true for backwards compatibility
  const isEnrolled = isEnrolledProp ?? true;

  const [code, setCode] = useState(initialCode);
  const [challengeState, setChallengeState] = useState<ChallengeState>({
    status: "idle",
    executionResult: null,
    hintsRevealed: 0,
    solutionRevealed: false,
  });
  const [showSolutionDialog, setShowSolutionDialog] = useState(false);
  const [isComplete, setIsComplete] = useState(isAlreadyCompleted ?? false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  // Sync when the async DB check resolves after mount
  useEffect(() => {
    if (isAlreadyCompleted) setIsComplete(true);
  }, [isAlreadyCompleted]);
  const [showDescription, setShowDescription] = useState(true);
  const [descHeight, setDescHeight] = useState(180);
  const [panelHeight, setPanelHeight] = useState(250);
  const resizeRef = useRef<{
    startY: number;
    startHeight: number;
    target: "description" | "output";
  } | null>(null);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  const handleResult = useCallback((result: ExecutionResult) => {
    setChallengeState((prev) => ({
      ...prev,
      status: result.success ? "success" : "error",
      executionResult: result,
    }));
  }, []);

  const handleClearOutput = useCallback(() => {
    setChallengeState((prev) => ({
      ...prev,
      status: "idle",
      executionResult: null,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setCode(initialCode);
    resetEditorStorage(lessonId);
    setChallengeState((prev) => ({
      status: "idle",
      executionResult: null,
      hintsRevealed: 0,
      solutionRevealed: prev.solutionRevealed, // Penalty persists — no XP exploit
    }));
  }, [initialCode, lessonId]);

  const handleRevealHint = useCallback(() => {
    setChallengeState((prev) => ({
      ...prev,
      hintsRevealed: Math.min(prev.hintsRevealed + 1, hints.length),
    }));
  }, [hints.length]);

  const handleShowSolution = useCallback(() => {
    // Skip confirmation dialog if the XP penalty is already locked in
    if (challengeState.solutionRevealed) {
      setCode(solution);
      return;
    }
    setShowSolutionDialog(true);
  }, [challengeState.solutionRevealed, solution]);

  const handleConfirmSolution = useCallback(() => {
    setShowSolutionDialog(false);
    setChallengeState((prev) => ({
      ...prev,
      solutionRevealed: true,
    }));
    setCode(solution);
  }, [solution]);

  const completeLesson = useCallback(() => {
    setIsComplete(true);
    setPendingSubmit(false);
    onComplete?.();

    // Trigger confetti celebration
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

    // Emit custom event for gamification system
    const event = new CustomEvent(LESSON_COMPLETE_EVENT, {
      detail: {
        lessonId,
        xpReward: challengeState.solutionRevealed
          ? Math.floor(xpReward * 0.5)
          : xpReward,
      },
    });
    window.dispatchEvent(event);
  }, [lessonId, xpReward, challengeState.solutionRevealed, onComplete]);

  const handleSubmit = useCallback(() => {
    if (!isEnrolled) {
      // Tests passed but not enrolled — prompt enrollment
      setPendingSubmit(true);
      return;
    }
    completeLesson();
  }, [isEnrolled, completeLesson]);

  // Auto-complete when user enrolls after passing all tests
  useEffect(() => {
    if (pendingSubmit && isEnrolled && !isComplete) {
      completeLesson();
    }
  }, [pendingSubmit, isEnrolled, isComplete, completeLesson]);

  const handleResizeStart = useCallback(
    (target: "description" | "output") => (e: React.MouseEvent) => {
      e.preventDefault();
      const startHeight = target === "description" ? descHeight : panelHeight;
      resizeRef.current = { startY: e.clientY, startHeight, target };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizeRef.current) return;
        // Description: drag down = taller, Output: drag up = taller
        const delta =
          resizeRef.current.target === "description"
            ? moveEvent.clientY - resizeRef.current.startY
            : resizeRef.current.startY - moveEvent.clientY;
        const newHeight = Math.max(
          80,
          Math.min(500, resizeRef.current.startHeight + delta)
        );
        if (resizeRef.current.target === "description") {
          setDescHeight(newHeight);
        } else {
          setPanelHeight(newHeight);
        }
      };

      const handleMouseUp = () => {
        resizeRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [descHeight, panelHeight]
  );

  const visibleHints = hints.slice(0, challengeState.hintsRevealed);
  const hasMoreHints = challengeState.hintsRevealed < hints.length;

  return (
    <div className={cn("flex h-full flex-col overflow-hidden", className)}>
      {/* Description toggle + test cases (hidden when rendered externally) */}
      {!hideDescription && (
        <>
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="hover:bg-subtle/50 flex w-full shrink-0 items-center gap-2 border-b border-border px-4 py-2 text-left text-sm font-medium"
            type="button"
          >
            <span
              className="inline-block text-sm transition-transform duration-200"
              style={{
                transform: showDescription ? "rotate(180deg)" : "rotate(0)",
              }}
              aria-hidden="true"
            >
              ▾
            </span>
            {t("challenge")}
            <span className="ml-auto flex items-center gap-1 font-display text-xs font-bold text-accent">
              <Lightning size={14} weight="duotone" className="text-accent" />
              {xpReward} XP
            </span>
          </button>
        </>
      )}

      {/* Challenge description */}
      {!hideDescription && showDescription && (
        <>
          <div
            className="shrink-0 overflow-auto px-4 py-3"
            style={{ height: descHeight, minHeight: 80 }}
          >
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(description),
              }}
            />

            {/* Hints */}
            {visibleHints.length > 0 && (
              <div className="mt-3 space-y-2">
                {visibleHints.map((hint, index) => (
                  <div
                    key={`hint-${index}`}
                    className="border-accent/30 bg-accent/5 flex items-start gap-2 rounded-md border p-2"
                  >
                    <Lightbulb
                      size={16}
                      weight="duotone"
                      className="mt-0.5 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <span className="text-xs">{hint}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Visible test cases */}
            {tests.filter((tc) => !tc.hidden).length > 0 && (
              <div className="mt-3">
                <h4 className="mb-2 text-xs font-semibold uppercase text-text-3">
                  {t("testCases")}
                </h4>
                <div className="space-y-1.5">
                  {tests
                    .filter((tc) => !tc.hidden)
                    .map((tc) => (
                      <div
                        key={tc.id}
                        className="bg-subtle/30 rounded-md border border-border p-2 text-xs"
                      >
                        <span className="font-medium">{tc.description}</span>
                        <div className="mt-1 flex gap-4 font-mono text-text-3">
                          <span>
                            {t("input")}: <code>{tc.input}</code>
                          </span>
                          <span>
                            {t("expected")}: <code>{tc.expectedOutput}</code>
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Description resizer */}
          <div
            className="bg-subtle/30 hover:bg-primary/20 group relative h-1.5 shrink-0 cursor-row-resize border-y border-border transition-colors"
            onMouseDown={handleResizeStart("description")}
            role="separator"
            aria-orientation="horizontal"
            tabIndex={0}
          >
            <div className="bg-text-3/30 group-hover:bg-primary/50 absolute left-1/2 top-1/2 h-0.5 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors" />
          </div>
        </>
      )}

      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-1.5">
        <ChallengeRunner
          code={code}
          tests={tests}
          language={language}
          buildType={buildType}
          isDeployable={isDeployable}
          onResult={handleResult}
          onSubmit={handleSubmit}
          isComplete={isComplete}
          xpReward={xpReward}
          solutionRevealed={challengeState.solutionRevealed}
        />

        <div className="flex items-center gap-1">
          {hasMoreHints && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRevealHint}
              className="gap-1 text-xs"
            >
              <Lightbulb size={16} weight="duotone" aria-hidden="true" />
              {t("showHint")}
              <span className="text-text-3">
                ({challengeState.hintsRevealed}/{hints.length})
              </span>
            </Button>
          )}

          {solution && code !== solution && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowSolution}
              className="gap-1 text-xs"
            >
              <Eye size={16} weight="duotone" aria-hidden="true" />
              {t("showSolution")}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1 text-xs"
          >
            <ArrowCounterClockwise
              size={16}
              weight="duotone"
              aria-hidden="true"
            />
            {t("resetCode")}
          </Button>
        </div>
      </div>

      {/* Hints (shown inline when description is hidden, i.e. split-panel mode) */}
      {hideDescription && visibleHints.length > 0 && (
        <div className="shrink-0 space-y-2 border-b border-border px-4 py-3">
          {visibleHints.map((hint, index) => (
            <div
              key={`hint-${index}`}
              className="border-accent/30 bg-accent/5 flex items-start gap-2 rounded-md border p-2"
            >
              <Lightbulb
                size={16}
                weight="duotone"
                className="mt-0.5 shrink-0 text-accent"
                aria-hidden="true"
              />
              <span className="text-xs">{hint}</span>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="relative min-h-0 flex-1">
        <CodeEditor
          lessonId={lessonId}
          initialCode={initialCode}
          language={language}
          value={code}
          onChange={handleCodeChange}
          className="h-full rounded-none border-0"
        />

        {/* Enroll overlay — tests passed but not enrolled */}
        {pendingSubmit && !isEnrolled && !isComplete && (
          <div className="bg-bg/60 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-xl border-[2.5px] border-border bg-card p-6 shadow-card">
              <Trophy
                size={32}
                weight="duotone"
                className="text-accent"
                aria-hidden="true"
              />
              <p className="font-display text-lg font-bold">
                {t("testsPassed")}
              </p>
              <p className="text-sm text-text-3">{t("enrollToSaveProgress")}</p>
              <Button variant="push" size="lg" onClick={onEnroll}>
                {tCourses("enrollNow")}
              </Button>
            </div>
          </div>
        )}

        {/* Success overlay */}
        {isComplete && (
          <div className="bg-bg/60 pointer-events-none absolute inset-0 flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 rounded-xl border-[2.5px] border-border bg-card p-6 shadow-card">
              <Trophy
                size={32}
                weight="duotone"
                className="text-accent"
                aria-hidden="true"
              />
              <p className="font-display text-lg font-bold">
                {t("lessonComplete")}
              </p>
              <p className="text-sm text-success">
                {t("xpEarned", {
                  amount: challengeState.solutionRevealed
                    ? Math.floor(xpReward * 0.5)
                    : xpReward,
                })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Resizable divider */}
      <div
        className="bg-subtle/30 hover:bg-primary/20 group relative h-1.5 shrink-0 cursor-row-resize border-y border-border transition-colors"
        onMouseDown={handleResizeStart("output")}
        role="separator"
        aria-orientation="horizontal"
        aria-label={tA11y("resizeOutputPanel")}
        tabIndex={0}
      >
        <div className="bg-text-3/30 group-hover:bg-primary/50 absolute left-1/2 top-1/2 h-0.5 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors" />
      </div>

      {/* Output panel */}
      <div className="shrink-0" style={{ height: panelHeight, minHeight: 100 }}>
        <OutputPanel
          executionResult={challengeState.executionResult}
          isRunning={challengeState.status === "running"}
          onClear={handleClearOutput}
          className="h-full rounded-none border-0"
        />
      </div>

      {/* Solution confirmation dialog */}
      <Dialog open={showSolutionDialog} onOpenChange={setShowSolutionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("showSolution")}</DialogTitle>
            <DialogDescription>{t("solutionWarning")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSolutionDialog(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmSolution}>
              {t("showSolution")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
