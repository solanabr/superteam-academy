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
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/course/difficulty-badge";
import { CurriculumAccordion } from "@/components/course/curriculum-accordion";
import { ProgressBar } from "@/components/course/progress-bar";
import { createClient } from "@/lib/supabase/client";
import { CourseCompletionMint } from "@/components/certificates/course-completion-mint";
import { AuthModal } from "@/components/auth/auth-modal";
import type { Course } from "@/lib/sanity/types";

interface CourseDetailClientProps {
  course: Course;
}

export function CourseDetailClient({ course }: CourseDetailClientProps) {
  const t = useTranslations("courses");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const modules = course.modules ?? [];
  const tags = course.tags ?? [];

  const totalLessons = modules.reduce(
    (acc, mod) => acc + (mod.lessons?.length ?? 0),
    0
  );

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchEnrollmentAndProgress = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user ?? null;

      if (!user) {
        setIsLoading(false);
        return;
      }

      setUserId(user.id);

      // Check enrollment status
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", course._id)
        .maybeSingle();

      setIsEnrolled(!!enrollment);

      // Fetch completed lessons for this course
      if (enrollment) {
        const { data: progress } = await supabase
          .from("user_progress")
          .select("lesson_id")
          .eq("user_id", user.id)
          .eq("course_id", course._id)
          .eq("completed", true);

        setCompletedLessons(progress?.map((p) => p.lesson_id) ?? []);
      }
    } catch {
      // Silently fail — show unenrolled state
    } finally {
      setIsLoading(false);
    }
  }, [course._id]);

  useEffect(() => {
    fetchEnrollmentAndProgress();
  }, [fetchEnrollmentAndProgress]);

  const handleEnroll = async () => {
    setIsEnrolling(true);
    setEnrollError(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user ?? null;

      if (!user) {
        setEnrollError(tCommon("error"));
        return;
      }

      const { error } = await supabase.from("enrollments").insert({
        user_id: user.id,
        course_id: course._id,
      });

      if (error) {
        if (error.code === "23505") {
          // Already enrolled (unique constraint violation)
          setIsEnrolled(true);
        } else {
          setEnrollError(tCommon("error"));
        }
        return;
      }

      setIsEnrolled(true);
    } catch {
      setEnrollError(tCommon("error"));
    } finally {
      setIsEnrolling(false);
    }
  };

  const completedCount = completedLessons.length;
  const isComplete = completedCount === totalLessons && totalLessons > 0;

  return (
    <div className="space-y-8">
      {/* Back to catalog */}
      <Link
        href={`/${locale}/courses`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-3 transition-colors hover:text-text"
      >
        <ArrowLeft size={16} weight="bold" />
        {tCommon("back")}
      </Link>

      {/* Course Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <DifficultyBadge
            difficulty={course.difficulty}
            label={t(course.difficulty)}
          />
          <span className="flex items-center gap-1.5 text-sm text-text-3">
            <Clock size={16} weight="duotone" className="text-text-3" />
            {course.duration} {t("hours")}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-text-3">
            <BookOpen size={16} weight="duotone" className="text-primary" />
            {totalLessons} {t("lessons")}
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold md:text-4xl">
          {course.title}
        </h1>

        {/* Description + CTA side by side */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <p className="max-w-2xl text-lg text-text-3">
              {course.description}
            </p>

            {/* Instructor */}
            {course.instructor && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle">
                  <User
                    size={20}
                    weight="duotone"
                    className="text-text-3"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {t("courseBy")} {course.instructor.name}
                  </p>
                  {course.instructor.bio && (
                    <p className="text-xs text-text-3">
                      {course.instructor.bio}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* XP Reward */}
            <span className="flex items-center gap-1.5 font-display text-lg font-bold text-accent">
              <Lightning size={20} weight="duotone" className="text-accent" />
              {course.xpReward} {t("xpReward")}
            </span>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border-[2.5px] border-border bg-subtle px-3 py-1 font-display text-xs font-bold text-text shadow-[0_1px_0_0] shadow-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* CTA column */}
          <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
            {!isLoading && userId ? (
              <>
                <Button
                  variant="push"
                  size="lg"
                  className="font-semibold"
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
                          <span className="sr-only">Loading...</span>
                        </>
                      )}
                      {t("enrollNow")}
                    </>
                  )}
                </Button>
                {enrollError && (
                  <p className="text-sm text-danger">{enrollError}</p>
                )}
              </>
            ) : !isLoading ? (
              <AuthModal
                trigger={
                  <Button variant="push" size="lg" className="font-semibold">
                    {t("signInToEnroll")}
                  </Button>
                }
              />
            ) : null}
          </div>
        </div>

        {/* Progress bar (if enrolled) */}
        {isEnrolled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-3">
                {completedCount} / {totalLessons} {t("lessons")}
              </span>
              <span className="text-text-3">
                {isComplete ? t("completed") : t("inProgress")}
              </span>
            </div>
            <ProgressBar value={completedCount} max={totalLessons} showLabel />
          </div>
        )}

        {/* NFT Certificate Minting */}
        {isEnrolled && userId && (
          <CourseCompletionMint
            courseId={course._id}
            courseTitle={course.title}
            userId={userId}
            totalLessons={totalLessons}
          />
        )}
      </div>

      {/* Curriculum */}
      <div className="space-y-4">
        <h2 className="font-display text-2xl font-bold">{t("curriculum")}</h2>
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
    </div>
  );
}
