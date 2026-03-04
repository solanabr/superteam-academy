"use client";

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Editor,
  type EditorLanguage,
  type EditorValidationState,
} from "@/components/Playground/Editor";
import { TestResults } from "@/components/Playground/TestResults";
import { useTestRunner } from "@/components/Playground/TestRunner";
import { useEnrollment } from "@/hooks/useEnrollment";
import { useCourse } from "@/hooks/useCourses";
import { useSigningMode } from "@/hooks/useSigningMode";
import { isLessonComplete, normalizeFlags } from "@/lib/bitmap";
import {
  markLessonCompleteStub,
  isLessonCompleteStub,
  addStubXp,
} from "@/lib/stubStorage";
import type { RunResult } from "@/components/Playground/TestRunner";
import { Confetti } from "@/components/Confetti";
import { XpFlyup } from "@/components/XpFlyup";
import { track } from "@/lib/analytics";
import { createActionProof } from "@/lib/action-proof";
import { markLearningActivityToday } from "@/lib/streak";

interface PlaygroundClientProps {
  courseId: string;
  lessonIndex: number;
  lessonCount: number;
  starterCode: string;
  testCode: string;
  language?: EditorLanguage;
  fileName?: string;
}

interface CompleteLessonResponse {
  txSignature?: string;
  xpEarned?: number;
  lessonsCompleted?: number;
  totalLessons?: number;
  error?: string;
}

const LANGUAGE_OPTIONS: EditorLanguage[] = [
  "javascript",
  "typescript",
  "rust",
  "json",
];

const RUNNABLE_LANGUAGES = new Set<EditorLanguage>([
  "javascript",
  "typescript",
]);

const MIN_EDITOR_RATIO = 0.4;
const MAX_EDITOR_RATIO = 0.75;
const AUTOSAVE_DEBOUNCE_MS = 600;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function inferEditorLanguage(starterCode: string, testCode: string): EditorLanguage {
  const code = starterCode.trim();

  const looksLikeRust =
    /\bfn\s+\w+\s*\(/.test(code) ||
    /\blet\s+(mut\s+)?\w+/.test(code) ||
    /\buse\s+[\w:]+/.test(code) ||
    /::/.test(code);

  if (looksLikeRust) return "rust";

  const looksLikeTypeScript =
    /\binterface\s+\w+/.test(code) ||
    /\btype\s+\w+\s*=/.test(code) ||
    /:\s*(string|number|boolean|unknown|any|Record<|Array<|\w+\[\])/.test(code);

  if (looksLikeTypeScript) return "typescript";

  const looksLikeJson =
    (code.startsWith("{") || code.startsWith("[")) &&
    !/\bfunction\b|\bconst\b|\blet\b|\bassert\(/.test(code) &&
    !testCode.includes("assert(");

  if (looksLikeJson) {
    try {
      JSON.parse(code);
      return "json";
    } catch {
      // Keep javascript fallback.
    }
  }

  return "javascript";
}

function defaultFileNameForLanguage(language: EditorLanguage): string {
  switch (language) {
    case "typescript":
      return "solution.ts";
    case "rust":
      return "solution.rs";
    case "json":
      return "solution.json";
    default:
      return "solution.js";
  }
}

export default function PlaygroundClient({
  courseId,
  lessonIndex,
  lessonCount,
  starterCode,
  testCode,
  language,
  fileName,
}: PlaygroundClientProps) {
  const { publicKey, connected, signMessage } = useWallet();
  const { runTests } = useTestRunner();
  const t = useTranslations("LessonPlayground");
  const queryClient = useQueryClient();
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const signingMode = useSigningMode();

  const detectedLanguage = useMemo(
    () => language ?? inferEditorLanguage(starterCode, testCode),
    [language, starterCode, testCode],
  );

  const [code, setCode] = useState(starterCode);
  const [editorLanguage, setEditorLanguage] =
    useState<EditorLanguage>(detectedLanguage);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXpFlyup, setShowXpFlyup] = useState(false);
  const [optimisticComplete, setOptimisticComplete] = useState(false);
  const [editorValidation, setEditorValidation] =
    useState<EditorValidationState>({
      errorCount: 0,
      warningCount: 0,
      firstError: null,
    });
  const [splitRatio, setSplitRatio] = useState(0.6);
  const [isResizingSplit, setIsResizingSplit] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const splitContainerRef = useRef<HTMLDivElement | null>(null);

  const { data: enrollment } = useEnrollment(courseId);
  const { data: course } = useCourse(courseId);
  const xpPerLesson = course?.xpPerLesson;
  const wallet = publicKey?.toBase58() ?? null;

  const autosaveKey = useMemo(
    () => `lesson-draft:${wallet ?? "guest"}:${courseId}:${lessonIndex}`,
    [wallet, courseId, lessonIndex],
  );

  useEffect(() => {
    let nextCode = starterCode;

    try {
      const savedDraft = window.localStorage.getItem(autosaveKey);
      if (savedDraft !== null && savedDraft.length > 0) {
        nextCode = savedDraft;
      }
    } catch {
      // Ignore storage access failures in private mode.
    }

    setCode(nextCode);
    setEditorLanguage(detectedLanguage);
    setRunResult(null);
    setSubmitError(null);
    setEditorValidation({ errorCount: 0, warningCount: 0, firstError: null });
  }, [autosaveKey, courseId, lessonIndex, starterCode, detectedLanguage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(autosaveKey, code);
        setLastSavedAt(Date.now());
      } catch {
        // Ignore storage write failures.
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [autosaveKey, code]);

  useEffect(() => {
    if (!isResizingSplit) return;

    const onMouseMove = (event: MouseEvent) => {
      const container = splitContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;

      const ratio = (event.clientX - rect.left) / rect.width;
      setSplitRatio(clamp(ratio, MIN_EDITOR_RATIO, MAX_EDITOR_RATIO));
    };

    const onMouseUp = () => {
      setIsResizingSplit(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingSplit]);

  const lessonFlags = enrollment
    ? normalizeFlags(enrollment.lessonFlags)
    : null;
  const chainComplete = lessonFlags
    ? isLessonComplete(lessonFlags, lessonIndex)
    : false;

  const stubComplete =
    signingMode === "stub" &&
    wallet !== null &&
    isLessonCompleteStub(wallet, courseId, lessonIndex);

  const isComplete = chainComplete || optimisticComplete || stubComplete;

  const isEnrolled = !!enrollment;
  const allTestsPassed = runResult?.passed === true;
  const runnerSupportedLanguage = RUNNABLE_LANGUAGES.has(editorLanguage);
  const canSubmit =
    allTestsPassed &&
    connected &&
    isEnrolled &&
    !isComplete &&
    runnerSupportedLanguage;
  const isLastLesson = lessonIndex === lessonCount - 1;

  const fileLabel = fileName ?? defaultFileNameForLanguage(editorLanguage);
  const editorWidthPercent = Math.round(splitRatio * 100);

  const languageLabels = useMemo(
    () => ({
      javascript: t("editor.languages.javascript"),
      typescript: t("editor.languages.typescript"),
      rust: t("editor.languages.rust"),
      json: t("editor.languages.json"),
    }),
    [t],
  );

  const runDisabledReason = runnerSupportedLanguage
    ? null
    : t("status.runUnsupported", {
        language: languageLabels[editorLanguage],
      });

  const handleRun = useCallback(async () => {
    setSubmitError(null);

    if (!runnerSupportedLanguage) {
      setRunResult({
        passed: false,
        results: [
          {
            name: t("status.runnerUnavailableTitle"),
            passed: false,
            error: runDisabledReason ?? t("status.runnerUnavailableFallback"),
          },
        ],
      });
      return;
    }

    setIsRunning(true);
    try {
      const result = await runTests(code, testCode);
      setRunResult(result);
    } finally {
      setIsRunning(false);
    }
  }, [code, testCode, runTests, runnerSupportedLanguage, runDisabledReason, t]);

  const handleResetDraft = useCallback(() => {
    setCode(starterCode);
    setRunResult(null);
    setSubmitError(null);
    try {
      window.localStorage.removeItem(autosaveKey);
    } catch {
      // Ignore storage deletion failures.
    }
  }, [autosaveKey, starterCode]);

  const handleSubmit = useCallback(async () => {
    if (!publicKey || !canSubmit) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setOptimisticComplete(true);

    try {
      if (signingMode === "stub") {
        if (wallet) {
          const alreadyDone = isLessonCompleteStub(
            wallet,
            courseId,
            lessonIndex,
          );
          if (alreadyDone) {
            setXpEarned(0);
            markLearningActivityToday();
          } else {
            markLessonCompleteStub(wallet, courseId, lessonIndex);
            const earned = xpPerLesson ?? 0;
            if (earned > 0) addStubXp(wallet, earned);
            const finalEarned = earned > 0 ? earned : null;
            setXpEarned(finalEarned);
            markLearningActivityToday();
            track.lessonComplete(courseId, lessonIndex, earned);
            if (earned > 0) {
              track.xpEarned(earned, "lesson_complete");
            }
            setShowConfetti(true);
            if (finalEarned && finalEarned > 0) setShowXpFlyup(true);
          }
        }
        return;
      }

      const res = await fetch("/api/complete-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learner: publicKey.toBase58(),
          courseId,
          lessonIndex,
          testResults: runResult,
          proof: await createActionProof(signMessage, {
            action: "complete_lesson",
            learner: publicKey.toBase58(),
            courseId,
            lessonIndex,
          }),
        }),
      });

      const data = (await res.json()) as CompleteLessonResponse;

      if (res.status === 409) {
        setXpEarned(0);
        markLearningActivityToday();
      } else if (!res.ok) {
        setOptimisticComplete(false);
        setSubmitError(
          data.error === "UNAUTHORIZED_ACTION"
            ? t("errors.submitFailed")
            : (data.error ?? t("errors.submitFailed")),
        );
        return;
      } else {
        const earned = data.xpEarned ?? null;
        setXpEarned(earned);
        markLearningActivityToday();
        track.lessonComplete(courseId, lessonIndex, earned ?? 0);
        if ((earned ?? 0) > 0) {
          track.xpEarned(earned ?? 0, "lesson_complete");
        }
        setShowConfetti(true);
        if (earned && earned > 0) setShowXpFlyup(true);
      }

      await queryClient.invalidateQueries({
        queryKey: ["enrollment", courseId, publicKey.toBase58()],
      });
      await queryClient.invalidateQueries({
        queryKey: ["xp-balance", publicKey.toBase58()],
      });
    } catch {
      setOptimisticComplete(false);
      setSubmitError(t("errors.network"));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    publicKey,
    wallet,
    canSubmit,
    signingMode,
    courseId,
    lessonIndex,
    xpPerLesson,
    runResult,
    queryClient,
    signMessage,
    t,
  ]);

  const renderEditorPanel = (
    className: string,
    style?: CSSProperties,
  ) => (
    <div
      className={`${className} rounded-lg border border-gray-700 bg-gray-950 overflow-hidden min-w-0`}
      style={style}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs text-gray-400 font-mono truncate" title={fileLabel}>
            {fileLabel}
          </span>
          {isComplete && (
            <span className="text-xs font-medium text-green-400">
              {t("status.complete")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="lesson-editor-language"
            className="text-[11px] font-medium text-gray-400"
          >
            {t("editor.languageLabel")}
          </label>
          <select
            id="lesson-editor-language"
            value={editorLanguage}
            onChange={(event) =>
              setEditorLanguage(event.target.value as EditorLanguage)
            }
            className="h-8 rounded-md border border-gray-700 bg-gray-950 px-2 text-xs text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {languageLabels[option]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleResetDraft}
            className="h-8 rounded-md border border-gray-700 bg-gray-950 px-2 text-[11px] text-gray-300 hover:bg-gray-900 transition-colors"
          >
            {t("editor.reset")}
          </button>
        </div>
      </div>

      <div
        className="px-4 py-2 text-xs border-b border-gray-800"
        style={{
          color:
            editorValidation.errorCount > 0
              ? "#fca5a5"
              : editorValidation.warningCount > 0
                ? "#fcd34d"
                : "#86efac",
          background:
            editorValidation.errorCount > 0
              ? "rgba(239,68,68,0.08)"
              : editorValidation.warningCount > 0
                ? "rgba(251,191,36,0.08)"
                : "rgba(20,241,149,0.08)",
        }}
      >
        {editorValidation.errorCount > 0
          ? t("editor.syntaxErrors", { count: editorValidation.errorCount })
          : editorValidation.warningCount > 0
            ? t("editor.syntaxWarnings", {
                count: editorValidation.warningCount,
              })
            : t("editor.syntaxClean")}
        {editorValidation.firstError && (
          <span className="ml-1.5">{editorValidation.firstError}</span>
        )}
        {lastSavedAt && (
          <span className="ml-2 text-gray-400">
            {t("editor.autosavedAt", {
              time: new Date(lastSavedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            })}
          </span>
        )}
      </div>

      <div className="h-[280px] md:h-[360px]">
        <Editor
          value={code}
          onChange={setCode}
          height="100%"
          language={editorLanguage}
          fileName={fileLabel}
          onValidationChange={setEditorValidation}
        />
      </div>
    </div>
  );

  const renderResultsPanel = (className: string) => (
    <div className={className}>
      <TestResults
        result={runResult}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
        runDisabledReason={runDisabledReason}
        onRun={handleRun}
        onSubmit={handleSubmit}
        submitError={submitError}
        xpEarned={xpEarned}
        isComplete={isComplete}
      />
    </div>
  );

  return (
    <div>
      <Confetti active={showConfetti} />
      {showXpFlyup && xpEarned && xpEarned > 0 && (
        <XpFlyup amount={xpEarned} onDone={() => setShowXpFlyup(false)} />
      )}

      <div className="md:hidden flex flex-col gap-4 mb-4">
        {renderEditorPanel("w-full")}
        {renderResultsPanel("w-full min-w-0")}
      </div>

      <div
        ref={splitContainerRef}
        className="hidden md:flex items-stretch mb-4 min-w-0"
      >
        {renderEditorPanel("min-w-[360px]", {
          width: `${editorWidthPercent}%`,
        })}

        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            setIsResizingSplit(true);
          }}
          className="mx-2 w-2 shrink-0 rounded-full border border-transparent hover:border-gray-700 bg-gray-900/60 hover:bg-gray-800 cursor-col-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          aria-label={t("editor.resizeAria")}
          title={t("editor.resizeAria")}
        />

        {renderResultsPanel("flex-1 min-w-[300px]")}
      </div>

      {!connected && (
        <p className="text-sm text-gray-500 text-center mb-4">
          {t("status.connectWallet")}
        </p>
      )}
      {connected && !isEnrolled && !isComplete && (
        <p className="text-sm text-gray-500 text-center mb-4">
          <Link
            href={`/${locale}/courses/${courseId}`}
            prefetch={false}
            className="text-purple-400 underline hover:text-purple-300"
          >
            {t("status.enrollCourseLink")}
          </Link>{" "}
          {t("status.enrollCourseSuffix")}
        </p>
      )}

      {isComplete && (
        <div className="rounded-lg border border-green-800 bg-green-950 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-green-300 font-semibold">
              {t("status.lessonComplete", { index: lessonIndex + 1 })}
            </p>
            {xpEarned !== null && xpEarned > 0 && (
              <p className="text-sm text-purple-300 mt-0.5">
                +{xpEarned} XP
                {` ${t("status.addedToBalance")}`}
              </p>
            )}
          </div>
          {isLastLesson ? (
            <Link
              href={`/${locale}/courses/${courseId}`}
              prefetch={false}
              className="shrink-0 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-semibold transition-colors"
            >
              {t("actions.allLessonsDone")}
            </Link>
          ) : (
            <Link
              href={`/${locale}/courses/${courseId}/lessons/${lessonIndex + 1}`}
              prefetch={false}
              className="shrink-0 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-semibold transition-colors"
            >
              {t("actions.nextLesson")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
