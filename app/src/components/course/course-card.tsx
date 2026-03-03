"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { BookOpen, Clock, Zap, CheckCircle2 } from "lucide-react";
import { TRACKS, DIFFICULTY_BG } from "@/lib/constants";
import { CourseIllustration } from "@/components/icons/course-illustration";
import { cn } from "@/lib/utils";
import type { Course } from "@/types";

export interface CourseCardProps {
  course: Course;
  progressPct: number;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function CourseCard({ course, progressPct }: CourseCardProps) {
  const t = useTranslations("courses");
  const track = TRACKS[course.trackId];

  const ctaLabel =
    progressPct === 100
      ? "Completed"
      : progressPct > 0
        ? "Continue"
        : "Start Course";

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-border/80 hover:shadow-xl hover:shadow-black/20"
    >
      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden rounded-t-2xl bg-gradient-to-br from-st-green-dark to-primary/20">
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

        {/* Track badge — left */}
        {track && (
          <div className="absolute left-3 top-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
              style={{
                backgroundColor: `${track.color}25`,
                color: track.color,
                border: `1px solid ${track.color}40`,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: track.color }}
              />
              {track.short}
            </span>
          </div>
        )}

        {/* Difficulty badge — right */}
        <div className="absolute right-3 top-3">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm",
              DIFFICULTY_BG[course.difficulty],
            )}
          >
            {DIFFICULTY_LABEL[course.difficulty] ?? course.difficulty}
          </span>
        </div>

        {/* Progress bar overlay at bottom of thumbnail */}
        {progressPct > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div
              className={cn(
                "h-full transition-all duration-500",
                progressPct === 100
                  ? "bg-brazil-green"
                  : "bg-gradient-to-r from-st-green to-brazil-teal",
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-base font-semibold leading-snug group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
          {course.description}
        </p>

        {/* Meta row */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            {t("catalog.lessonsCount", { count: course.lessonCount })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {course.duration}
          </span>
          <span className="ml-auto flex items-center gap-1.5 font-medium text-xp">
            <Zap className="h-3.5 w-3.5 shrink-0" />
            {t("catalog.xpReward", { amount: course.xpTotal })}
          </span>
        </div>

        {/* CTA button */}
        <div className="mt-4">
          <span
            className={cn(
              "flex w-full items-center justify-center rounded-xl border py-2.5 text-sm font-medium transition-colors",
              progressPct === 100
                ? "border-brazil-green/40 bg-brazil-green/10 text-brazil-green"
                : progressPct > 0
                  ? "border-primary/40 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                  : "border-border text-foreground group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground",
            )}
          >
            {progressPct === 100 && <CheckCircle2 className="mr-1.5 h-4 w-4" />}
            {ctaLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
