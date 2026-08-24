"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  CaretDoubleRight,
  CaretDown,
  Check,
  Lightning,
  Lock,
} from "@phosphor-icons/react";
import type { LearningPath } from "@superteam-lms/types";
import type { PathGuidanceModality } from "@/lib/courses/learner-segment";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/course/progress-bar";
import { StatusChip } from "@/components/course/status-chip";
import { buttonVariants } from "@/components/ui/button";

export interface PathCourseProgress {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  isCompleted: boolean;
  isEnrolled: boolean;
}

interface LearningPathSectionProps {
  learningPath: LearningPath;
  progress: Map<string, PathCourseProgress>;
  defaultOpen?: boolean;
  /**
   * Per-segment guidance modality (LX-A7). Only the framing changes — the
   * sequence itself is identical across modalities. Defaults to the legacy
   * locked sequence so existing call sites keep their behavior.
   */
  modality?: PathGuidanceModality;
}

export function LearningPathSection({
  learningPath,
  progress,
  defaultOpen = false,
  modality = "fixed",
}: LearningPathSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const t = useTranslations("courses");
  const locale = useLocale();

  const courses = learningPath.courses ?? [];

  // Calculate aggregated path progress (lesson-level)
  const completedLessonsTotal = courses.reduce(
    (sum, c) => sum + (progress.get(c._id)?.completedLessons ?? 0),
    0
  );
  const totalLessonsTotal = courses.reduce(
    (sum, c) => sum + (progress.get(c._id)?.totalLessons ?? 0),
    0
  );

  const totalXpEarned = courses.reduce((sum, c) => {
    const p = progress.get(c._id);
    if (p?.isCompleted) return sum + c.xpReward;
    if (p?.isEnrolled) {
      const pct = p.totalLessons > 0 ? p.completedLessons / p.totalLessons : 0;
      return sum + Math.floor(c.xpReward * pct);
    }
    return sum;
  }, 0);

  const totalXpPossible = courses.reduce((sum, c) => sum + c.xpReward, 0);

  const totalHours = courses.reduce((s, c) => s + c.duration, 0);

  // Sequential gate: course N is "ahead" if course N-1 is not completed.
  // Only the `fixed` modality turns this into a hard lock; `guided-skip`
  // surfaces it as a skip-ahead hint and `open` ignores it entirely.
  function isAhead(index: number): boolean {
    if (index === 0) return false;
    const prevCourse = courses[index - 1];
    if (!prevCourse) return false;
    return !progress.get(prevCourse._id)?.isCompleted;
  }

  // The skip-ahead affordance reads identically on every gated row — show the
  // pill once, on the first ahead course; later rows stay clickable regardless.
  const firstAheadIdx = courses.findIndex((_, i) => isAhead(i));

  const toggle = () => setIsOpen((o) => !o);

  return (
    <div className={cn("path-section", isOpen && "open")}>
      {/* ── Path Header ── */}
      <div
        className="path-header"
        onClick={toggle}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        {/* Row 1: Title + tag + chevron */}
        <div className="path-header-top">
          <h3 className="path-name">
            {learningPath.title}
            {learningPath.tag && (
              <span className="path-tag">{learningPath.tag}</span>
            )}
          </h3>
          <CaretDown
            size={16}
            weight="bold"
            className="path-chevron"
            aria-hidden="true"
          />
        </div>

        {/* Progress bar — the shared ink construction. Lessons are discrete and
            the footer counts them, so the bar counts them too: one cell per
            lesson, falling back to a smooth fill on its own past SEGMENT_CAP
            where ticks stop being countable. */}
        <ProgressBar
          value={completedLessonsTotal}
          max={totalLessonsTotal}
          segmented
          aria-label={`${completedLessonsTotal}/${totalLessonsTotal} ${t("lessons")}`}
        />

        {/* Row 2: Stats */}
        <div className="path-header-foot">
          <span className="path-foot-progress">
            {completedLessonsTotal}/{totalLessonsTotal} {t("lessons")}
          </span>
          <span className="path-foot-sep" aria-hidden="true">
            ·
          </span>
          <span>
            {totalHours} {t("hours")}
          </span>
          {/* The dashboard's XP idiom: drawn lightning + amber display face,
              not an emoji and not a tinted pill. */}
          <span className="path-foot-xp">
            <Lightning size={12} weight="fill" aria-hidden="true" />
            {totalXpEarned.toLocaleString()} /{" "}
            {totalXpPossible.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── Vertical Timeline ── */}
      <div className="path-timeline">
        {courses.map((course, idx) => {
          const p = progress.get(course._id);
          const ahead = isAhead(idx);
          const locked = modality === "fixed" && ahead;
          const skipAhead =
            modality === "guided-skip" && ahead && idx === firstAheadIdx;
          const isComplete = p?.isCompleted ?? false;
          const isActive = (p?.isEnrolled && !p?.isCompleted) ?? false;
          const lessonCount =
            course.modules?.reduce(
              (sum, m) => sum + (m.lessons?.length ?? 0),
              0
            ) ?? 0;

          const stepStatus = isComplete
            ? "done"
            : isActive
              ? "active"
              : locked
                ? "locked"
                : "upcoming";

          const completedLessons = p?.completedLessons ?? 0;

          const cardContent = (
            <div className="path-step-inner">
              <div className="path-step-content">
                {/* Row 1: title + badge */}
                <div className="path-step-top">
                  <h4 className="path-step-title">{course.title}</h4>
                  {isComplete && (
                    <StatusChip tone="earned" size="sm">
                      <Check size={11} weight="bold" aria-hidden="true" />
                      {t("completed")}
                    </StatusChip>
                  )}
                  {isActive && (
                    <>
                      <StatusChip
                        size="sm"
                        aria-label={`${completedLessons}/${lessonCount} ${t("lessons")}`}
                      >
                        {completedLessons}/{lessonCount}
                      </StatusChip>
                      {/* The row's card IS the link, so the affordances inside
                          it are spans wearing the Button's classes — a nested
                          <button> inside an <a> is invalid markup. */}
                      <span
                        className={cn(
                          buttonVariants({ variant: "primary", size: "sm" }),
                          "path-step-continue"
                        )}
                      >
                        {t("continue")}
                        <CaretDoubleRight
                          size={11}
                          weight="bold"
                          aria-hidden="true"
                        />
                      </span>
                    </>
                  )}
                  {skipAhead && (
                    <span
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "sm" }),
                        "path-step-skip"
                      )}
                    >
                      <CaretDoubleRight
                        size={11}
                        weight="bold"
                        aria-hidden="true"
                      />{" "}
                      {t("skipAhead")}
                    </span>
                  )}
                  {locked && (
                    <Lock
                      size={14}
                      weight="duotone"
                      className="path-step-lock"
                    />
                  )}
                </div>
                {/* Row 2: compact meta */}
                <div className="path-step-meta">
                  <span>
                    {lessonCount} {t("lessons")}
                  </span>
                  <span>·</span>
                  <span>
                    {course.duration} {t("hours")}
                  </span>
                  <span>·</span>
                  <span>{t(course.difficulty)}</span>
                  <span>·</span>
                  <span className="path-step-meta-xp">
                    <Lightning size={11} weight="fill" aria-hidden="true" />
                    {course.xpReward}
                  </span>
                </div>
                {/* Slim progress bar — only for active. The same construction
                    as the path bar above it, one step down in height. */}
                {isActive && (
                  <ProgressBar
                    value={completedLessons}
                    max={lessonCount}
                    segmented
                    size="slim"
                    className="mt-1.5"
                    aria-label={`${completedLessons}/${lessonCount} ${t("lessons")}`}
                  />
                )}
              </div>
            </div>
          );

          return (
            <div key={course._id} className={`path-step ${stepStatus}`}>
              <div className="path-step-node" aria-hidden="true">
                {isComplete ? (
                  <Check size={16} weight="bold" />
                ) : locked ? (
                  <Lock size={14} weight="duotone" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              {locked ? (
                <div className="path-step-card">{cardContent}</div>
              ) : (
                <Link
                  href={`/${locale}/courses/${course.slug}`}
                  className="path-step-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  {cardContent}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
