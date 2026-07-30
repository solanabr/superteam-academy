"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Play, ArrowRight, Confetti } from "@phosphor-icons/react";
import {
  trackContinueCardShown,
  trackContinueCardClick,
} from "@/lib/analytics/events";

/**
 * What the dashboard hero's Continue card points at (LX-B2, issue #551):
 * the derived next-incomplete lesson, the next course when everything
 * enrolled is finished, or the catalog when there is nothing left to suggest.
 * `null` derivations (no enrollments) simply don't render the card — the
 * existing empty states keep their catalog CTA.
 */
export type ContinueCardTarget =
  | {
      kind: "lesson";
      courseTitle: string;
      courseSlug: string;
      lessonTitle: string;
      lessonSlug: string;
      completedLessons: number;
      totalLessons: number;
    }
  | { kind: "nextCourse"; courseTitle: string; courseSlug: string }
  | { kind: "catalog" };

interface ContinueCardProps {
  target: ContinueCardTarget;
  locale: string;
}

/**
 * Dashboard hero Continue card — one focusable deep link straight back into
 * the learning loop, wrapped in the Solana brand gradient.
 */
export function ContinueCard({ target, locale }: ContinueCardProps) {
  const t = useTranslations("dashboard");

  // `catalog` carries no course; the other two do (#871).
  const courseSlug = target.kind === "catalog" ? undefined : target.courseSlug;

  // Shown is the click-through DENOMINATOR, so it fires per render of the
  // dashboard rather than once per session — a learner who returns twice and
  // clicks once is 1/2. Keyed on the resolved target so a re-render with the
  // same target (e.g. a parent state change) does not double-count.
  useEffect(() => {
    trackContinueCardShown({ kind: target.kind, courseSlug });
  }, [target.kind, courseSlug]);

  const href =
    target.kind === "lesson"
      ? `/${locale}/courses/${target.courseSlug}/lessons/${target.lessonSlug}`
      : target.kind === "nextCourse"
        ? `/${locale}/courses/${target.courseSlug}`
        : `/${locale}/courses`;

  const ariaLabel =
    target.kind === "lesson"
      ? t("continueAria", {
          course: target.courseTitle,
          lesson: target.lessonTitle,
        })
      : target.kind === "nextCourse"
        ? t("startNextCourseAria", { course: target.courseTitle })
        : t("browseCourses");

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      onClick={() => trackContinueCardClick({ kind: target.kind, courseSlug })}
      className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="rounded-xl p-[2.5px] shadow-card [background:linear-gradient(135deg,#9945FF,#14F195)]">
        <div className="relative flex items-center gap-4 overflow-hidden rounded-[10px] bg-card p-5 md:p-6">
          {/* sheen sweep on hover */}
          <div
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
            aria-hidden="true"
          />

          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white [background:linear-gradient(135deg,#9945FF,#14F195)]"
            aria-hidden="true"
          >
            {target.kind === "lesson" ? (
              <Play size={20} weight="fill" />
            ) : (
              <Confetti size={20} weight="fill" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              {target.kind === "lesson"
                ? t("continueLearning")
                : t("allCaughtUp")}
            </p>
            {target.kind === "lesson" ? (
              <p className="mt-1 truncate font-display text-base font-black tracking-[-0.25px] md:text-lg">
                {target.courseTitle}
                <span className="mx-2 text-text-3" aria-hidden="true">
                  &middot;
                </span>
                <span className="text-text-2">{target.lessonTitle}</span>
              </p>
            ) : target.kind === "nextCourse" ? (
              <p className="mt-1 truncate font-display text-base font-black tracking-[-0.25px] md:text-lg">
                {t("startNextCourse")}
                <span className="mx-2 text-text-3" aria-hidden="true">
                  &middot;
                </span>
                <span className="text-text-2">{target.courseTitle}</span>
              </p>
            ) : (
              <p className="mt-1 truncate font-display text-base font-black tracking-[-0.25px] md:text-lg">
                {t("browseCourses")}
              </p>
            )}
            {target.kind === "lesson" && (
              <p className="mt-1 text-xs text-text-3">
                {t("lessonsDone", {
                  completed: target.completedLessons,
                  total: target.totalLessons,
                })}
              </p>
            )}
            {target.kind !== "lesson" && (
              <p className="mt-1 text-xs text-text-3">{t("allCaughtUpHint")}</p>
            )}
          </div>

          <span
            className="flex shrink-0 items-center gap-1.5 font-display text-sm font-extrabold text-primary transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          >
            <span className="hidden sm:inline">
              {target.kind === "lesson"
                ? t("resumeLesson")
                : target.kind === "nextCourse"
                  ? t("startLearning")
                  : t("browseCourses")}
            </span>
            <ArrowRight size={16} weight="bold" />
          </span>
        </div>
      </div>
    </Link>
  );
}
