"use client";

import { use, useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/layout";
import { CodeEditor } from "@/components/lesson";
import { LessonQuiz } from "@/components/lesson/quiz";
import { YouTubeEmbed } from "@/components/lesson/youtube-embed";
import { ProtectedRoute } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourse, useProgress, useComments } from "@/hooks/use-services";
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
  WifiOff,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/components/providers/analytics-provider";
import { CommentSection } from "@/components/comments/comment-section";
import { useOnlineStatus } from "@/hooks/use-offline";

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
  const {
    comments,
    loading: commentsLoading,
    postComment,
    deleteComment,
    markHelpful,
  } = useComments(course?.courseId ?? "", lessonIndex);
  const isOnline = useOnlineStatus();
  const router = useRouter();
  const [completing, setCompleting] = useState(false);

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
  const isQuizLesson = lessonInfo?.lesson.type === "quiz" && !!lessonInfo.lesson.quiz;
  const isVideoLesson = lessonInfo?.lesson.type === "video" && !!lessonInfo.lesson.videoUrl;

  const handleComplete = useCallback(async () => {
    if (!lessonInfo || isComplete || completing) return;
    setCompleting(true);
    try {
      const result = await completeLesson(lessonIndex, lessonInfo.lesson.xp);
      if (result) {
        trackEvent("lesson_completed", { slug, lessonIndex, xp: lessonInfo.lesson.xp });
        toast.success(`+${lessonInfo.lesson.xp} XP earned!`);
      }
    } catch {
      toast.error("Failed to save progress. Please try again.");
    } finally {
      setCompleting(false);
    }
  }, [lessonInfo, lessonIndex, isComplete, completing, completeLesson, slug]);

  // Next: complete lesson (if not already) then navigate
  const handleNext = useCallback(async () => {
    if (!lessonInfo) return;
    if (!isComplete && !isQuizLesson) {
      setCompleting(true);
      try {
        const result = await completeLesson(lessonIndex, lessonInfo.lesson.xp);
        if (result) {
          trackEvent("lesson_completed", { slug, lessonIndex, xp: lessonInfo.lesson.xp });
          toast.success(`+${lessonInfo.lesson.xp} XP earned!`);
        }
      } catch {
        toast.error("Failed to save progress. Please try again.");
        setCompleting(false);
        return;
      }
      setCompleting(false);
    }
    if (hasNext) {
      router.push(`/courses/${slug}/lessons/${lessonIndex + 1}`);
    } else {
      router.push(`/courses/${slug}`);
    }
  }, [lessonInfo, isComplete, isQuizLesson, hasNext, completeLesson, lessonIndex, slug, router]);

  // Auto-complete content lessons when user scrolls to bottom
  const contentEndRef = useRef<HTMLDivElement>(null);
  const autoCompleted = useRef(false);

  useEffect(() => {
    autoCompleted.current = false;
  }, [lessonIndex]);

  useEffect(() => {
    const sentinel = contentEndRef.current;
    if (!sentinel || isComplete || isQuizLesson || lessonInfo?.lesson.type === "challenge") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !autoCompleted.current) {
          autoCompleted.current = true;
          handleComplete();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isComplete, isQuizLesson, lessonInfo, handleComplete]);

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
      <PlatformLayout>
        <div className="flex flex-col">
          {/* Top bar */}
          <div className="sticky top-16 z-40 border-b bg-background/80 backdrop-blur-sm">
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

          {/* Offline banner */}
          {!isOnline && (
            <div className="flex items-center justify-center gap-2 bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-500">
              <WifiOff className="h-3.5 w-3.5" />
              <span>Offline mode — reading cached content. Progress will sync when you reconnect.</span>
            </div>
          )}

          {/* Content */}
          <div className="flex-1">
            {lesson.type === "challenge" && lesson.challenge ? (
              /* Challenge: Resizable split — content left, editor right */
              <ResizablePanelGroup orientation="horizontal" className="h-[calc(100vh-10rem)]">
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
                          courseSlug={slug}
                          lessonId={lesson.id}
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
                        courseSlug={slug}
                        lessonId={lesson.id}
                        onSubmit={handleChallengeSubmit}
                      />
                    </div>
                  </ResizablePanel>
                )}
              </ResizablePanelGroup>
            ) : (
              /* Content / Quiz lesson */
              <div className="container mx-auto max-w-3xl px-4 py-8">
                  {/* Video embed for video lessons */}
                  {isVideoLesson && (
                    <div className="mb-8">
                      <YouTubeEmbed
                        url={lesson.videoUrl!}
                        title={lesson.title}
                      />
                    </div>
                  )}

                  {/* Lesson content */}
                  <article className="prose prose-neutral dark:prose-invert max-w-none">
                    {lesson.content ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: lesson.content }}
                      />
                    ) : !isQuizLesson && !isVideoLesson ? (
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
                  {!isQuizLesson && <div ref={contentEndRef} className="h-4" />}

                  {/* Completion status */}
                  {isComplete && !isQuizLesson && (
                    <div className="mt-8 text-center">
                      <div className="inline-flex items-center gap-2 text-sm text-emerald-500 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Lesson completed — +{lesson.xp} XP
                      </div>
                    </div>
                  )}

                  {/* Quiz completion status */}
                  {isQuizLesson && isComplete && (
                    <div className="mt-8 text-center">
                      <div className="inline-flex items-center gap-2 text-sm text-emerald-500 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Quiz passed!
                      </div>
                    </div>
                  )}

                  {/* Discussion section */}
                  <CommentSection
                    courseId={course.courseId}
                    lessonIndex={lessonIndex}
                    comments={comments}
                    loading={commentsLoading}
                    onPost={postComment}
                    onDelete={deleteComment}
                    onMarkHelpful={markHelpful}
                  />
              </div>
            )}
          </div>

          {/* Bottom nav */}
          <div className="sticky bottom-0 z-40 border-t bg-background/80 backdrop-blur-sm">
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
                  isComplete ? (
                    <Button asChild size="sm" className="gap-1.5">
                      <Link href={`/courses/${slug}/lessons/${lessonIndex + 1}`}>
                        {t("next")}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ) : isQuizLesson ? (
                    <Button size="sm" className="gap-1.5" disabled>
                      {t("next")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={handleNext}
                      disabled={completing}
                    >
                      {completing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      {t("next")}
                      {!completing && <ArrowRight className="h-3.5 w-3.5" />}
                    </Button>
                  )
                ) : isComplete ? (
                  <Button asChild size="sm" className="gap-1.5">
                    <Link href={`/courses/${slug}`}>
                      {t("backToCourse")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ) : isQuizLesson ? (
                  <Button size="sm" className="gap-1.5" disabled>
                    {t("backToCourse")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={handleNext}
                    disabled={completing}
                  >
                    {completing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    {t("backToCourse")}
                    {!completing && <ArrowRight className="h-3.5 w-3.5" />}
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
