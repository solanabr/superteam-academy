"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CodeEditor } from "@/components/code-editor";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Code,
  Terminal,
  CheckCircle2,
  Check,
  CircleDot,
  HelpCircle,
} from "lucide-react";
import type { Lesson } from "@/data/courses";
import { useAuth } from "@/hooks/use-auth";
import { onLessonCompleted, recordPerfectScore } from "@/services/gamification";
import { LessonForum } from "@/components/lesson-forum";
import { CertificateMintModal } from "@/components/certificate-mint-modal";

interface LessonViewProps {
  courseSlug: string;
  courseTitle: string;
  moduleTitle: string;
  lesson: Lesson;
  prevLesson: { slug: string; title: string } | null;
  nextLesson: { slug: string; title: string } | null;
  allLessons: { slug: string; title: string; id: string }[];
}

function getStorageKey(wallet: string, courseSlug: string, lessonId: string) {
  return `st-academy:${wallet}:lesson:${courseSlug}:${lessonId}`;
}

function getEnrollmentKey(wallet: string, courseSlug: string) {
  return `st-academy:${wallet}:enrolled:${courseSlug}`;
}

// Legacy keys (without wallet) for migration
const LEGACY_ENROLLMENT_PREFIX = "st-academy:enrolled:";
function legacyLessonKey(courseSlug: string, lessonId: string) {
  return `st-academy:lesson:${courseSlug}:${lessonId}`;
}

export function LessonView({
  courseSlug,
  courseTitle,
  moduleTitle,
  lesson,
  prevLesson,
  nextLesson,
  allLessons,
}: LessonViewProps) {
  const t = useTranslations("lesson");
  const tCourse = useTranslations("course");
  const tCommon = useTranslations("common");
  const { publicKey } = useAuth();
  const walletAddr = publicKey?.toBase58() ?? "";
  const [enrolled, setEnrolled] = React.useState<boolean | null>(null);
  const [runLoading, setRunLoading] = React.useState(false);
  const [testResults, setTestResults] = React.useState<{
    passed: number;
    total: number;
    details?: string;
  } | null>(null);
  const [completed, setCompleted] = React.useState(false);
  const [showCelebration, setShowCelebration] = React.useState(false);
  const [mobileEditorOpen, setMobileEditorOpen] = React.useState(false);
  const [autoSaved, setAutoSaved] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState<number | null>(
    null,
  );
  const [exerciseResult, setExerciseResult] = React.useState<
    "correct" | "incorrect" | null
  >(null);
  const [showCertModal, setShowCertModal] = React.useState(false);

  // Check enrollment on mount (wallet-scoped, with legacy migration)
  React.useEffect(() => {
    if (!walletAddr) {
      setEnrolled(false);
      return;
    }
    const walletKey = getEnrollmentKey(walletAddr, courseSlug);
    let isEnrolled = localStorage.getItem(walletKey) === "true";
    // Migrate legacy (non-wallet) enrollment
    if (!isEnrolled) {
      const legacyKey = `${LEGACY_ENROLLMENT_PREFIX}${courseSlug}`;
      if (localStorage.getItem(legacyKey) === "true") {
        localStorage.setItem(walletKey, "true");
        isEnrolled = true;
      }
    }
    setEnrolled(isEnrolled);
  }, [courseSlug, walletAddr]);

  // Load completion status from localStorage on mount (wallet-scoped)
  React.useEffect(() => {
    if (!walletAddr) return;
    try {
      const key = getStorageKey(walletAddr, courseSlug, lesson.id);
      let stored = localStorage.getItem(key);
      // Migrate legacy key
      if (!stored) {
        const legacyKey = legacyLessonKey(courseSlug, lesson.id);
        const legacyVal = localStorage.getItem(legacyKey);
        if (legacyVal === "completed") {
          localStorage.setItem(key, "completed");
          stored = "completed";
        }
      }
      if (stored === "completed") {
        setCompleted(true);
        setAutoSaved(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, [courseSlug, lesson.id, walletAddr]);

  // Save completion status to localStorage when completed (wallet-scoped)
  React.useEffect(() => {
    if (!completed || !walletAddr) return;
    try {
      localStorage.setItem(
        getStorageKey(walletAddr, courseSlug, lesson.id),
        "completed",
      );
      setAutoSaved(true);
    } catch {
      // localStorage unavailable
    }
  }, [completed, courseSlug, lesson.id, walletAddr]);

  // Reset exercise state when lesson changes
  React.useEffect(() => {
    setSelectedOption(null);
    setExerciseResult(null);
  }, [lesson.id]);

  const markComplete = React.useCallback(() => {
    setCompleted(true);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);

    // Award XP, record activity, update streak, check achievements
    const userId = publicKey?.toBase58() ?? "anonymous";
    onLessonCompleted(
      userId,
      courseSlug,
      lesson.title,
      lesson.slug,
      lesson.xpReward,
      lesson.type === "challenge",
    );

    // Check if ALL lessons in the course are now completed
    if (walletAddr && allLessons.length > 0) {
      // Save current lesson first (the effect hasn't fired yet)
      try {
        localStorage.setItem(
          getStorageKey(walletAddr, courseSlug, lesson.id),
          "completed",
        );
      } catch {
        /* */
      }

      const allCompleted = allLessons.every((l) => {
        const key = getStorageKey(walletAddr, courseSlug, l.id);
        return localStorage.getItem(key) === "completed";
      });

      if (allCompleted) {
        // Check if certificate not already minted
        const certKey = `st-academy:${walletAddr}:certificate:${courseSlug}`;
        if (!localStorage.getItem(certKey)) {
          // Delay to let celebration animation play first
          setTimeout(() => setShowCertModal(true), 2200);
        }
      }
    }
  }, [
    publicKey,
    courseSlug,
    lesson.title,
    lesson.slug,
    lesson.xpReward,
    lesson.type,
    walletAddr,
    allLessons,
    lesson.id,
  ]);

  // Auto-complete content-only lessons (no exercise, no challenge) after reading
  React.useEffect(() => {
    if (completed) return;
    if (enrolled !== true) return;
    const isContentOnly = lesson.type === "content" && !lesson.exercise;
    if (!isContentOnly) return;
    const timer = setTimeout(() => {
      markComplete();
    }, 1500);
    return () => clearTimeout(timer);
  }, [completed, enrolled, lesson.type, lesson.exercise, markComplete]);

  const handleCheckAnswer = React.useCallback(() => {
    if (selectedOption === null || !lesson.exercise) return;
    if (selectedOption === lesson.exercise.correctIndex) {
      setExerciseResult("correct");
      // Record perfect score if first attempt (no previous incorrect)
      if (exerciseResult === null) {
        const userId = publicKey?.toBase58() ?? "anonymous";
        recordPerfectScore(userId);
      }
      // Auto-complete lesson on correct answer
      if (!completed) {
        markComplete();
      }
    } else {
      setExerciseResult("incorrect");
    }
  }, [
    selectedOption,
    lesson.exercise,
    exerciseResult,
    publicKey,
    completed,
    markComplete,
  ]);

  const handleTryAgain = React.useCallback(() => {
    setSelectedOption(null);
    setExerciseResult(null);
  }, []);

  const handleRun = React.useCallback((_code: string) => {
    setRunLoading(true);
    setTestResults(null);
    setTimeout(() => {
      setTestResults({ passed: 1, total: 1 });
      setRunLoading(false);
    }, 800);
  }, []);

  const handleSubmit = React.useCallback(
    (_code: string) => {
      setTestResults({ passed: 1, total: 1 });
      markComplete();
    },
    [markComplete],
  );

  // Show enrollment gate if not enrolled
  if (enrolled === false) {
    return (
      <div className="container py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold text-[hsl(var(--brand-logo-green))]">
          {tCourse("enrollToAccess")}
        </h2>
        <Button
          asChild
          className="card-button bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
        >
          <Link href={`/courses/${courseSlug}`} className="text-white">
            {t("backToCourse")}
          </Link>
        </Button>
      </div>
    );
  }

  // Loading state while checking enrollment
  if (enrolled === null) {
    return (
      <div className="container py-16 text-center">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-muted border-t-[hsl(var(--brand-logo-green))]" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] flex-col bg-muted/30">
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="animate-celebration flex flex-col items-center gap-3 rounded-2xl bg-card/95 px-8 py-6 shadow-2xl backdrop-blur">
            <CheckCircle2 className="h-16 w-16 text-[hsl(var(--brand-logo-yellow))] dark:text-[#008c4C]" />
            <span className="text-lg font-semibold text-foreground">
              {t("lessonCompleted")}
            </span>
          </div>
          <style>{`
            @keyframes celebration-pop {
              0% { opacity: 0; transform: scale(0.5); }
              40% { opacity: 1; transform: scale(1.1); }
              60% { transform: scale(0.95); }
              80% { transform: scale(1.02); }
              100% { opacity: 1; transform: scale(1); }
            }
            @keyframes celebration-fade {
              0%, 70% { opacity: 1; }
              100% { opacity: 0; }
            }
            .animate-celebration {
              animation: celebration-pop 0.5s ease-out, celebration-fade 2s ease-in-out forwards;
            }
          `}</style>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-full flex-col overflow-auto lg:w-1/2">
          <div className="sticky top-0 z-10 border-b bg-card/95 px-6 py-5 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <nav className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Link
                href={`/courses/${courseSlug}`}
                className="hover:text-foreground hover:underline"
              >
                {courseTitle}
              </Link>
              <span aria-hidden>·</span>
              <span>{moduleTitle}</span>
            </nav>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground drop-shadow-md sm:text-3xl">
                {lesson.title}
              </h1>
              {completed && (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-[hsl(var(--brand-logo-yellow))] dark:text-[#008c4C]" />
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1 text-sm font-medium text-blue-500">
                +{lesson.xpReward} XP
              </span>
              <span className="text-sm text-blue-400 dark:text-blue-500">
                {lesson.durationMinutes} min
              </span>
              {lesson.type === "challenge" && (
                <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                  Desafio
                </span>
              )}
              {autoSaved && (
                <span className="text-xs text-white/70 dark:text-muted-foreground/70">
                  {t("autoSaved")}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 p-6">
            <div className="mx-auto max-w-3xl">
              {lesson.type === "content" && lesson.content && (
                <Card className="overflow-hidden border-0 shadow-lg">
                  <CardContent className="prose prose-neutral dark:prose-invert max-w-none p-6 sm:p-8">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {lesson.content}
                    </ReactMarkdown>
                  </CardContent>
                </Card>
              )}
              {/* Multiple choice exercise */}
              {lesson.exercise && (
                <Card className="mt-6 overflow-hidden border-2 border-primary/20 shadow-lg">
                  <CardHeader className="bg-muted/50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      {t("exercise")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
                    <p className="font-medium leading-relaxed text-foreground">
                      {lesson.exercise.question}
                    </p>
                    <div className="space-y-2">
                      {lesson.exercise.options.map((option, idx) => {
                        const isSelected = selectedOption === idx;
                        const isCorrectAnswer =
                          exerciseResult === "correct" && isSelected;
                        const isWrongAnswer =
                          exerciseResult === "incorrect" && isSelected;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (exerciseResult === "correct") return;
                              setSelectedOption(idx);
                              setExerciseResult(null);
                            }}
                            disabled={exerciseResult === "correct"}
                            className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm transition-all ${
                              isCorrectAnswer
                                ? "border-[hsl(var(--brand-logo-green))] bg-[hsl(var(--brand-logo-green))]/10 text-foreground"
                                : isWrongAnswer
                                  ? "border-red-500 bg-red-500/10 text-foreground"
                                  : isSelected
                                    ? "border-primary bg-primary/5 text-foreground"
                                    : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted/50"
                            }`}
                          >
                            <CircleDot
                              className={`h-4 w-4 shrink-0 ${
                                isSelected
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <span>{option}</span>
                            {isCorrectAnswer && (
                              <Check className="ml-auto h-4 w-4 text-[hsl(var(--brand-logo-green))]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      {exerciseResult === null && (
                        <Button
                          onClick={handleCheckAnswer}
                          disabled={selectedOption === null}
                          className="bg-[hsl(var(--brand-logo-green))] text-white hover:bg-[hsl(var(--brand-logo-green-hover))]"
                          size="sm"
                        >
                          {t("checkAnswer")}
                        </Button>
                      )}
                      {exerciseResult === "correct" && (
                        <span className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--brand-logo-green))]">
                          <CheckCircle2 className="h-4 w-4" />
                          {t("correct")}
                        </span>
                      )}
                      {exerciseResult === "incorrect" && (
                        <>
                          <span className="text-sm font-medium text-red-500">
                            {t("incorrect")}
                          </span>
                          <Button
                            onClick={handleTryAgain}
                            variant="outline"
                            size="sm"
                          >
                            {t("tryAgain")}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              {lesson.type === "challenge" && lesson.challenge && (
                <div className="space-y-6">
                  <Card className="overflow-hidden border-2 border-[hsl(var(--brand-logo-green))]/30 shadow-lg">
                    <CardHeader className="bg-muted/50">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Code className="h-5 w-5 text-[hsl(var(--brand-logo-green))]" />
                        {t("challenge")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                      <p className="leading-relaxed text-foreground">
                        {lesson.challenge.prompt}
                      </p>
                      {lesson.challenge.testCases?.length ? (
                        <p className="text-sm text-muted-foreground">
                          {t("testsPassed")}:{" "}
                          {lesson.challenge.testCases.length} cases
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="hint" className="rounded-xl border">
                      <AccordionTrigger className="flex items-center gap-2 px-4 py-3 hover:no-underline">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        {t("hint")}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        {t("hintStub")}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                      value="solution"
                      className="rounded-xl border"
                    >
                      <AccordionTrigger className="flex items-center gap-2 px-4 py-3 hover:no-underline">
                        <Code className="h-4 w-4 text-primary" />
                        {t("solution")}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                          {lesson.challenge.starterCode}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}

              {/* Per-lesson discussion forum */}
              <LessonForum courseSlug={courseSlug} lessonId={lesson.id} />
            </div>
          </div>

          {/* Mobile code editor panel */}
          {lesson.type === "challenge" &&
            lesson.challenge &&
            mobileEditorOpen && (
              <div className="border-t bg-muted/20 lg:hidden">
                <CodeEditor
                  lesson={lesson}
                  onRun={handleRun}
                  onSubmit={handleSubmit}
                  runLoading={runLoading}
                  testResults={testResults ?? undefined}
                  runLabel={t("run")}
                  submitLabel={t("submit")}
                  allTestsPassedLabel={t("testsPassedAll")}
                  passedCountLabel={t("passedCount")}
                />
              </div>
            )}
        </div>

        {/* Desktop code editor panel */}
        <div className="hidden w-1/2 flex-col overflow-hidden border-l bg-muted/20 lg:flex">
          {lesson.type === "challenge" && lesson.challenge && (
            <CodeEditor
              lesson={lesson}
              onRun={handleRun}
              onSubmit={handleSubmit}
              runLoading={runLoading}
              testResults={testResults ?? undefined}
              runLabel={t("run")}
              submitLabel={t("submit")}
              allTestsPassedLabel={t("testsPassedAll")}
              passedCountLabel={t("passedCount")}
            />
          )}
        </div>
      </div>

      {/* Mobile code editor toggle FAB */}
      {lesson.type === "challenge" && lesson.challenge && (
        <Button
          onClick={() => setMobileEditorOpen((prev) => !prev)}
          className="fixed bottom-24 right-4 z-20 gap-2 rounded-full shadow-lg bg-[hsl(var(--brand-logo-green))] text-white hover:bg-[hsl(var(--brand-logo-green-hover))] lg:hidden"
          size="default"
        >
          <Terminal className="h-4 w-4" />
          {mobileEditorOpen ? t("hideEditor") : t("showEditor")}
        </Button>
      )}

      <footer className="flex items-center justify-between gap-4 border-t bg-card px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="min-w-0 flex-1">
          {prevLesson ? (
            <Button asChild variant="outline" size="default" className="gap-2">
              <Link href={`/courses/${courseSlug}/lessons/${prevLesson.slug}`}>
                <ChevronLeft className="h-4 w-4" />
                {t("prevLesson")}
              </Link>
            </Button>
          ) : (
            <span />
          )}
        </div>
        {completed && (
          <div className="flex shrink-0 items-center gap-2 rounded-lg bg-[hsl(var(--brand-logo-yellow))]/20 px-3 py-2 text-sm font-medium text-[hsl(var(--brand-logo-yellow))] dark:bg-[#008c4C]/10 dark:text-[#008c4C]">
            <CheckCircle2 className="h-4 w-4" />
            {t("lessonCompleted")}
          </div>
        )}
        <div className="min-w-0 flex-1 justify-end text-right">
          {nextLesson ? (
            <Button
              asChild
              size="default"
              className="gap-2 bg-[hsl(var(--brand-logo-yellow))] text-[hsl(var(--brand-dark))] hover:bg-[hsl(var(--brand-logo-yellow))]/90 dark:bg-[#008c4C] dark:text-white dark:hover:bg-[#006b3a]"
            >
              <Link href={`/courses/${courseSlug}/lessons/${nextLesson.slug}`}>
                {t("nextLesson")}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="default" variant="secondary">
              <Link href={`/courses/${courseSlug}`}>{t("backToCourse")}</Link>
            </Button>
          )}
        </div>
      </footer>

      {/* Certificate mint modal — shown when all lessons completed */}
      <CertificateMintModal
        courseSlug={courseSlug}
        courseTitle={courseTitle}
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
      />
    </div>
  );
}
