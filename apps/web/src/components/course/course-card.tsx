"use client";

import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

interface CourseCardProps {
  slug: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  /** Total duration in hours */
  duration: number;
  /** Total number of lessons */
  lessonCount?: number;
  xpReward: number;
  instructorName?: string;
  status?: "enrolled" | "completed";
  /** 1-based position in the grid — rendered as the large ghost background number */
  courseNum?: number;
}

const trackClass: Record<"beginner" | "intermediate" | "advanced", string> = {
  beginner: "beg",
  intermediate: "int",
  advanced: "adv",
};

export function CourseCard({
  slug,
  title,
  description,
  difficulty,
  duration,
  lessonCount,
  xpReward,
  instructorName,
  status,
  courseNum,
}: CourseCardProps) {
  const t = useTranslations("courses");
  const locale = useLocale();
  const track = trackClass[difficulty];

  return (
    <Link
      href={`/${locale}/courses/${slug}`}
      className={`course-card ${track}`}
      aria-label={title}
    >
      {/* Large ghost background number — zero-padded per v9 spec */}
      {courseNum !== undefined && (
        <span className="course-num" aria-hidden="true">
          {String(courseNum).padStart(2, "0")}
        </span>
      )}

      <div className="course-card-body">
        {/* Status badge — inline pill above the title */}
        {status === "completed" && (
          <span
            className="course-card-status completed"
            aria-label={t("completed")}
          >
            <CheckCircle size={11} weight="fill" aria-hidden="true" />
            {t("completed")}
          </span>
        )}
        {status === "enrolled" && (
          <span
            className="course-card-status enrolled"
            aria-label={t("enrolled")}
          >
            {t("enrolled")}
          </span>
        )}

        {/* 1. Title */}
        <h3 className="course-card-title">{title}</h3>

        {/* 2. Instructor by-line */}
        {instructorName && (
          <p className="course-card-by">
            {t("courseBy")} {instructorName}
          </p>
        )}

        {/* 3. Description — 2-line clamp handled by CSS */}
        <p className="course-card-desc">{description}</p>

        {/* 4. Footer: stats + XP */}
        <div className="course-card-foot">
          <div className="course-card-stat">
            {lessonCount !== undefined && (
              <span>
                {lessonCount} {t("lessons")}
              </span>
            )}
            <span>
              {duration} {t("hours")}
            </span>
          </div>

          <span className="course-card-xp" aria-label={`${xpReward} XP`}>
            <span aria-hidden="true">{"\u26A1"}</span> {xpReward}
          </span>
        </div>
      </div>
    </Link>
  );
}
