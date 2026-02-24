"use client";

import { useTranslations } from "next-intl";
import { useCourses } from "@/hooks/use-courses";
import Link from "next/link";

function getDailyIndex(courseCount: number, lessonCount: number): { course: number; lesson: number } {
  const day = Math.floor(Date.now() / 86_400_000);
  const course = day % courseCount;
  const lesson = day % lessonCount;
  return { course, lesson };
}

export function DailyChallenge() {
  const t = useTranslations("dashboard");
  const { data: courses } = useCourses();

  if (!courses?.length) return null;

  const { course: ci, lesson: li } = getDailyIndex(
    courses.length,
    courses[0].lessonCount
  );
  const course = courses[ci % courses.length];
  const lessonIndex = li % course.lessonCount;

  return (
    <Link
      href={`/courses/${course.courseId}/lessons/${lessonIndex}`}
      className="group block rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-400/5 to-solana-purple/5 p-4 transition-all hover:border-orange-400/40"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-400/10 text-orange-400 transition-transform group-hover:scale-110">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-orange-400">
            {t("dailyChallenge")}
          </p>
          <p className="truncate text-sm font-medium text-content group-hover:text-orange-400 transition-colors">
            {course.courseId} — {t("lesson")} {lessonIndex + 1}
          </p>
        </div>
        <div className="shrink-0 rounded-lg bg-orange-400/10 px-2.5 py-1 text-xs font-bold text-orange-400">
          +{course.xpPerLesson} XP
        </div>
      </div>
    </Link>
  );
}
