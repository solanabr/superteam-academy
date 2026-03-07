"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Keypair } from "@solana/web3.js";
import { toast } from "sonner";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { PremiumEmptyState } from "@/components/ui/premium-empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { AchievementToastContainer } from "@/components/achievements";
import { LessonChallenge, LessonHeader, LessonNavigation, LessonSidebar } from "@/components/lessons";
import { QuizBlock } from "@/components/courses/QuizBlock";
import { TerminalBlock } from "@/components/courses/TerminalBlock";
import { AccountExplorer } from "@/components/courses/explorers/AccountExplorer";
import { PDADerivationExplorer } from "@/components/courses/explorers/PDADerivationExplorer";
import { useProgress } from "@/lib/hooks/use-progress";
import {
  enrollWithOnchainTransaction,
  getEnrollmentErrorDescription,
} from "@/lib/progress/client-enrollment";
import { resolveClientCourseId } from "@/lib/progress/client-course-id-overrides";
import {
  clearSolanaFundamentalsState,
  createDefaultSolanaFundamentalsState,
  loadSolanaFundamentalsState,
  saveSolanaFundamentalsState,
  type SolanaFundamentalsLocalState,
  type SolanaTransferSummary,
} from "@/lib/courses/solana-fundamentals/local-state";
import { trackEvent } from "@/components/analytics/GoogleAnalytics";
import type { CompletionResult } from "@/types/progress";
import type { Challenge, LessonBlock, Module } from "@/types/content";
import { CheckCircle2, Loader2, Star, Trophy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface LessonApiResponse {
  lesson: {
    id: string;
    title: string;
    slug: string;
    type: "content" | "challenge";
    content: string;
    blocks?: LessonBlock[];
    xpReward: number;
    challenge?: Challenge;
  };
  courseSlug: string;
  courseOnChainId: string | null;
  courseTitle: string;
  modules: Module[];
  prevLessonId: string | null;
  nextLessonId: string | null;
}

function XPTOast({
  result,
  onDismiss,
  labels,
}: {
  result: CompletionResult;
  onDismiss: () => void;
  labels: {
    xpEarned: string;
    firstCompletionBonus: string;
    levelUp: (level: number) => string;
  };
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="rounded-xl border border-border/70 bg-card/95 p-4 text-foreground shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Star className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{labels.xpEarned}</p>
            {result.isFirstOfDay && (
              <p className="text-sm text-muted-foreground">{labels.firstCompletionBonus}</p>
            )}
            {result.leveledUp && (
              <div className="mt-2 flex items-center gap-2 rounded-md border border-border/70 bg-muted/30 px-3 py-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {labels.levelUp(result.newLevel ?? 0)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseCompleteBanner({
  totalXP,
  onBackToCourse,
  labels,
}: {
  totalXP: number;
  onBackToCourse: () => void;
  labels: {
    title: string;
    description: string;
    totalXpLabel: string;
    backToCourse: string;
  };
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/95 p-6 text-center shadow-sm">
      <div className="mb-4 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
      </div>
      <h2 className="mb-2 text-2xl font-bold text-foreground">{labels.title}</h2>
      <p className="mb-4 text-muted-foreground">{labels.description}</p>
      <div className="mb-4 flex justify-center gap-4">
        <div className="rounded-xl border border-border/70 bg-muted/40 px-4 py-2">
          <p className="text-sm text-muted-foreground">{labels.totalXpLabel}</p>
          <p className="text-xl font-bold text-foreground">{totalXP}</p>
        </div>
      </div>
      <Button onClick={onBackToCourse} variant="solana">
        {labels.backToCourse}
      </Button>
    </div>
  );
}

function renderLessonBlocks(blocks: LessonBlock[] | undefined): ReactNode {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-4">
      {blocks.map((block, index) => {
        const label =
          block.type === "quiz"
            ? "Quiz"
            : block.type === "terminal"
              ? "Terminal"
              : "Explorer";

        return (
          <details
            key={block.id}
            className="rounded-xl border border-border/70 bg-card/80 p-4 text-foreground shadow-sm"
            open={index === 0}
          >
            <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
              <span className="mr-2 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                {label}
              </span>
              {block.title}
            </summary>
            <div className="mt-4">
              {block.type === "quiz" && <QuizBlock block={block} />}
              {block.type === "terminal" && <TerminalBlock block={block} />}
              {block.type === "explorer" && block.explorer === "AccountExplorer" && (
                <AccountExplorer title={block.title} samples={block.props.samples} />
              )}
              {block.type === "explorer" && block.explorer === "PDADerivationExplorer" && (
                <PDADerivationExplorer
                  title={block.title}
                  programId={block.props.programId}
                  seeds={block.props.seeds}
                />
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}

interface LessonPageClientProps {
  slug: string;
  initialData: LessonApiResponse;
}

export function LessonPageClient({ slug, initialData }: LessonPageClientProps) {
  const t = useTranslations("lesson");
  const tc = useTranslations("common");
  const router = useRouter();
  const { data: session } = useSession();
  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const isAuthenticated = !!session?.user;
  const userScope = session?.user?.email ?? session?.user?.name ?? "guest";

  const [lessonData] = useState<LessonApiResponse>(initialData);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [showCourseComplete, setShowCourseComplete] = useState(false);
  const [localState, setLocalState] = useState<SolanaFundamentalsLocalState>(
    createDefaultSolanaFundamentalsState
  );

  const { progress, refresh: refreshProgress, isLoading: isProgressLoading } = useProgress(slug);
  const { lesson, courseSlug, courseOnChainId, courseTitle, modules } = lessonData;
  const isSolanaFundamentals = courseSlug === "solana-fundamentals";
  const lessonHref = `/courses/${courseSlug}/lessons/${lessonData.lesson.id}`;
  const signInHref = `/auth/signin?callbackUrl=${encodeURIComponent(lessonHref)}`;

  const allLessons = useMemo(
    () =>
      modules.flatMap((module, moduleIndex) =>
        module.lessons.map((moduleLesson, lessonIndex) => ({
          module,
          moduleIndex,
          lesson: moduleLesson,
          lessonIndex,
        }))
      ),
    [modules]
  );
  const currentLessonIndex = allLessons.findIndex((item) => item.lesson.id === lesson.id);
  const currentLessonMeta = currentLessonIndex >= 0 ? allLessons[currentLessonIndex] : null;
  const prevLessonMeta = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLessonMeta =
    currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;

  const completedLessons = useMemo(() => {
    const merged = new Set<string>(progress?.completedLessons ?? []);
    if (isSolanaFundamentals) {
      for (const lessonId of localState.completedLessonIds) {
        merged.add(lessonId);
      }
    }
    return Array.from(merged);
  }, [isSolanaFundamentals, localState.completedLessonIds, progress?.completedLessons]);

  const completedCount = completedLessons.length;
  const totalLessons = allLessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isLessonCompleted = completedLessons.includes(lesson.id);
  const isChallenge = lesson.type === "challenge" && lesson.challenge;

  const persistLocalState = useCallback(
    (next: SolanaFundamentalsLocalState) => {
      setLocalState(next);
      try {
        saveSolanaFundamentalsState(userScope, next);
      } catch {
        // best-effort local persistence
      }
    },
    [userScope]
  );

  const markLessonCompletedLocally = useCallback(
    (lessonId: string) => {
      if (!isSolanaFundamentals) {
        return;
      }
      const nextCompleted = new Set(localState.completedLessonIds);
      nextCompleted.add(lessonId);
      persistLocalState({
        ...localState,
        completedLessonIds: Array.from(nextCompleted),
      });
    },
    [isSolanaFundamentals, localState, persistLocalState]
  );

  const handleProjectStateUpdate = useCallback(
    (nextProject: { walletAddress?: string; transferSummary?: SolanaTransferSummary }) => {
      if (!isSolanaFundamentals) {
        return;
      }
      const nextWallet =
        nextProject.walletAddress && !localState.walletKeypair
          ? {
              publicKey: nextProject.walletAddress,
              secretKey: [],
            }
          : localState.walletKeypair;

      persistLocalState({
        ...localState,
        walletKeypair: nextWallet,
        lastTransferSummary: nextProject.transferSummary ?? localState.lastTransferSummary,
      });
    },
    [isSolanaFundamentals, localState, persistLocalState]
  );

  const handleWalletEnrollment = useCallback(async () => {
    if (!isAuthenticated) {
      router.push(signInHref);
      return;
    }

    if (!connected || !publicKey) {
      setWalletModalVisible(true);
      return;
    }

    const courseId = resolveClientCourseId(courseSlug, courseOnChainId ?? courseSlug);
    if (!courseId) {
      toast.error("Course enrollment unavailable", {
        description: "This course is not provisioned for devnet enrollment yet.",
      });
      return;
    }

    setIsEnrolling(true);
    try {
      await enrollWithOnchainTransaction({
        courseId,
        courseSlug,
        connection,
        learner: publicKey,
        sendTransaction,
      });
      refreshProgress();
    } catch (error) {
      console.error(error);
      toast.error("Course enrollment failed", {
        description: getEnrollmentErrorDescription(error),
      });
    } finally {
      setIsEnrolling(false);
    }
  }, [
    connected,
    connection,
    courseOnChainId,
    courseSlug,
    isAuthenticated,
    publicKey,
    refreshProgress,
    router,
    sendTransaction,
    signInHref,
    setWalletModalVisible,
  ]);

  useEffect(() => {
    if (!isSolanaFundamentals) {
      return;
    }
    try {
      setLocalState(loadSolanaFundamentalsState(userScope));
    } catch {
      setLocalState(createDefaultSolanaFundamentalsState());
    }
  }, [isSolanaFundamentals, userScope]);

  useEffect(() => {
    if (!isSolanaFundamentals || localState.walletKeypair) {
      return;
    }
    const generated = Keypair.generate();
    persistLocalState({
      ...localState,
      walletKeypair: {
        publicKey: generated.publicKey.toBase58(),
        secretKey: Array.from(generated.secretKey),
      },
    });
  }, [isSolanaFundamentals, localState, persistLocalState]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }
      const tag = target.tagName.toLowerCase();
      if (target.isContentEditable || tag === "input" || tag === "textarea" || tag === "select") {
        return;
      }
      if (event.key === "n" && nextLessonMeta) {
        event.preventDefault();
        router.push(`/courses/${courseSlug}/lessons/${nextLessonMeta.lesson.id}`);
      } else if (event.key === "p" && prevLessonMeta) {
        event.preventDefault();
        router.push(`/courses/${courseSlug}/lessons/${prevLessonMeta.lesson.id}`);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [courseSlug, nextLessonMeta, prevLessonMeta, router]);

  const completeLesson = useCallback(async () => {
    if (!isAuthenticated) {
      markLessonCompletedLocally(lesson.id);
      return;
    }

    setIsCompleting(true);
    try {
      const response = await fetch("/api/progress/complete-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: lessonData.courseSlug,
          lessonId: lessonData.lesson.id,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as CompletionResult;
        setCompletionResult(data);
        trackEvent("complete_lesson", "lessons", lessonData.lesson.id, data.xpAwarded);
        markLessonCompletedLocally(lesson.id);

        if (data.xpAwarded > 0) {
          setShowToast(true);
        }

        if (data.isCourseComplete) {
          setShowCourseComplete(true);
        }

        refreshProgress();
      } else {
        toast.error("Could not mark lesson as complete", {
          description: "Please retry in a moment.",
        });
      }
    } catch (err) {
      console.error("Failed to complete lesson:", err);
      toast.error("Could not mark lesson as complete", {
        description: "Please retry in a moment.",
      });
    } finally {
      setIsCompleting(false);
    }
  }, [isAuthenticated, lesson.id, lessonData, markLessonCompletedLocally, refreshProgress]);

  const handleChallengeComplete = useCallback(
    (result: CompletionResult | null) => {
      markLessonCompletedLocally(lesson.id);
      if (!result) {
        return;
      }
      setCompletionResult(result);
      trackEvent("complete_lesson", "lessons", lessonData.lesson.id, result.xpAwarded);

      if (result.xpAwarded > 0) {
        setShowToast(true);
      }

      if (result.isCourseComplete) {
        setShowCourseComplete(true);
      }

      refreshProgress();
    },
    [lesson.id, lessonData.lesson.id, markLessonCompletedLocally, refreshProgress]
  );

  const dismissToast = useCallback(() => {
    setShowToast(false);
  }, []);

  const dismissAchievementToast = useCallback((achievementId: string) => {
    setCompletionResult((prev) => {
      if (!prev?.newAchievements) return prev;
      return {
        ...prev,
        newAchievements: prev.newAchievements.filter((a) => a !== achievementId),
      };
    });
  }, []);

  const clearLocalProjectState = useCallback(() => {
    if (!isSolanaFundamentals) {
      return;
    }
    clearSolanaFundamentalsState(userScope);
    setLocalState(createDefaultSolanaFundamentalsState());
  }, [isSolanaFundamentals, userScope]);

  if (!lessonData) {
    return (
      <PageShell>
        <div className="flex min-h-[20rem] items-center justify-center rounded-[1.5rem] border border-border/70 bg-card/80">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const connectWalletToEnroll = tc("connectWallet");
  const signEnrollmentTransaction = "Sign enrollment transaction";
  const walletRequiredToStart = isAuthenticated
    ? "Connect a wallet and sign enrollment before starting this course."
    : "Sign in, connect a wallet, and sign enrollment before starting this course.";
  const showEnrollmentGate = !isProgressLoading && !progress;
  const showLessonContent = !isProgressLoading && !!progress;

  return (
    <PageShell
      className="min-h-[calc(100vh-5rem)]"
      hero={
        <LessonHeader
          courseTitle={courseTitle}
          title={lesson.title}
          progressLabel={t("lessonProgress", {
            current: currentLessonIndex + 1,
            total: totalLessons,
          })}
          progressValue={progressPercent}
          meta={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-border/70 bg-background/80 text-foreground">
                {lesson.xpReward} {tc("xp")}
              </Badge>
              {currentLessonMeta ? (
                <Badge variant="outline" className="border-border/70 bg-muted/35 text-muted-foreground">
                  {currentLessonMeta.module.title}
                </Badge>
              ) : null}
            </div>
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {!isAuthenticated ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={signInHref}>{t("signInToTrack")}</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" size="sm">
                <Link href={`/courses/${courseSlug}`}>{t("backToCourse")}</Link>
              </Button>
            </div>
          }
        />
      }
      contentClassName="space-y-4"
    >
      {showToast && completionResult && (
        <XPTOast
          result={completionResult}
          onDismiss={dismissToast}
          labels={{
            xpEarned: t("xpEarned", { xp: completionResult.xpAwarded }),
            firstCompletionBonus: t("firstCompletionBonus"),
            levelUp: (level) => t("levelUp", { level }),
          }}
        />
      )}

      {completionResult?.newAchievements && completionResult.newAchievements.length > 0 && (
        <AchievementToastContainer
          achievementIds={completionResult.newAchievements}
          onDismiss={dismissAchievementToast}
        />
      )}

      {showCourseComplete ? (
        <CourseCompleteBanner
          totalXP={completionResult?.totalXP ?? 0}
          onBackToCourse={() => router.push(`/courses/${courseSlug}`)}
          labels={{
            title: t("courseCompleteTitle"),
            description: t("courseCompleteDescription"),
            totalXpLabel: t("courseCompleteTotalXp"),
            backToCourse: t("backToCourse"),
          }}
        />
      ) : null}

      <LessonNavigation
        courseSlug={courseSlug}
        currentLessonId={lesson.id}
        modules={modules}
        completedLessons={completedLessons}
      />

      {isProgressLoading ? (
        <SectionCard className="rounded-[1.5rem]" contentClassName="flex items-center gap-3 p-6 md:p-7">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Checking wallet enrollment status...</p>
        </SectionCard>
      ) : null}

      {showEnrollmentGate ? (
        <SectionCard className="rounded-[1.5rem]" contentClassName="space-y-4 p-6 md:p-7">
          <div className="space-y-2">
            <p className="text-base font-semibold text-foreground">{signEnrollmentTransaction}</p>
            <p className="text-sm text-muted-foreground">{walletRequiredToStart}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {!isAuthenticated ? (
              <Button asChild>
                <Link href={signInHref}>{t("signInToTrack")}</Link>
              </Button>
            ) : null}
            <Button onClick={handleWalletEnrollment} disabled={isEnrolling} className="gap-2">
              {isEnrolling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {signEnrollmentTransaction}
                </>
              ) : !connected ? (
                connectWalletToEnroll
              ) : (
                signEnrollmentTransaction
              )}
            </Button>
            <Button asChild variant="outline">
              <Link href={`/courses/${courseSlug}`}>{t("backToCourse")}</Link>
            </Button>
          </div>
        </SectionCard>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          {showLessonContent && isChallenge ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <SectionCard className="rounded-[1.5rem]" contentClassName="space-y-6 p-6 md:p-7">
                <div className="lesson-prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content}</ReactMarkdown>
                </div>
                {renderLessonBlocks(lesson.blocks)}
              </SectionCard>
              <div className="lesson-code-panel overflow-hidden p-1">
                <LessonChallenge
                  challenge={lesson.challenge!}
                  courseSlug={courseSlug}
                  lessonId={lesson.id}
                  isAuthenticated={isAuthenticated}
                  isCompleted={isLessonCompleted}
                  onComplete={handleChallengeComplete}
                  onProjectStateUpdate={handleProjectStateUpdate}
                />
              </div>
            </div>
          ) : showLessonContent ? (
            <SectionCard className="rounded-[1.5rem]" contentClassName="space-y-8 p-6 md:p-8">
              <div className="lesson-prose mx-auto max-w-3xl">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content}</ReactMarkdown>
              </div>
              {renderLessonBlocks(lesson.blocks)}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-6">
                {isLessonCompleted ? (
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/30 px-4 py-2 text-foreground">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">{tc("completed")}</span>
                  </div>
                ) : (
                  <Button onClick={completeLesson} disabled={isCompleting} className="gap-2">
                    {isCompleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("markingComplete")}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        {isAuthenticated ? t("markComplete") : t("markCompleteLocal")}
                      </>
                    )}
                  </Button>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {!isAuthenticated ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={signInHref}>{t("signInToTrack")}</Link>
                    </Button>
                  ) : null}
                  <Badge variant="outline" className="border-border/70 bg-muted/25 text-muted-foreground">
                    {t("shortcutsNextPrev")}
                  </Badge>
                </div>
              </div>
            </SectionCard>
          ) : null}
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <LessonSidebar
            courseSlug={courseSlug}
            modules={modules}
            currentLessonId={lesson.id}
            completedLessons={completedLessons}
            courseTitle={courseTitle}
          />

          {isSolanaFundamentals ? (
            <SectionCard
              title={t("projectStatus")}
              className="rounded-[1.5rem]"
              contentClassName="space-y-4 text-sm"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("walletAddress")}</p>
                <p className="mt-1 break-all rounded-2xl border border-border/70 bg-muted/20 px-3 py-2 font-mono text-xs text-foreground">
                  {localState.walletKeypair?.publicKey ?? tc("inactive")}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("lastTransferSummary")}</p>
                {localState.lastTransferSummary ? (
                  <dl className="mt-2 space-y-2 text-xs">
                    <div className="rounded-2xl border border-border/70 bg-muted/20 px-3 py-2">
                      <dt className="text-muted-foreground">From</dt>
                      <dd className="mt-1 break-all font-mono text-foreground">{localState.lastTransferSummary.from}</dd>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 px-3 py-2">
                      <dt className="text-muted-foreground">To</dt>
                      <dd className="mt-1 break-all font-mono text-foreground">{localState.lastTransferSummary.to}</dd>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 px-3 py-2">
                      <dt className="text-muted-foreground">Lamports</dt>
                      <dd className="mt-1 font-mono text-foreground">{localState.lastTransferSummary.lamports}</dd>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 px-3 py-2">
                      <dt className="text-muted-foreground">Blockhash</dt>
                      <dd className="mt-1 break-all font-mono text-foreground">
                        {localState.lastTransferSummary.recentBlockhash}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <PremiumEmptyState
                    icon={Trophy}
                    title={t("projectStatus")}
                    description={t("runLessonTransferSummary")}
                    className="shadow-none"
                  />
                )}
              </div>
              <Button variant="outline" size="sm" onClick={clearLocalProjectState} className="w-full">
                {t("clearLocalProgress")}
              </Button>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}

export default LessonPageClient;
