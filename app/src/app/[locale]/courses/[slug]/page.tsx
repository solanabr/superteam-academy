"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { trackEvent } from "@/components/analytics/GoogleAnalytics";
import { LessonRow } from "@/components/courses/LessonRow";
import { Link } from "@/lib/i18n/navigation";
import { useProgress } from "@/lib/hooks/use-progress";
import {
  enrollWithOnchainTransaction,
  getEnrollmentErrorDescription,
} from "@/lib/progress/client-enrollment";
import { resolveClientCourseId } from "@/lib/progress/client-course-id-overrides";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { PremiumEmptyState } from "@/components/ui/premium-empty-state";
import { Progress } from "@/components/ui/progress";
import { SectionCard } from "@/components/ui/section-card";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  LogIn,
  PlayCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import type { Course } from "@/types/content";

function findFirstLessonHref(course: Course, courseSlug: string) {
  const firstLessonId = course.modules[0]?.lessons[0]?.id;
  return firstLessonId ? `/courses/${courseSlug}/lessons/${firstLessonId}` : `/courses/${courseSlug}`;
}

export default function CourseDetailPage() {
  const t = useTranslations("courses");
  const tc = useTranslations("common");
  const locale = useLocale();
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const isAuthenticated = !!session?.user;

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [courseLoadError, setCourseLoadError] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [isEnrolling, setIsEnrolling] = useState(false);

  const { progress, refresh: refreshProgress, isLoading: isProgressLoading } = useProgress(params.slug);
  const isEnrolled = !!progress;
  const completionPercent = progress?.completionPercent ?? 0;
  const coursePath = `/courses/${params.slug}`;
  const signInHref = `/auth/signin?callbackUrl=${encodeURIComponent(coursePath)}`;
  const instructorName = "Superteam Brazil Curriculum Team";
  const walletEnrollmentGuidance = connected
    ? "Enrollment is signed in your connected wallet on Solana devnet after you press Enroll Now."
    : "Connect a Solana wallet on devnet, then press Enroll Now to sign the enrollment transaction.";
  const reviewsStatus = "Public learner reviews will appear after verified cohort feedback is available.";

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${params.slug}?locale=${encodeURIComponent(locale)}`);

        if (res.ok) {
          const data = (await res.json()) as { course: Course };
          setCourse(data.course);
          setCourseLoadError(false);

          if (data.course.modules.length > 0) {
            setExpandedModules(new Set([data.course.modules[0].id]));
          }
        } else {
          setCourse(null);
          setCourseLoadError(true);
        }
      } catch (err) {
        console.error("Failed to fetch course:", err);
        setCourse(null);
        setCourseLoadError(true);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchCourse();
  }, [locale, params.slug]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleEnroll = useCallback(async () => {
    if (!isAuthenticated) {
      const callbackUrl = `/courses/${params.slug}`;
      router.push(`/${locale}/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    if (!connected || !publicKey) {
      setWalletModalVisible(true);
      return;
    }

    const courseId = resolveClientCourseId(
      params.slug,
      course?.onChainCourseId ?? params.slug
    );

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
        courseSlug: params.slug,
        connection,
        learner: publicKey,
        sendTransaction,
      });

      trackEvent("enroll_course", "courses", params.slug);
      refreshProgress();

      if (course) {
        router.push(findFirstLessonHref(course, params.slug));
      }
    } catch (err) {
      console.error("Failed to enroll:", err);
      toast.error("Course enrollment failed", {
        description: getEnrollmentErrorDescription(err),
      });
    } finally {
      setIsEnrolling(false);
    }
  }, [
    connected,
    connection,
    course,
    isAuthenticated,
    locale,
    params.slug,
    publicKey,
    refreshProgress,
    router,
    sendTransaction,
    setWalletModalVisible,
  ]);

  const handleContinue = useCallback(() => {
    if (!course) {
      return;
    }

    for (const moduleItem of course.modules) {
      for (const lessonItem of moduleItem.lessons) {
        if (!progress?.completedLessons.includes(lessonItem.id)) {
          router.push(`/courses/${params.slug}/lessons/${lessonItem.id}`);
          return;
        }
      }
    }

    router.push(findFirstLessonHref(course, params.slug));
  }, [course, params.slug, progress, router]);

  const totalLessons = useMemo(
    () => (course ? course.modules.reduce((sum, moduleItem) => sum + moduleItem.lessons.length, 0) : 0),
    [course]
  );

  const whatYouLearn = useMemo(
    () =>
      course
        ? course.modules
            .flatMap((moduleItem) => moduleItem.lessons)
            .slice(0, 6)
            .map((lessonItem) => lessonItem.title)
        : [],
    [course]
  );

  if (isLoading) {
    return (
      <PageShell
        hero={
          <PageHeader
            badge={
              <Badge
                variant="outline"
                className="w-fit border-border/70 bg-muted/40 text-xs uppercase tracking-[0.22em] text-muted-foreground"
              >
                {t("title")}
              </Badge>
            }
            icon={<BookOpen className="h-5 w-5" />}
            title={t("subtitle")}
            description={t("searchPlaceholder")}
          />
        }
      >
        <div className="flex min-h-[20rem] items-center justify-center rounded-[1.5rem] border border-border/70 bg-card/80">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  if (!course) {
    return (
      <PageShell
        hero={
          <PageHeader
            badge={
              <Badge
                variant="outline"
                className="w-fit border-border/70 bg-muted/40 text-xs uppercase tracking-[0.22em] text-muted-foreground"
              >
                {t("title")}
              </Badge>
            }
            icon={<BookOpen className="h-5 w-5" />}
            title={t("subtitle")}
            description={t("searchPlaceholder")}
          />
        }
      >
        <PremiumEmptyState
          icon={BookOpen}
          title={tc("error")}
          description={courseLoadError ? tc("errorSupportMessage") : tc("noResults")}
          action={
            <Button type="button" variant="outline" onClick={() => router.refresh()}>
              {tc("retry")}
            </Button>
          }
        />
      </PageShell>
    );
  }

  const headerActions = (
    <Button asChild variant="outline">
      <Link href="/courses" className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        {tc("back")}
      </Link>
    </Button>
  );

  const primaryAction = !isAuthenticated ? (
    <Button asChild variant="outline" size="lg" className="w-full">
      <Link href={signInHref} className="gap-2">
        <LogIn className="h-4 w-4" />
        {t("signInToTrack")}
      </Link>
    </Button>
  ) : isProgressLoading ? (
    <Button size="lg" className="w-full gap-2" disabled>
      <Loader2 className="h-4 w-4 animate-spin" />
      {tc("loading")}
    </Button>
  ) : isEnrolled ? (
    <Button className="w-full" size="lg" onClick={handleContinue}>
      <PlayCircle className="h-4 w-4" />
      {completionPercent > 0 ? t("continue") : t("startCourse")}
    </Button>
  ) : (
    <Button className="w-full" size="lg" onClick={handleEnroll} disabled={isEnrolling}>
      {isEnrolling ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("enrollCTA")}
        </>
      ) : !connected ? (
        <>
          <Sparkles className="h-4 w-4" />
          {tc("connectWallet")}
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          {t("enrollCTA")}
        </>
      )}
    </Button>
  );

  return (
    <PageShell
      hero={
        <PageHeader
          badge={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-border/70 bg-background/80 text-foreground">
                {tc(course.difficulty)}
              </Badge>
              <Badge variant="outline" className="border-border/70 bg-muted/35 text-muted-foreground">
                {t("lessonCount", { count: totalLessons })}
              </Badge>
              {isEnrolled ? (
                <Badge variant="outline" className="border-border/70 bg-muted/35 text-muted-foreground">
                  {t("progress", { percent: completionPercent })}
                </Badge>
              ) : null}
            </div>
          }
          icon={<BookOpen className="h-5 w-5" />}
          title={course.title}
          description={course.description}
          actions={headerActions}
        />
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_22rem]">
        <div className="space-y-6">
          {whatYouLearn.length > 0 ? (
            <SectionCard
              title={t("whatYouLearn")}
              description={t("aboutCourse")}
              className="rounded-[1.75rem]"
              contentClassName="grid gap-3 sm:grid-cols-2"
            >
              {whatYouLearn.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-card">
                    <CheckCircle2 className="h-4 w-4 text-foreground" />
                  </div>
                  <p className="text-sm leading-6 text-foreground">{item}</p>
                </div>
              ))}
            </SectionCard>
          ) : null}

          <SectionCard
            title={t("reviews")}
            description={t("aboutCourse")}
            className="rounded-[1.75rem]"
            contentClassName="space-y-3"
          >
            <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
              <p className="text-sm font-medium text-foreground">No public learner reviews yet</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{reviewsStatus}</p>
            </div>
          </SectionCard>

          {course.modules.length === 0 ? (
            <PremiumEmptyState icon={BookOpen} title={tc("noResults")} description={t("courseContent")} />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-foreground">{t("curriculum")}</h2>
                  <p className="text-sm text-muted-foreground">{t("moduleCount", { count: course.modules.length })}</p>
                </div>
              </div>

              {course.modules.map((moduleItem, moduleIndex) => {
                const isExpanded = expandedModules.has(moduleItem.id);

                return (
                  <SectionCard
                    key={moduleItem.id}
                    className="overflow-hidden rounded-[1.75rem]"
                    contentClassName="space-y-4"
                  >
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-4 rounded-2xl border border-border/70 bg-muted/20 px-4 py-4 text-start transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onClick={() => toggleModule(moduleItem.id)}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="border-border/70 bg-card/90 text-foreground">
                            {moduleIndex + 1}
                          </Badge>
                          <h3 className="text-base font-semibold text-foreground">{moduleItem.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{moduleItem.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("lessonCount", { count: moduleItem.lessons.length })}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </button>

                    {isExpanded ? (
                      <div className="space-y-3">
                        {moduleItem.lessons.map((lessonItem, lessonIndex) => (
                          <LessonRow
                            key={lessonItem.id}
                            href={`/courses/${course.slug}/lessons/${lessonItem.id}`}
                            index={lessonIndex + 1}
                            title={lessonItem.title}
                            duration={lessonItem.duration}
                            xpReward={lessonItem.xpReward}
                            xpLabel={tc("xp")}
                            completedLabel={tc("completed")}
                            openLabel={tc("active")}
                            completed={progress?.completedLessons.includes(lessonItem.id) ?? false}
                            type={lessonItem.type}
                          />
                        ))}
                      </div>
                    ) : null}
                  </SectionCard>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <SectionCard className="rounded-[1.75rem]" contentClassName="space-y-5">
            <div className="course-cover-surface flex min-h-[11rem] items-center justify-center rounded-[1.5rem] border border-border/70 p-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-border/70 bg-card/90 shadow-sm">
                <BookOpen className="h-8 w-8 text-foreground" />
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
                <span className="text-muted-foreground">{tc("xp")}</span>
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Zap className="h-4 w-4" />
                  {course.totalXP}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
                <span className="text-muted-foreground">{tc("lessons")}</span>
                <span className="font-medium text-foreground">{totalLessons}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
                <span className="text-muted-foreground">{t("instructor")}</span>
                <span className="font-medium text-foreground">{instructorName}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
                <span className="text-muted-foreground">{t("duration", { minutes: course.duration })}</span>
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Clock className="h-4 w-4" />
                  {course.duration}
                </span>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-foreground">{t("continue")}</span>
                <span className="text-muted-foreground">{t("progress", { percent: completionPercent })}</span>
              </div>
              <Progress value={completionPercent} className="h-2" />
              <p className="mt-3 text-xs text-muted-foreground">
                {progress?.completedLessons.length ?? 0} / {totalLessons} {tc("lessons")}
              </p>
            </div>

            {primaryAction}

            <div className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Wallet enrollment</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{walletEnrollmentGuidance}</p>
            </div>

            <p className="text-center text-xs text-muted-foreground">{tc("free")}</p>
          </SectionCard>

          <SectionCard
            title={t("courseContent")}
            description={t("aboutCourse")}
            className="rounded-[1.75rem]"
            contentClassName="space-y-3"
          >
            <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              {t("moduleCount", { count: course.modules.length })}
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              {t("lessonCount", { count: totalLessons })}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
