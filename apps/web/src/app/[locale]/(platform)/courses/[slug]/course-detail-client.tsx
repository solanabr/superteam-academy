"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Lightning,
  User,
  Wallet,
  ChatCircleDots,
} from "@phosphor-icons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { CurriculumAccordion } from "@/components/course/curriculum-accordion";
import { ProgressBar } from "@/components/course/progress-bar";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "@/components/auth/auth-modal";
import { useAuth } from "@/lib/auth/auth-provider";
import { useOnChainEnroll } from "@/hooks/use-on-chain-enroll";
import { ThreadList } from "@/components/community/thread-list";
import { CreateThreadModal } from "@/components/community/create-thread-modal";
import type { Course } from "@/lib/sanity/types";

interface CourseDetailClientProps {
  course: Course;
}

export function CourseDetailClient({ course }: CourseDetailClientProps) {
  const t = useTranslations("courses");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { publicKey } = useWallet();

  const modules = course.modules ?? [];
  const tags = course.tags ?? [];

  const totalLessons = modules.reduce(
    (acc, mod) => acc + (mod.lessons?.length ?? 0),
    0
  );

  const { userId, profile: authProfile, isLoading: authLoading } = useAuth();
  const walletAddress = authProfile?.wallet_address ?? null;

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [discussionModalOpen, setDiscussionModalOpen] = useState(false);

  const fetchEnrollmentAndProgress = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Check enrollment status
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", course._id)
        .maybeSingle();

      setIsEnrolled(!!enrollment);

      // Fetch completed lessons for this course
      if (enrollment) {
        const { data: progress } = await supabase
          .from("user_progress")
          .select("lesson_id")
          .eq("user_id", userId)
          .eq("course_id", course._id)
          .eq("completed", true);

        setCompletedLessons(progress?.map((p) => p.lesson_id) ?? []);
      }
    } catch {
      // Silently fail — show unenrolled state
    } finally {
      setIsLoading(false);
    }
  }, [course._id, userId]);

  useEffect(() => {
    if (authLoading) return;
    fetchEnrollmentAndProgress();
  }, [authLoading, fetchEnrollmentAndProgress]);

  const { isEnrolling, handleEnroll } = useOnChainEnroll({
    courseId: course._id,
    userId,
    onSuccess: () => setIsEnrolled(true),
  });

  const completedCount = completedLessons.length;
  const isComplete = completedCount === totalLessons && totalLessons > 0;

  return (
    <div className="space-y-6">
      {/* Back to catalog */}
      <Link
        href={`/${locale}/courses`}
        className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-text-3 transition-colors hover:text-text"
      >
        <ArrowLeft size={16} weight="bold" />
        {tCommon("back")}
      </Link>

      {/* Course Header Card */}
      <div className="rounded-xl border-[2.5px] border-border bg-card p-6 shadow-card md:p-8">
        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="course-card-diff">{t(course.difficulty)}</span>
          <span className="flex items-center gap-1.5 text-sm text-text-3">
            <Clock size={16} weight="duotone" />
            {course.duration} {t("hours")}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-text-3">
            <BookOpen size={16} weight="duotone" className="text-primary" />
            {totalLessons} {t("lessons")}
          </span>
        </div>

        <h1 className="mt-4 font-display text-3xl font-black tracking-[-0.5px] md:text-4xl">
          {course.title}
        </h1>

        <div className="mt-4 space-y-4">
          <p className="max-w-2xl text-[15px] leading-relaxed text-text-2">
            {course.description}
          </p>

          {/* Instructor */}
          {course.instructor && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-subtle">
                <User
                  size={18}
                  weight="duotone"
                  className="text-text-3"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="font-display text-[13px] font-bold">
                  {t("courseBy")} {course.instructor.name}
                </p>
                {course.instructor.bio && (
                  <p className="text-xs leading-snug text-text-3">
                    {course.instructor.bio}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* XP + Tags row */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-display text-lg font-black text-xp">
              <Lightning size={20} weight="fill" className="text-xp" />
              {course.xpReward} {t("xpReward")}
            </span>
            {tags.length > 0 && (
              <>
                <span className="text-border" aria-hidden="true">
                  |
                </span>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border bg-subtle px-3 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-text-3"
                  >
                    {tag}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>

        {/* CTA + Progress */}
        <div className="mt-6 border-t border-border pt-5">
          {/* Progress bar (if enrolled) */}
          {isEnrolled && (
            <div className="mb-5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-display text-[13px] font-bold text-text-2">
                  {completedCount} / {totalLessons} {t("lessons")}
                </span>
                <span className="font-display text-[13px] font-bold text-text-3">
                  {isComplete ? t("completed") : t("inProgress")}
                </span>
              </div>
              <ProgressBar
                value={completedCount}
                max={totalLessons}
                showLabel
              />
            </div>
          )}

          {/* CTA button */}
          {!isLoading && userId ? (
            <>
              {!isEnrolled && !publicKey && !walletAddress ? (
                <Button
                  variant="push"
                  size="lg"
                  className="w-full font-semibold md:w-auto"
                  asChild
                >
                  <Link href={`/${locale}/settings?tab=account`}>
                    <Wallet
                      size={16}
                      weight="duotone"
                      className="mr-2"
                      aria-hidden="true"
                    />
                    {t("linkWalletToEnroll")}
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="push"
                  size="lg"
                  className="w-full font-semibold md:w-auto"
                  onClick={isEnrolled ? undefined : handleEnroll}
                  disabled={isEnrolling}
                  asChild={isEnrolled ? true : undefined}
                >
                  {isEnrolled ? (
                    <a
                      href={`/${locale}/courses/${course.slug}/lessons/${modules[0]?.lessons?.[0]?.slug ?? ""}`}
                    >
                      {t("continueCourse")}
                    </a>
                  ) : (
                    <>
                      {isEnrolling && (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                          <span className="sr-only">{tCommon("loading")}</span>
                        </>
                      )}
                      {t("enrollNow")}
                    </>
                  )}
                </Button>
              )}
            </>
          ) : !isLoading ? (
            <AuthModal
              trigger={
                <Button
                  variant="push"
                  size="lg"
                  className="w-full font-semibold md:w-auto"
                >
                  {t("signInToEnroll")}
                </Button>
              }
            />
          ) : (
            <div className="h-11 w-40 animate-pulse rounded-[var(--r-md)] bg-[var(--input)]" />
          )}
        </div>
      </div>

      {/* Curriculum */}
      <div className="space-y-4">
        <h2 className="font-display text-2xl font-extrabold">
          {t("curriculum")}
        </h2>
        <p className="text-sm text-text-3">
          {modules.length} {t("modules")} &middot; {totalLessons} {t("lessons")}
        </p>
        <CurriculumAccordion
          modules={modules}
          courseSlug={course.slug}
          locale={locale}
          completedLessons={completedLessons}
        />
      </div>

      {/* Discussions */}
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold">
            <ChatCircleDots
              size={24}
              weight="duotone"
              className="text-primary"
            />
            {t("discussions")}
          </h2>
          {userId && (
            <Button
              variant="push"
              size="sm"
              onClick={() => setDiscussionModalOpen(true)}
            >
              {t("startDiscussion")}
            </Button>
          )}
        </div>
        <ThreadList scope={{ courseId: course._id }} showFilters />
        {userId && (
          <CreateThreadModal
            open={discussionModalOpen}
            onOpenChange={setDiscussionModalOpen}
            defaultScope={{ courseId: course._id }}
          />
        )}
      </div>
    </div>
  );
}
