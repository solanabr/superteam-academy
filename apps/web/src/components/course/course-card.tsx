"use client";

import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react";
import { useTranslations, useLocale } from "next-intl";

interface CourseCardProps {
  slug: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number;
  lessonCount?: number;
  completedLessons?: number;
  xpReward: number;
  pathLabel?: string;
  trackLevel?: number;
  thumbnail?: string | null;
  status?: "enrolled" | "completed";
}

export function CourseCard({
  slug,
  title,
  description,
  difficulty,
  duration,
  lessonCount,
  completedLessons,
  xpReward,
  pathLabel,
  trackLevel,
  thumbnail,
  status,
}: CourseCardProps) {
  const t = useTranslations("courses");
  const locale = useLocale();

  return (
    <Link
      href={`/${locale}/courses/${slug}`}
      className="course-card"
      aria-label={title}
    >
      {/* Thumbnail */}
      <div className="course-card-thumb" aria-hidden="true">
        <img
          src={thumbnail || "/cover.png"}
          alt=""
          width={400}
          height={225}
          loading="lazy"
        />
        {/* Ghost background number — trackLevel within path */}
        {trackLevel !== undefined && (
          <span className="course-num">
            {String(trackLevel).padStart(2, "0")}
          </span>
        )}
      </div>

      <div className="course-card-body">
        {/* Top row: path badge + status badge */}
        <div className="course-card-top">
          {pathLabel && <span className="course-card-path">{pathLabel}</span>}

          {status === "completed" && (
            <span
              className="course-card-status completed"
              aria-label={t("completed")}
            >
              <CheckCircle size={11} weight="fill" aria-hidden="true" />
              {t("completed")}
            </span>
          )}
          {status === "enrolled" &&
            completedLessons !== undefined &&
            lessonCount !== undefined && (
              <span
                className="course-card-status enrolled"
                aria-label={`${completedLessons}/${lessonCount} ${t("lessons")}`}
              >
                {completedLessons}/{lessonCount} {t("lessons")}
              </span>
            )}
        </div>

        {/* Title */}
        <h3 className="course-card-title">{title}</h3>

        {/* Description */}
        <p className="course-card-desc">{description}</p>

        {/* Footer: difficulty pill + stats + XP */}
        <div className="course-card-foot">
          <div className="course-card-stat">
            <span className="course-card-diff">{t(difficulty)}</span>
            {lessonCount !== undefined && (
              <>
                <span
                  className="text-[16px] leading-none text-text-3"
                  aria-hidden="true"
                >
                  &middot;
                </span>
                <span>
                  {lessonCount} {t("lessons")}
                </span>
              </>
            )}
            <span
              className="text-[16px] leading-none text-text-3"
              aria-hidden="true"
            >
              &middot;
            </span>
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
