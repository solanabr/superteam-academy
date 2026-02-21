"use client";

import { use, useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PlatformLayout } from "@/components/layout";
import { CodeEditor } from "@/components/lesson";
import { LessonQuiz } from "@/components/lesson/quiz";
import { ProtectedRoute } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourse, useProgress } from "@/hooks/use-services";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Zap,
  Coins,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/components/providers/analytics-provider";

export default function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = use(params);
  const lessonIndex = Number(id);
  const t = useTranslations("lesson");
  const { course, loading: courseLoading } = useCourse(slug);
  const { progress, completeLesson } = useProgress(course?.courseId ?? "");
  const { user } = useAuth();
  const { publicKey: walletKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [claimingXP, setClaimingXP] = useState(false);
  const [xpClaimed, setXpClaimed] = useState(false);

  // Find the lesson
  const lessonInfo = useMemo(() => {
    if (!course) return null;

    let idx = 0;
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        if (idx === lessonIndex) {
          return { lesson, module: mod, globalIndex: idx, totalLessons: course.lessonCount };
        }
        idx++;
      }
    }
    return null;
  }, [course, lessonIndex]);

  const isComplete = progress?.completedLessons.includes(lessonIndex) ?? false;
  const hasPrev = lessonIndex > 0;
  const hasNext = lessonInfo ? lessonIndex < lessonInfo.totalLessons - 1 : false;
  const isLastLesson = lessonInfo ? lessonIndex === lessonInfo.totalLessons - 1 : false;
  const isQuizLesson = lessonInfo?.lesson.type === "quiz" && !!lessonInfo.lesson.quiz;

  const handleComplete = useCallback(async () => {
    if (!lessonInfo || isComplete) return;
    await completeLesson(lessonIndex, lessonInfo.lesson.xp);
    trackEvent("lesson_completed", { slug, lessonIndex, xp: lessonInfo.lesson.xp });
    toast.success(`+${lessonInfo.lesson.xp} XP earned!`);
  }, [lessonInfo, lessonIndex, isComplete, completeLesson, slug]);

  // Auto-complete content lessons when user scrolls to bottom
  const contentEndRef = useRef<HTMLDivElement>(null);
  const autoCompleted = useRef(false);

  useEffect(() => {
    autoCompleted.current = false;
  }, [lessonIndex]);

  useEffect(() => {
    if (!contentEndRef.current || isComplete || isQuizLesson || lessonInfo?.lesson.type === "challenge") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !autoCompleted.current) {
          autoCompleted.current = true;
          handleComplete();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(contentEndRef.current);
    return () => observer.disconnect();
  }, [isComplete, isQuizLesson, lessonInfo, handleComplete]);

  // Calculate total course XP for quiz claim
  const totalCourseXP = useMemo(() => {
    if (!course) return 0;
    let total = 0;
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        total += lesson.xp;
      }
    }
    return total;
  }, [course]);

  const handleClaimXP = useCallback(async () => {
    if (!course || !user || !walletKey || !signTransaction || !lessonInfo) return;
    setClaimingXP(true);
    try {
      // Step 1: Get partially-signed txs from backend
      const allLessonIndices: number[] = [];
      for (let i = 0; i < lessonInfo.totalLessons; i++) {
        allLessonIndices.push(i);
      }

      const res = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.courseId,
          lessonIndices: allLessonIndices,
          learnerWallet: walletKey.toBase58(),
          userId: user.id,
        }),
      });
      const data = await res.json();

      if (data.alreadyCompleted) {
        setXpClaimed(true);
        toast.info("All XP already claimed on-chain");
        return;
      }

      if (!res.ok || !data.transactions?.length) {
        toast.error(data.error || "Failed to claim XP. Please try again.");
        return;
      }

      // Step 2: Sign each tx with wallet and send
      const signatures: string[] = [];
      for (const txBase64 of data.transactions) {
        const tx = VersionedTransaction.deserialize(
          Buffer.from(txBase64, "base64"),
        );
        const signedTx = await signTransaction(tx);
        const sig = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });
        await connection.confirmTransaction(sig, "confirmed");
        signatures.push(sig);
      }

      // Step 3: Confirm to backend (streak update)
      await fetch("/api/lessons/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.courseId,
          learnerWallet: walletKey.toBase58(),
          userId: user.id,
          action: "confirm",
        }),
      });

      setXpClaimed(true);

      const lastSig = signatures[signatures.length - 1] ?? "";
      trackEvent("course_xp_claimed_onchain", {
        slug,
        totalLessons: allLessonIndices.length,
        claimed: data.pendingCount,
        totalXP: totalCourseXP,
      });
      toast.success(
        <div className="flex items-center gap-2">
          <span>{totalCourseXP} XP minted on-chain!</span>
          {lastSig && (
            <a
              href={`https://explorer.solana.com/tx/${lastSig}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline inline-flex items-center gap-1"
            >
              View <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("User rejected")) {
        toast.info("Transaction cancelled");
        return;
      }
      toast.error(`Failed to claim XP: ${msg}`);
    } finally {
      setClaimingXP(false);
    }
  }, [course, user, walletKey, signTransaction, connection, lessonInfo, slug, totalCourseXP]);

  const handleChallengeSubmit = useCallback(
    async (passed: boolean) => {
      if (passed && !isComplete) {
        await handleComplete();
      }
    },
    [isComplete, handleComplete],
  );

  if (courseLoading) {
    return (
      <PlatformLayout hideFooter>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </PlatformLayout>
    );
  }

  if (!course || !lessonInfo) {
    return (
      <PlatformLayout hideFooter>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <BookOpen className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Lesson not found</p>
          <Button asChild variant="outline">
            <Link href={`/courses/${slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Link>
          </Button>
        </div>
      </PlatformLayout>
    );
  }

  const { lesson, module: mod } = lessonInfo;
  const completionPct = progress
    ? (progress.completedLessons.length / progress.totalLessons) * 100
    : 0;

  return (
    <ProtectedRoute>
      <PlatformLayout hideFooter>
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          {/* Top bar */}
          <div className="border-b bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  href={`/courses/${slug}`}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {course.title} &rsaquo; {mod.title}
                  </p>
                  <p className="text-sm font-medium truncate">{lesson.title}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {/* Progress */}
                <div className="hidden sm:flex items-center gap-2 w-32">
                  <Progress value={completionPct} className="h-1.5" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {Math.round(completionPct)}%
                  </span>
                </div>

                {/* XP badge */}
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Zap className="h-3 w-3" />
                  {lesson.xp} XP
                </Badge>

                {/* Status */}
                {isComplete && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {lesson.type === "challenge" && lesson.challenge ? (
              /* Challenge: Resizable split — content left, editor right */
              <ResizablePanelGroup orientation="horizontal" className="h-full">
                {lesson.content ? (
                  <>
                    <ResizablePanel defaultSize={40} minSize={25}>
                      <div className="h-full overflow-y-auto">
                        <div className="p-6">
                          <article className="prose prose-neutral dark:prose-invert prose-sm max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                          </article>
                        </div>
                      </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={60} minSize={30}>
                      <div className="h-full p-4">
                        <CodeEditor
                          challenge={lesson.challenge}
                          onSubmit={handleChallengeSubmit}
                        />
                      </div>
                    </ResizablePanel>
                  </>
                ) : (
                  <ResizablePanel defaultSize={100}>
                    <div className="h-full p-4">
                      <CodeEditor
                        challenge={lesson.challenge}
                        onSubmit={handleChallengeSubmit}
                      />
                    </div>
                  </ResizablePanel>
                )}
              </ResizablePanelGroup>
            ) : (
              /* Content / Quiz lesson */
              <div className="h-full overflow-y-auto">
                <div className="container mx-auto max-w-3xl px-4 py-8">
                  {/* Lesson content */}
                  <article className="prose prose-neutral dark:prose-invert max-w-none">
                    {lesson.content ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: lesson.content }}
                      />
                    ) : !isQuizLesson ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>Lesson content is loading from CMS...</p>
                      </div>
                    ) : null}
                  </article>

                  {/* Quiz section (for quiz-type lessons) */}
                  {isQuizLesson && lessonInfo.lesson.quiz && (
                    <div className="mt-8">
                      <LessonQuiz
                        quiz={lessonInfo.lesson.quiz}
                        onPass={handleComplete}
                      />
                    </div>
                  )}

                  {/* Auto-complete sentinel for content lessons */}
                  {!isQuizLesson && <div ref={contentEndRef} className="h-1" />}

                  {/* Completion status */}
                  {isComplete && !isQuizLesson && (
                    <div className="mt-8 text-center">
                      <div className="inline-flex items-center gap-2 text-sm text-emerald-500 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Lesson completed
                      </div>
                    </div>
                  )}

                  {/* Claim XP — only on quiz lessons */}
                  {isQuizLesson && (
                    <div className="mt-8 text-center space-y-3">
                      {isComplete && (
                        <div className="inline-flex items-center gap-2 text-sm text-emerald-500 font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          Quiz passed!
                        </div>
                      )}

                      {isComplete && walletKey && !xpClaimed && (
                        <div>
                          <Button
                            onClick={handleClaimXP}
                            disabled={claimingXP}
                            variant="outline"
                            className="h-11 px-8 gap-2 border-primary/50 hover:bg-primary/10"
                          >
                            {claimingXP ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Coins className="h-4 w-4" />
                            )}
                            {claimingXP ? "Minting XP..." : `Claim ${totalCourseXP} XP On-Chain`}
                          </Button>
                        </div>
                      )}

                      {xpClaimed && (
                        <div className="inline-flex items-center gap-2 text-sm text-emerald-500 font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          XP claimed on-chain
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom nav */}
          <div className="border-t bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto flex items-center justify-between px-4 py-3">
              <div>
                {hasPrev ? (
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link href={`/courses/${slug}/lessons/${lessonIndex - 1}`}>
                      <ArrowLeft className="h-3.5 w-3.5" />
                      {t("previous")}
                    </Link>
                  </Button>
                ) : (
                  <div />
                )}
              </div>

              <span className="text-xs text-muted-foreground">
                {lessonIndex + 1} / {lessonInfo.totalLessons}
              </span>

              <div>
                {hasNext ? (
                  <Button asChild size="sm" className="gap-1.5">
                    <Link href={`/courses/${slug}/lessons/${lessonIndex + 1}`}>
                      {t("next")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="sm" className="gap-1.5">
                    <Link href={`/courses/${slug}`}>
                      Back to Course
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </PlatformLayout>
    </ProtectedRoute>
  );
}
