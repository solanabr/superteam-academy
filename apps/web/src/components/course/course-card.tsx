"use client";

import Link from "next/link";
import Image from "next/image";
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
  thumbnail?: string | null;
  status?: "enrolled" | "completed";
  style?: React.CSSProperties;
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
  thumbnail,
  status,
  style,
}: CourseCardProps) {
  const t = useTranslations("courses");
  const locale = useLocale();

  return (
    <Link
      href={`/${locale}/courses/${slug}`}
      className="course-card"
      aria-label={title}
      style={style}
    >
      {/* Thumbnail — enrollment status overlays the cover so the card body
          stays uniform across enrolled and un-enrolled cards */}
      <div className="course-card-thumb">
        <Image
          src={thumbnail || "/cover.png"}
          alt=""
          width={400}
          height={225}
          loading="lazy"
          aria-hidden="true"
        />
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

      <div className="course-card-body">
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
