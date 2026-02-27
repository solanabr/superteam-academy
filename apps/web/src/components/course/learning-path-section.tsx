"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { CaretDown, Lock, CheckCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { LearningPath } from "@/lib/sanity/types";

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
}

export function LearningPathSection({
  learningPath,
  progress,
  defaultOpen = false,
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

  const progressPercent =
    totalLessonsTotal > 0
      ? Math.round((completedLessonsTotal / totalLessonsTotal) * 100)
      : 0;

  const totalHours = courses.reduce((s, c) => s + c.duration, 0);

  // Determine locked state: course N locked if course N-1 not completed
  function isLocked(index: number): boolean {
    if (index === 0) return false;
    const prevCourse = courses[index - 1];
    if (!prevCourse) return false;
    return !progress.get(prevCourse._id)?.isCompleted;
  }

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

        {/* Progress bar — full width hero element */}
        <div className="path-bar-track">
          <div
            className="path-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

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
          <span className="path-foot-xp">
            {"\u26A1"} {totalXpEarned.toLocaleString()} /{" "}
            {totalXpPossible.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── Vertical Timeline ── */}
      <div className="path-timeline">
        {courses.map((course, idx) => {
          const p = progress.get(course._id);
          const locked = isLocked(idx);
          const isComplete = p?.isCompleted ?? false;
          const isActive = (p?.isEnrolled && !p?.isCompleted) ?? false;
          const percent =
            p && p.totalLessons > 0
              ? Math.round((p.completedLessons / p.totalLessons) * 100)
              : 0;
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
              {/* Small thumbnail */}
              <div className="path-step-thumb" aria-hidden="true">
                <img
                  src={course.thumbnail || "/cover.png"}
                  alt=""
                  width={80}
                  height={45}
                  loading="lazy"
                />
              </div>
              <div className="path-step-content">
                {/* Row 1: title + badge */}
                <div className="path-step-top">
                  <h4 className="path-step-title">{course.title}</h4>
                  {isComplete && (
                    <span className="path-step-badge done">
                      <CheckCircle size={11} weight="fill" /> {t("completed")}
                    </span>
                  )}
                  {isActive && (
                    <span className="path-step-badge active">
                      {completedLessons}/{lessonCount}
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
                    {"\u26A1"} {course.xpReward}
                  </span>
                </div>
                {/* Slim progress bar — only for active */}
                {isActive && (
                  <div className="path-step-progress">
                    <div
                      className="path-step-fill"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );

          return (
            <div key={course._id} className={`path-step ${stepStatus}`}>
              <div className="path-step-node" aria-hidden="true">
                {isComplete ? (
                  <CheckCircle size={16} weight="fill" />
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
