"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { CheckCircle2, Circle, Play, Clock, ChevronLeft, ChevronRight, Loader2, VideoIcon, List, Wallet, BookOpen, Code2, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useLessonComplete } from "@/hooks/useLessonComplete";
import { useEnrollment } from "@/hooks/useEnrollment";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@/components/wallet/CustomWalletModalProvider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProgressStore } from "@/stores/progress-store";
import { RichContent } from "@/lib/sanity/portable-text";
import { isLessonComplete as bitmapIsComplete } from "@/lib/solana/bitmap";
import { showXPToast } from "@/components/gamification/XPToast";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRouter } from "@/i18n/routing";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import type { SanityLesson, SanityCourse } from "@/lib/sanity/queries";
import { LessonCompleteOverlay } from "@/components/lessons/LessonCompleteOverlay";
import { LessonDiscussion } from "@/components/lessons/LessonDiscussion";

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
  modules?: SanityCourse["modules"];
  courseSlug: string;
  activeLessonSlug: string;
  getCompleted: (lessonIndex: number) => boolean;
  onSelect?: () => void;
  showHeader?: boolean;
}

function LessonItem({
  lesson,
  idx,
  courseSlug,
  activeLessonSlug,
  getCompleted,
  onSelect,
  t,
}: {
  lesson: SanityCourse["lessons"][number];
  idx: number;
  courseSlug: string;
  activeLessonSlug: string;
  getCompleted: (lessonIndex: number) => boolean;
  onSelect?: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const completed = getCompleted(lesson.lessonIndex);
  const isActive = lesson.slug === activeLessonSlug;
  const mins = lesson.estimatedMinutes ?? 0;
  return (
    <Link
      key={lesson._id}
      href={`/courses/${courseSlug}/lessons/${lesson.slug}`}
      onClick={onSelect}
      aria-label={`${idx + 1}. ${lesson.title} - ${completed ? t("lesson.completed") : t("lesson.notCompleted")}`}
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
            {idx + 1}. {lesson.title}
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
}

function LessonList({ lessons, modules, courseSlug, activeLessonSlug, getCompleted, onSelect, showHeader }: LessonListProps) {
  const t = useTranslations("courses");

  const allLessonsForProgress = modules && modules.length > 0
    ? modules.flatMap(m => m.lessons ?? [])
    : lessons;

  const completedCount = allLessonsForProgress.filter((l) => getCompleted(l.lessonIndex)).length;
  const totalCount = allLessonsForProgress.length;
  const completedPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const remainingMinutes = allLessonsForProgress
    .filter((l) => !getCompleted(l.lessonIndex))
    .reduce((sum, l) => sum + (l.estimatedMinutes ?? 0), 0);

  // Determine which module contains the active lesson (for default-open state)
  const activeModuleIndex = modules
    ? modules.findIndex(m => (m.lessons ?? []).some(l => l.slug === activeLessonSlug))
    : -1;

  return (
    <div>
      {showHeader && (
        <div className="mb-3 px-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t("lesson.lessonsProgress", { completed: completedCount, total: totalCount })}
            </span>
            {remainingMinutes > 0 && (
              <span>{t("lesson.timeRemaining", { time: formatRemainingTime(remainingMinutes) })}</span>
            )}
          </div>
          <Progress value={completedPercent} className="h-1.5" />
        </div>
      )}

      {modules && modules.length > 0 ? (
        // Module-grouped layout
        <div className="space-y-1">
          {modules.map((mod, modIdx) => {
            const modLessons = mod.lessons ?? [];
            const modCompleted = modLessons.filter(l => getCompleted(l.lessonIndex)).length;
            const isActiveModule = modIdx === activeModuleIndex;
            // Compute global lesson offset for correct numbering
            const lessonOffset = modules.slice(0, modIdx).reduce((sum, m) => sum + (m.lessons ?? []).length, 0);
            return (
              <details key={mod._id} open={isActiveModule} className="group">
                <summary className="flex cursor-pointer select-none list-none items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted [&::-webkit-details-marker]:hidden">
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-0 -rotate-90" aria-hidden="true" />
                  <span className="flex-1 truncate">{mod.title}</span>
                  <span className="shrink-0 tabular-nums">{modCompleted}/{modLessons.length}</span>
                </summary>
                <div className="space-y-0.5 pl-2">
                  {modLessons.map((l, idx) => (
                    <LessonItem
                      key={l._id}
                      lesson={l}
                      idx={lessonOffset + idx}
                      courseSlug={courseSlug}
                      activeLessonSlug={activeLessonSlug}
                      getCompleted={getCompleted}
                      onSelect={onSelect}
                      t={t}
                    />
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      ) : (
        // Flat list fallback
        <div className="space-y-0.5">
          {lessons.map((l, idx) => (
            <LessonItem
              key={l._id}
              lesson={l}
              idx={idx}
              courseSlug={courseSlug}
              activeLessonSlug={activeLessonSlug}
              getCompleted={getCompleted}
              onSelect={onSelect}
              t={t}
            />
          ))}
        </div>
      )}
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
  const [discussionOpen, setDiscussionOpen] = useState(false);

  const router = useRouter();
  const allLessons = (course.lessons ?? []).length > 0
    ? course.lessons
    : (course.modules ?? []).flatMap(m => m.lessons ?? []);
  const lessons = allLessons;
  const courseSlug = course.slug;
  const lessonSlug = lesson.slug;
  const currentIndex = allLessons.findIndex((l) => l.slug === lessonSlug);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

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
        totalLessons: lessons.length,
        trackId: course.trackId != null ? String(course.trackId) : undefined,
      });
      showXPToast(course.xpPerLesson);
      setCelebrationOpen(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("lesson.completionError"));
    }
  };

  // Lesson content panel (shared between split and full-width layouts)
  const lessonContent = (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
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
                  modules={course.modules}
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

      <h1 className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold">{lesson.title}</h1>

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
      <div className="prose dark:prose-invert max-w-none overflow-x-auto">
        {Array.isArray(lesson.content) && lesson.content.length > 0 ? (
          <RichContent content={lesson.content} />
        ) : (
          <p className="text-muted-foreground italic">{t("lesson.noContent")}</p>
        )}
      </div>

      <Separator className="my-8" />

      {/* Lesson-scoped discussion (no-challenge layout only) */}
      {!lesson.challenge && (
        <div className="mb-8">
          <LessonDiscussion lessonSlug={lessonSlug} courseSlug={courseSlug} />
        </div>
      )}

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

  // Tab-based layout (used for all screen sizes)
  const tabContent = lesson.challenge ? (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col min-h-0">
        <div className="shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-sm px-4 pt-3 pb-0">
          <TabsList className="h-10 w-auto">
            <TabsTrigger value="lesson" className="gap-1.5 px-3 sm:gap-2 sm:px-4">
              <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{t("lesson.lessonTab")}</span>
            </TabsTrigger>
            <TabsTrigger value="challenge" className="gap-1.5 px-3 sm:gap-2 sm:px-4">
              <Code2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{t("lesson.challenge")}</span>
              <span className="relative flex h-2 w-2 ml-1">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="lesson" className="flex-1 overflow-y-auto mt-0">
          {lessonContent}
        </TabsContent>
        <TabsContent value="challenge" className="flex-1 overflow-hidden mt-0">
          <ErrorBoundary>
            <CodeChallenge challenge={lesson.challenge} />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>

      {/* Collapsible discussion bottom panel */}
      <div className="shrink-0 border-t border-primary/30 bg-[#101018]">
        <button
          onClick={() => setDiscussionOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-foreground/90 hover:bg-[#161622] transition-colors"
          aria-expanded={discussionOpen}
          aria-controls="discussion-panel"
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
            {t("lesson.discussion")}
          </span>
          {discussionOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
        <div
          id="discussion-panel"
          className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
          style={{ maxHeight: discussionOpen ? "45vh" : "0px" }}
        >
          <div className="overflow-y-auto border-t border-border/30" style={{ maxHeight: "45vh" }}>
            <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 sm:py-6">
              <LessonDiscussion lessonSlug={lessonSlug} courseSlug={courseSlug} />
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar */}
      <aside className="hidden shrink-0 w-72 border-r border-border/40 lg:block">
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
              modules={course.modules}
              courseSlug={courseSlug}
              activeLessonSlug={lessonSlug}
              getCompleted={getLessonCompleted}
              showHeader
            />
          </div>
        </ScrollArea>
      </aside>

      {/* Content area */}
      {lesson.challenge ? (
        <div className="flex-1 min-w-0 overflow-hidden">
          {tabContent}
        </div>
      ) : (
        <div className="flex-1 min-w-0 overflow-y-auto">
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
