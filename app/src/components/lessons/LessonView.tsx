"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { CheckCircle2, Circle, Play, Clock, ChevronLeft, ChevronRight, Loader2, VideoIcon, List, Wallet, BookOpen, Code2, PanelLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useLessonComplete } from "@/hooks/useLessonComplete";
import { useEnrollment } from "@/hooks/useEnrollment";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProgressStore } from "@/stores/progress-store";
import { RichContent } from "@/lib/sanity/portable-text";
import { isLessonComplete as bitmapIsComplete } from "@/lib/solana/bitmap";
import { showXPToast } from "@/components/gamification/XPToast";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRouter } from "@/i18n/routing";
import { ErrorBoundary } from "@/components/shared/error-boundary";
// react-resizable-panels no longer needed — using tab-based layout
import type { SanityLesson, SanityCourse } from "@/lib/sanity/queries";
import { LessonCompleteOverlay } from "@/components/lessons/LessonCompleteOverlay";

const CodeChallenge = dynamic(
  () => import("@/components/challenges/CodeChallenge").then(mod => ({ default: mod.CodeChallenge })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 w-full items-center justify-center rounded-lg bg-muted/50 border border-border/30">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
          <span className="text-xs font-medium tracking-wide">Loading editor…</span>
        </div>
      </div>
    ),
  }
);

function isValidVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const allowed = ["www.youtube.com", "youtube.com", "youtu.be", "vimeo.com", "player.vimeo.com"];
    return allowed.includes(parsed.hostname);
  } catch {
    return false;
  }
}

function timeColor(minutes: number): string {
  if (minutes < 10) return "text-green-500 dark:text-green-400";
  if (minutes <= 20) return "text-amber-500 dark:text-amber-400";
  return "text-muted-foreground";
}

function formatRemainingTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `~${h}h ${m}min`;
  if (h > 0) return `~${h}h`;
  return `~${m}min`;
}

interface LessonListProps {
  lessons: SanityCourse["lessons"];
  courseSlug: string;
  activeLessonSlug: string;
  getCompleted: (lessonIndex: number) => boolean;
  onSelect?: () => void;
  showHeader?: boolean;
}

function LessonList({ lessons, courseSlug, activeLessonSlug, getCompleted, onSelect, showHeader }: LessonListProps) {
  const t = useTranslations("courses");

  const completedCount = lessons.filter((l) => getCompleted(l.lessonIndex)).length;
  const totalCount = lessons.length;
  const completedPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const remainingMinutes = lessons
    .filter((l) => !getCompleted(l.lessonIndex))
    .reduce((sum, l) => sum + (l.estimatedMinutes ?? 0), 0);

  return (
    <div>
      {showHeader && (
        <div className="mb-3 px-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {completedCount} of {totalCount} lessons
            </span>
            {remainingMinutes > 0 && (
              <span>{formatRemainingTime(remainingMinutes)} remaining</span>
            )}
          </div>
          <Progress value={completedPercent} className="h-1.5" />
        </div>
      )}
      <div className="space-y-0.5">
        {lessons.map((l, idx) => {
          const completed = getCompleted(l.lessonIndex);
          const isActive = l.slug === activeLessonSlug;
          const mins = l.estimatedMinutes ?? 0;
          return (
            <Link
              key={l._id}
              href={`/courses/${courseSlug}/lessons/${l.slug}`}
              onClick={onSelect}
              aria-label={`${idx + 1}. ${l.title} - ${completed ? t("lesson.completed") : t("lesson.notCompleted")}`}
            >
              <div
                className={`flex items-start gap-2 rounded-lg py-2 pr-3 text-sm transition-colors ${isActive
                  ? "border-l-2 border-primary bg-primary/5 pl-2 text-primary"
                  : "border-l-2 border-transparent pl-2 hover:bg-muted"
                  }`}
              >
                <div className="mt-0.5 shrink-0">
                  {completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
                  ) : isActive ? (
                    <Play className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                  <span className="truncate leading-snug">
                    {idx + 1}. {l.title}
                  </span>
                  {mins > 0 && (
                    <span className={`flex items-center gap-1 text-xs ${timeColor(mins)}`}>
                      <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {mins}min
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

interface LessonViewProps {
  lesson: SanityLesson;
  course: SanityCourse;
}

export function LessonView({ lesson, course }: LessonViewProps) {
  const t = useTranslations("courses");
  const tc = useTranslations("common");
  const { enrollment } = useEnrollment(course.onChainCourseId);
  const { completing, markComplete } = useLessonComplete();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const isLessonCompleteOptimistic = useProgressStore((s) => s.isLessonComplete);
  const streakDays = useProgressStore((s) => s.streakDays);
  const lastActivityDate = useProgressStore((s) => s.lastActivityDate);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("lesson");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    // Auto-collapse sidebar when switching to challenge tab for max editor space
    setSidebarCollapsed(value === "challenge");
  }, []);

  const router = useRouter();
  const allLessons = course.lessons.length > 0
    ? course.lessons
    : (course.modules ?? []).flatMap(m => m.lessons ?? []);
  const lessons = allLessons;
  const courseSlug = course.slug;
  const lessonSlug = lesson.slug;
  const currentIndex = allLessons.findIndex((l) => l.slug === lessonSlug);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // N/P keyboard shortcuts for lesson navigation
  // Safe to pass inline because the hook uses a ref to always call the latest handler
  useKeyboardShortcuts([
    {
      key: "n",
      description: "Next lesson",
      handler: () => {
        if (nextLesson) router.push(`/courses/${courseSlug}/lessons/${nextLesson.slug}`);
      },
      skipWhenTyping: true,
    },
    {
      key: "p",
      description: "Previous lesson",
      handler: () => {
        if (prevLesson) router.push(`/courses/${courseSlug}/lessons/${prevLesson.slug}`);
      },
      skipWhenTyping: true,
    },
  ]);

  // Derive completion state: optimistic store wins (instant feedback), then on-chain bitmap
  const getLessonCompleted = (lessonIndex: number): boolean => {
    if (isLessonCompleteOptimistic(course.onChainCourseId, lessonIndex)) return true;
    if (enrollment?.lessonFlags) {
      const flags = enrollment.lessonFlags.map((bn) => BigInt(bn.toString()));
      return bitmapIsComplete(flags, lessonIndex);
    }
    return false;
  };

  const currentLessonCompleted = getLessonCompleted(lesson.lessonIndex);

  const isFirstToday = lastActivityDate !== new Date().toLocaleDateString("en-CA");

  const handleMarkComplete = async () => {
    try {
      await markComplete({
        courseId: course.onChainCourseId,
        courseTitle: course.title,
        lessonIndex: lesson.lessonIndex,
        lessonTitle: lesson.title,
        xpPerLesson: course.xpPerLesson,
      });
      showXPToast(course.xpPerLesson);
      setCelebrationOpen(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("lesson.completionError"));
    }
  };

  // Lesson content panel (shared between split and full-width layouts)
  const lessonContent = (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        ariaLabel={tc("breadcrumb")}
        items={[
          { label: tc("courses"), href: "/courses" },
          { label: course.title, href: `/courses/${courseSlug}` },
          { label: lesson.title },
        ]}
      />

      {/* Mobile lesson drawer trigger */}
      <div className="mb-4 lg:hidden">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2" aria-label={t("lesson.lessonList")}>
              <List className="h-4 w-4" aria-hidden="true" />
              <span>{t("lesson.allLessons")}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0" closeLabel={tc("close")}>
            <div className="p-4">
              <SheetTitle className="mb-4 text-sm font-semibold">{t("lesson.lessonList")}</SheetTitle>
              <Link href={`/courses/${courseSlug}`}>
                <Button variant="ghost" size="sm" className="mb-4 gap-1 w-full justify-start">
                  <ChevronLeft className="h-4 w-4" />
                  {t("lesson.backToCourse")}
                </Button>
              </Link>
              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {course.title}
              </p>
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <LessonList
                  lessons={lessons}
                  courseSlug={courseSlug}
                  activeLessonSlug={lessonSlug}
                  getCompleted={getLessonCompleted}
                  onSelect={() => setDrawerOpen(false)}
                  showHeader
                />
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Meta badges */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge variant="outline">{lesson.estimatedMinutes} {tc("minutesShort")}</Badge>
        <Badge variant="outline">+{course.xpPerLesson} XP</Badge>
        {lesson.videoUrl && (
          <Badge variant="outline" className="gap-1">
            <VideoIcon className="h-3 w-3" aria-hidden="true" />
            {tc("video")}
          </Badge>
        )}
        {currentLessonCompleted && (
          <Badge className="gap-1 bg-green-500/10 text-green-500">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            {t("lesson.completedBadge")}
          </Badge>
        )}
      </div>

      <h1 className="mb-8 text-3xl font-bold">{lesson.title}</h1>

      {/* Video embed */}
      {lesson.videoUrl && isValidVideoUrl(lesson.videoUrl) && (
        <div className="mb-8 aspect-video overflow-hidden rounded-xl bg-black">
          <iframe
            src={lesson.videoUrl}
            className="h-full w-full"
            title={tc("videoTitle", { title: lesson.title })}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            allowFullScreen
          />
        </div>
      )}

      {/* Rich content from Sanity Portable Text */}
      <div className="prose dark:prose-invert max-w-none">
        {lesson.content?.length > 0 ? (
          <RichContent content={lesson.content} />
        ) : (
          <p className="text-muted-foreground italic">{t("lesson.noContent")}</p>
        )}
      </div>

      <Separator className="my-8" />

      {/* Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {prevLesson && (
            <Link href={`/courses/${courseSlug}/lessons/${prevLesson.slug}`}>
              <Button variant="outline" className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                {t("lesson.previousLesson")}
              </Button>
            </Link>
          )}
        </div>

        {!currentLessonCompleted && (
          connected ? (
            <Button
              onClick={handleMarkComplete}
              disabled={completing}
              className="gap-2"
              aria-label={completing ? tc("loading") : t("lesson.markComplete")}
            >
              {completing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              {t("lesson.markComplete")}
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setVisible(true)}
                    aria-label={t("lesson.connectWalletToTrack")}
                  >
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    {t("lesson.connectWalletToTrack")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("lesson.connectWalletTooltip")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        )}

        <div>
          {nextLesson && (
            <Link href={`/courses/${courseSlug}/lessons/${nextLesson.slug}`}>
              <Button variant="outline" className="gap-1">
                {t("lesson.nextLesson")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar — auto-collapses when Code Challenge tab is active */}
      <aside
        className={`hidden shrink-0 border-r border-border/40 lg:block transition-all duration-300 ease-in-out overflow-hidden ${sidebarCollapsed ? "w-0 border-r-0" : "w-72"
          }`}
      >
        <ScrollArea className="h-[calc(100vh-4rem)] w-72">
          <div className="p-4">
            <Link href={`/courses/${courseSlug}`}>
              <Button variant="ghost" size="sm" className="mb-4 gap-1">
                <ChevronLeft className="h-4 w-4" />
                {t("lesson.backToCourse")}
              </Button>
            </Link>
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {course.title}
            </p>
            <LessonList
              lessons={lessons}
              courseSlug={courseSlug}
              activeLessonSlug={lessonSlug}
              getCompleted={getLessonCompleted}
              showHeader
            />
          </div>
        </ScrollArea>
      </aside>

      {/* Content area — tabbed when challenge exists, full-width otherwise */}
      {lesson.challenge ? (
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex h-[calc(100vh-4rem)] flex-col">
            {/* Tab bar — sticky at top */}
            <div className="shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-sm px-4 pt-3 pb-0 flex items-end justify-between">
              <TabsList className="h-10 w-full sm:w-auto">
                <TabsTrigger value="lesson" className="gap-2 px-4">
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  {t("lesson.lessonTab")}
                </TabsTrigger>
                <TabsTrigger value="challenge" className="gap-2 px-4">
                  <Code2 className="h-4 w-4" aria-hidden="true" />
                  {t("lesson.challenge")}
                  {/* Pulsing dot alert */}
                  <span className="relative flex h-2 w-2 ml-1">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                </TabsTrigger>
              </TabsList>
              {/* Sidebar toggle — visible when collapsed */}
              {sidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-1 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setSidebarCollapsed(false)}
                  aria-label="Show lesson sidebar"
                >
                  <PanelLeft className="h-4 w-4" />
                  Show Lessons
                </Button>
              )}
            </div>

            {/* Lesson content tab */}
            <TabsContent value="lesson" className="flex-1 overflow-y-auto mt-0">
              {lessonContent}
            </TabsContent>

            {/* Code challenge tab — full height editor, no padding for max space */}
            <TabsContent value="challenge" className="flex-1 overflow-hidden mt-0">
              <ErrorBoundary>
                <CodeChallenge challenge={lesson.challenge} />
              </ErrorBoundary>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {lessonContent}
        </div>
      )}

      <LessonCompleteOverlay
        open={celebrationOpen}
        onClose={() => setCelebrationOpen(false)}
        xpEarned={course.xpPerLesson}
        streakDays={streakDays}
        isFirstToday={isFirstToday}
        nextLessonSlug={nextLesson?.slug}
        courseSlug={courseSlug}
        lessonTitle={lesson.title}
      />
    </div>
  );
}
