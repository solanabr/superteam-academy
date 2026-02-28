"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { TRACKS, DIFFICULTY_BG } from "@/lib/constants";
import { CourseIllustration } from "@/components/icons/course-illustration";
import type { Course } from "@/types";

export interface CourseCardProps {
  course: Course;
  progressPct: number;
}

export function CourseCard({ course, progressPct }: CourseCardProps) {
  const t = useTranslations("courses");
  const track = TRACKS[course.trackId];

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-card transition-all duration-300 hover-gold hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10"
    >
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden rounded-t-2xl bg-gradient-to-br from-st-green-dark to-primary/20">
        {course.thumbnail && !course.thumbnail.startsWith("/images/") ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <CourseIllustration
            className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105"
            trackColor={track?.color ?? "#4a8c5c"}
            variant={course.trackId}
          />
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_BG[course.difficulty]}`}
          >
            {course.difficulty}
          </span>
        </div>
        {track && (
          <div className="absolute right-3 top-3">
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${track.color}15`,
                color: track.color,
              }}
            >
              {track.display}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-base font-semibold group-hover:text-primary">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
          {course.description}
        </p>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>{t("catalog.lessonsCount", { count: course.lessonCount })}</span>
            <span>{course.duration}</span>
          </div>
          <span className="font-medium text-xp">{t("catalog.xpReward", { amount: course.xpTotal })}</span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPct === 100
                ? "bg-brazil-green"
                : progressPct > 0
                  ? "bg-gradient-to-r from-st-green to-brazil-teal progress-bar-animated"
                  : "bg-primary"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {t("catalog.studentsCount", { count: course.totalEnrollments.toLocaleString() })}
          </span>
          <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-all duration-300 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0">
            {t("catalog.viewCourse")}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
