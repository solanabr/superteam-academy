"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Plus,
  Lightning,
  Wallet,
  ChatCircleDots,
} from "@phosphor-icons/react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { Course } from "@superteam-lms/types";
import { Button } from "@/components/ui/button";
import { CurriculumAccordion } from "@/components/course/curriculum-accordion";
import { CurriculumPath } from "@/components/course/curriculum-path";
import { ProgressBar } from "@/components/course/progress-bar";
import { InstructorCard } from "@/components/course/instructor-card";
import { createClient } from "@/lib/supabase/client";
import { findNextIncompleteLesson } from "@/lib/courses/continue-learning";
import { ShareCourseButton } from "@/components/referrals/share-course-button";
import { AuthModal } from "@/components/auth/auth-modal";
import { useAuth } from "@/lib/auth/auth-provider";
import { useOnChainEnroll } from "@/hooks/use-on-chain-enroll";
import { findEnrollmentPDA } from "@/lib/solana/pda";
import { ThreadList } from "@/components/community/thread-list";
import { ThreadComposer } from "@/components/community/thread-composer";
import { CourseChangelog } from "@/components/course/course-changelog";
import { LinkedWalletPrompt } from "@/components/wallet/linked-wallet-prompt";
import type { PublicProfile } from "@/lib/profiles/public-profile";
import type { CourseChangelogEntry } from "@/lib/courses/changelog-types";

interface CourseDetailClientProps {
  course: Course;
  /**
   * The creator wallet's resolved public academy profile (issue #478, B4),
   * or `null` when there isn't one — resolved server-side (see `page.tsx`)
   * so the instructor section never has to fetch client-side.
   */
  instructorProfile: PublicProfile | null;
  /**
   * The course's post-deployment evolution log (issue #654), read server-side
   * and passed in already decoded. Rendered below the curriculum.
   */
  changelog: CourseChangelogEntry[];
  /**
   * Where lesson links point. Defaults to the live catalogue
   * (`/{locale}/courses`); the teacher preview (#831) passes its own base so
   * navigation stays inside the preview instead of escaping to `/courses`,
   * where an unpublished course does not exist.
   */
  hrefBase?: string;
  /**
   * Preview mode (#831): the course is not on-chain and its lessons are not in
   * the live bundle, so enrolment must be inert — no wallet prompt, no
   * `useOnChainEnroll`. Live rendering is unaffected (defaults to false).
   */
  readOnly?: boolean;
}

export function CourseDetailClient({
  course,
  instructorProfile,
  changelog,
  hrefBase,
  readOnly = false,
}: CourseDetailClientProps) {
  const t = useTranslations("courses");
  const tCommon = useTranslations("common");
  const tCommunity = useTranslations("community");
  const locale = useLocale();
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const modules = course.modules ?? [];
  const tags = course.tags ?? [];
  const [showAllTags, setShowAllTags] = useState(false);
  const MAX_VISIBLE_TAGS = 6;

  // Live catalogue unless a caller overrides it (#831 teacher preview).
  const linkBase = hrefBase ?? `/${locale}/courses`;

  const totalLessons = modules.reduce(
    (acc, mod) => acc + (mod.lessons?.length ?? 0),
    0
  );

  // Map the inline-module course shape onto the accordion's shape, deriving
  // "is a challenge" from graded-block presence (lesson.type is gone).
  const accordionModules = modules.map((mod, i) => ({
    id: mod.key ?? `module-${i}`,
    title: mod.title,
    lessons: (mod.lessons ?? []).map((lesson) => ({
      _id: lesson._id,
      title: lesson.title,
      slug: lesson.slug,
      isChallenge: (lesson.blocks ?? []).some((b) => b._type === "code"),
    })),
  }));

  const { userId, profile: authProfile, isLoading: authLoading } = useAuth();
  const walletAddress = authProfile?.wallet_address ?? null;

  const [isEnrolled, setIsEnrolled] = useState(false);
  // ISO enrollment timestamp — lets the changelog flag entries newer than the
  // learner's enrollment (issue #654 point 3). Null when signed-out/unenrolled.
  const [enrolledAt, setEnrolledAt] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Inline composer (no modal — matches the lesson embed and Community):
  // writing happens at the top of the list, the new thread appears below.
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [threadsRefreshToken, setThreadsRefreshToken] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const fetchEnrollmentAndProgress = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Check enrollment status — Supabase first, then on-chain fallback.
      // The fallback catches the case where the Helius webhook missed the sync
      // (enrollment PDA exists on-chain but Supabase has no record).
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id, enrolled_at")
        .eq("user_id", userId)
        .eq("course_id", course._id)
        .maybeSingle();

      setEnrolledAt(enrollment?.enrolled_at ?? null);

      let enrolled = !!enrollment;

      if (!enrolled && publicKey) {
        try {
          const [enrollmentPDA] = findEnrollmentPDA(course._id, publicKey);
          const info = await connection.getAccountInfo(enrollmentPDA);
          if (info && info.data.length > 0) enrolled = true;
        } catch {
          // ignore — fall through to show unenrolled state
        }
      }

      setIsEnrolled(enrolled);

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
  }, [course._id, userId, publicKey, connection]);

  useEffect(() => {
    if (authLoading) return;
    fetchEnrollmentAndProgress();
  }, [authLoading, fetchEnrollmentAndProgress]);

  const { isEnrolling, handleEnroll, reauthPrompt, isWalletResolving } =
    useOnChainEnroll({
      courseId: course._id,
      userId,
      // Anonymous Enroll opens the auth modal instead of silently no-oping
      // (#556). The signed-out CTA below already renders the AuthModal trigger,
      // so this only fires if handleEnroll is reached some other way.
      onRequireAuth: () => setAuthModalOpen(true),
      onSuccess: () => setIsEnrolled(true),
    });

  const completedCount = completedLessons.length;
  const isComplete = completedCount === totalLessons && totalLessons > 0;

  // Next incomplete lesson in module→lesson order (LX-B2 — this used to be
  // hardcoded to the first lesson regardless of progress). Fully complete
  // courses fall back to the first lesson for review.
  const orderedLessons = accordionModules.flatMap((m) => m.lessons);
  const nextIncompleteLesson = findNextIncompleteLesson(
    orderedLessons,
    new Set(completedLessons)
  );
  const ctaLessonSlug = (nextIncompleteLesson ?? orderedLessons[0])?.slug ?? "";

  return (
    <div className="space-y-6">
      {/* Back to catalog */}
      <Link
        href={linkBase}
        className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-text-3 transition-colors hover:text-text"
      >
        <ArrowLeft size={16} weight="bold" />
        {tCommon("back")}
      </Link>

      {/* Course Header Card — two-column hero: content left, action rail
          right so the CTA sits above the fold instead of under the prose */}
      <div className="rounded-xl border-[2.5px] border-border bg-card p-6 shadow-card md:p-8">
        <div className="md:grid md:grid-cols-[minmax(0,1fr)_300px] md:gap-10">
          <div>
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
              <p className="text-[15px] leading-relaxed text-text-2">
                {course.description}
              </p>

              {/* Instructor identity (issue #478) — resolved public profile, or a
              truncated-wallet fallback (B4). */}
              {course.creator && (
                <InstructorCard
                  creatorWallet={course.creator}
                  profile={instructorProfile}
                />
              )}

              {/* Skill tags — capped so the header stays scannable */}
              {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {(showAllTags ? tags : tags.slice(0, MAX_VISIBLE_TAGS)).map(
                    (tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border bg-subtle px-3 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-text-3"
                      >
                        {tag}
                      </span>
                    )
                  )}
                  {tags.length > MAX_VISIBLE_TAGS && (
                    <button
                      type="button"
                      onClick={() => setShowAllTags((s) => !s)}
                      aria-expanded={showAllTags}
                      className="rounded-full border border-border px-3 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-text-2 transition-colors hover:border-border-hover hover:text-text"
                    >
                      {showAllTags ? "−" : `+${tags.length - MAX_VISIBLE_TAGS}`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action rail — XP, progress and the CTA in one place */}
          <div className="mt-6 md:mt-0">
            <div className="rounded-[var(--r-md)] border-[1.5px] border-border p-5 [background:color-mix(in_srgb,var(--subtle)_60%,transparent)]">
              <span className="inline-flex items-center gap-1.5 font-display text-lg font-black text-xp">
                <Lightning size={20} weight="fill" className="text-xp" />
                {course.xpReward} {t("xpReward")}
              </span>

              <div className="mt-4 border-t border-border pt-4">
                {/* Progress bar (if enrolled) */}
                {isEnrolled && (
                  <div className="mb-5 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs font-semibold uppercase tabular-nums tracking-wider text-text-2">
                        {completedCount}/{totalLessons} {t("lessons")}
                      </span>
                      <span className="font-display text-[13px] font-bold text-text-3">
                        {isComplete ? t("completed") : t("inProgress")}
                      </span>
                    </div>
                    <ProgressBar
                      value={completedCount}
                      max={totalLessons}
                      segmented
                    />
                  </div>
                )}

                {/* An embedded-wallet learner whose Dynamic session expired.
                    The wallet-connect modal is a dead end for them (#1179), so
                    the way back is signing in with the provider again. */}
                {reauthPrompt && (
                  <LinkedWalletPrompt
                    variant="reauth"
                    linkedWallet={walletAddress ?? null}
                    onReauth={reauthPrompt.start}
                    onDismiss={reauthPrompt.dismiss}
                  />
                )}

                {/* CTA button */}
                {!isLoading && userId ? (
                  <>
                    {!isEnrolled && !publicKey && !walletAddress ? (
                      <Button
                        variant="push"
                        size="lg"
                        className="w-full font-semibold"
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
                        className="w-full font-semibold"
                        onClick={
                          isEnrolled || readOnly ? undefined : handleEnroll
                        }
                        // isWalletResolving: the Dynamic SDK has not yet said
                        // whether this learner holds an embedded wallet. Brief,
                        // and the alternative is the init race.
                        disabled={
                          isEnrolling ||
                          (!isEnrolled && !readOnly && isWalletResolving)
                        }
                        asChild={isEnrolled || readOnly ? true : undefined}
                      >
                        {/* readOnly (#831): a previewed course has no on-chain
                      enrolment to make, so the CTA opens the first lesson
                      instead of prompting a wallet. */}
                        {isEnrolled || readOnly ? (
                          <a
                            href={`${linkBase}/${course.slug}/lessons/${ctaLessonSlug}`}
                          >
                            {t("continueCourse")}
                          </a>
                        ) : (
                          <>
                            {isEnrolling && (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                <span className="sr-only">
                                  {tCommon("loading")}
                                </span>
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
                    open={authModalOpen}
                    onOpenChange={setAuthModalOpen}
                    trigger={
                      <Button
                        variant="push"
                        size="lg"
                        className="w-full font-semibold"
                      >
                        {t("signInToEnroll")}
                      </Button>
                    }
                  />
                ) : (
                  <div className="h-11 w-full animate-pulse rounded-[var(--r-md)] bg-[var(--input)]" />
                )}

                {/* Sharing is a referral: the link carries the viewer's code,
                    so a course they recommend credits them. Quiet next to the
                    CTA — it is the second thing you do here, not the first. */}
                <div className="mt-3">
                  <ShareCourseButton
                    courseSlug={course.slug}
                    courseTitle={course.title}
                  />
                </div>
              </div>
            </div>
          </div>
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
        {isEnrolled ? (
          // Linear-path progress map (LX-B14): one visually-active "next"
          // node from the shared derivation; every lesson stays a plain
          // link — presentation only, never a lock.
          <CurriculumPath
            modules={accordionModules}
            courseSlug={course.slug}
            locale={locale}
            hrefBase={hrefBase}
            completedLessons={completedLessons}
            activeLessonId={nextIncompleteLesson?._id ?? null}
          />
        ) : (
          <CurriculumAccordion
            modules={accordionModules}
            courseSlug={course.slug}
            locale={locale}
            hrefBase={hrefBase}
            completedLessons={completedLessons}
          />
        )}
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
        </div>
        {/* Composing happens INLINE at the top of the list (same as the
            lesson embed and Community) — no modal over the page. */}
        {isComposerOpen && userId ? (
          <div className="rounded-lg border border-border bg-card p-3">
            <h4 className="mb-3 font-display text-sm font-bold text-text">
              {tCommunity("composerHeading")}
            </h4>
            <ThreadComposer
              defaultScope={{ courseId: course._id }}
              onCancel={() => setIsComposerOpen(false)}
              onCreated={() => {
                setIsComposerOpen(false);
                setThreadsRefreshToken((n) => n + 1);
              }}
            />
          </div>
        ) : null}
        {/* Context chips stay on here: every thread shares the course, but the
            chip names the LESSON, which is the disambiguating part. */}
        <ThreadList
          scope={{ courseId: course._id }}
          showFilters
          showContext
          refreshToken={threadsRefreshToken}
          actionSlot={
            userId && !isComposerOpen ? (
              <Button
                variant="push"
                size="sm"
                onClick={() => setIsComposerOpen(true)}
              >
                <Plus size={14} weight="bold" aria-hidden="true" />
                {tCommunity("askQuestion")}
              </Button>
            ) : undefined
          }
        />
      </div>

      {/* Changelog (issue #654) — how the course has evolved since deployment. */}
      <CourseChangelog entries={changelog} enrolledAt={enrolledAt} />
    </div>
  );
}
