"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Trophy,
  Zap,
  Clock,
  Sparkles,
} from "lucide-react";
import type { Course } from "@/types";
import { TRACKS } from "@/lib/constants";
import { CourseIllustration } from "@/components/icons/course-illustration";

export interface QuizAnswers {
  experience: string;
  interests: string[];
  goal: string;
  pace: string;
}

interface RecommendedPath {
  nameKey: string;
  descriptionKey: string;
  color: string;
}

interface QuizResultsProps {
  answers: QuizAnswers;
  courses: Course[];
}

function getRecommendedPath(answers: QuizAnswers): RecommendedPath {
  const { experience, interests } = answers;

  if (experience === "beginner" || experience === "web-dev") {
    return {
      nameKey: "paths.fundamentals.name",
      descriptionKey: "paths.fundamentals.description",
      color: "#78c48c",
    };
  }

  if (interests.includes("security")) {
    return {
      nameKey: "paths.security.name",
      descriptionKey: "paths.security.description",
      color: "#ef4444",
    };
  }

  if (interests.includes("defi")) {
    return {
      nameKey: "paths.defi.name",
      descriptionKey: "paths.defi.description",
      color: "#5fd4a0",
    };
  }

  if (interests.includes("anchor")) {
    return {
      nameKey: "paths.anchor.name",
      descriptionKey: "paths.anchor.description",
      color: "#d4b83d",
    };
  }

  return {
    nameKey: "paths.fullstack.name",
    descriptionKey: "paths.fullstack.description",
    color: "#6dd8c4",
  };
}

function getRecommendedCourses(answers: QuizAnswers, courses: Course[]): Course[] {
  const { experience, interests } = answers;

  const scored = courses.map((course) => {
    let score = 0;

    // Experience match
    if (experience === "beginner" && course.difficulty === "beginner") score += 3;
    if (experience === "web-dev" && course.difficulty === "beginner") score += 2;
    if (experience === "dev-new-solana" && course.difficulty === "intermediate") score += 3;
    if (experience === "solana-dev" && course.difficulty === "advanced") score += 3;

    // Interest match
    const track = TRACKS[course.trackId];
    if (track && interests.includes(track.name)) score += 2;

    return { course, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.course);
}

function getEstimatedWeeks(answers: QuizAnswers): number {
  const paceWeeks: Record<string, number> = {
    casual: 8,
    consistent: 4,
    intensive: 2,
    weekend: 6,
  };
  return paceWeeks[answers.pace] ?? 4;
}

export function QuizResults({ answers, courses }: QuizResultsProps) {
  const t = useTranslations("onboarding.results");
  const tc = useTranslations("courses.catalog");
  const td = useTranslations("courses.detail");
  const recommendedPath = getRecommendedPath(answers);
  const recommendedCourses = getRecommendedCourses(answers, courses);
  const estimatedWeeks = getEstimatedWeeks(answers);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-heading text-2xl font-bold sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Recommended Path Card */}
      <div className="mb-6 rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
          {t("recommendedPath")}
        </div>
        <h3 className="text-xl font-bold">{t(recommendedPath.nameKey)}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(recommendedPath.descriptionKey)}
        </p>

        {/* Stats row */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{t("estimatedWeeks", { count: estimatedWeeks })} {t("toFirstCredential")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Trophy className="h-4 w-4 text-brazil-gold" />
            <span>{t("earnCredential")}</span>
          </div>
        </div>
      </div>

      {/* Recommended Courses */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold">{t("startWith")}</h3>
        <div className="space-y-3">
          {recommendedCourses.map((course, i) => {
            const track = TRACKS[course.trackId];
            return (
              <Link
                key={course.slug}
                href={`/courses/${course.slug}`}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Course illustration */}
                <div className="hidden h-14 w-14 shrink-0 overflow-hidden rounded-lg sm:block">
                  <CourseIllustration
                    variant={i}
                    trackColor={track?.color ?? "#a1a1aa"}
                    width={56}
                    height={56}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-semibold group-hover:text-primary">
                    {course.title}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="capitalize">{td(course.difficulty)}</span>
                    <span>{tc("lessonsCount", { count: course.lessonCount })}</span>
                    <span className="flex items-center gap-0.5">
                      <Zap className="h-3 w-3 text-brazil-gold" />
                      {course.xpTotal} XP
                    </span>
                  </div>
                </div>

                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={recommendedCourses[0] ? `/courses/${recommendedCourses[0].slug}` : "/courses"}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97]"
        >
          {t("startFirstCourse")}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/courses"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold transition-all duration-200 hover:bg-muted hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]"
        >
          {t("browseAll")}
        </Link>
      </div>
    </div>
  );
}
