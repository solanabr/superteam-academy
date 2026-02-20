"use client";

import { use, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PlatformLayout } from "@/components/layout";
import { CodeEditor } from "@/components/lesson";
import { ProtectedRoute } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourse, useProgress } from "@/hooks/use-services";
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

  const handleComplete = useCallback(async () => {
    if (!lessonInfo || isComplete) return;
    await completeLesson(lessonIndex, lessonInfo.lesson.xp);
    trackEvent("lesson_completed", { slug, lessonIndex, xp: lessonInfo.lesson.xp });
    toast.success(`+${lessonInfo.lesson.xp} XP earned!`);
  }, [lessonInfo, lessonIndex, isComplete, completeLesson, slug]);

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
              /* Content lesson: Text + optional code */
              <div className="h-full overflow-y-auto">
                <div className="container mx-auto max-w-3xl px-4 py-8">
                  <article className="prose prose-neutral dark:prose-invert max-w-none">
                    {lesson.content ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: lesson.content }}
                      />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>Lesson content is loading from CMS...</p>
                      </div>
                    )}
                  </article>

                  {/* Mark complete button for content lessons */}
                  {!isComplete && (
                    <div className="mt-8 text-center">
                      <Button
                        onClick={handleComplete}
                        className="h-11 px-8 gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {t("complete")}
                      </Button>
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
