"use client";

import Link from "next/link";
import Image from "next/image";
import { Check } from "@phosphor-icons/react";
import { useTranslations, useLocale } from "next-intl";
import { StatusChip } from "@/components/course/status-chip";

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
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading="lazy"
          aria-hidden="true"
        />
        {/* The card owns the title as an overlay — banner art ships text-free
            so one image serves every locale and a retitle never needs a
            re-render of the art. */}
        {thumbnail && (
          <h3 className="course-card-thumb-title">
            <span>{title}</span>
          </h3>
        )}
        {status === "completed" && (
          <StatusChip
            tone="earned"
            className="course-card-status"
            aria-label={t("completed")}
          >
            <Check size={11} weight="bold" aria-hidden="true" />
            {t("completed")}
          </StatusChip>
        )}
        {status === "enrolled" &&
          completedLessons !== undefined &&
          lessonCount !== undefined && (
            <StatusChip
              className="course-card-status"
              aria-label={`${completedLessons}/${lessonCount} ${t("lessons")}`}
            >
              {completedLessons}/{lessonCount} {t("lessons")}
            </StatusChip>
          )}
      </div>

      <div className="course-card-body">
        {/* Banner art already carries the title — real thumbnails skip the
            heading; the /cover.png fallback keeps it; aria-label covers a11y. */}
        {!thumbnail && <h3 className="course-card-title">{title}</h3>}

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
