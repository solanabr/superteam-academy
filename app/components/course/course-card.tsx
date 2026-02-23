"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import type { CourseAccount } from "@/hooks/use-courses";
import { difficultyLabel, formatXp } from "@/lib/format";

const TRACK_COLORS: Record<number, { bg: string; text: string; glow: string }> = {
  0: { bg: "bg-solana-purple/15", text: "text-solana-purple", glow: "shadow-solana-purple/20" },
  1: { bg: "bg-solana-cyan/15", text: "text-solana-cyan", glow: "shadow-solana-cyan/20" },
  2: { bg: "bg-solana-green/15", text: "text-solana-green", glow: "shadow-solana-green/20" },
  3: { bg: "bg-amber-500/15", text: "text-amber-400", glow: "shadow-amber-400/20" },
};

function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-1.5 rounded-full transition-colors ${
            i <= level
              ? level === 1
                ? "bg-emerald-400"
                : level === 2
                  ? "bg-amber-400"
                  : "bg-red-400"
              : "bg-edge"
          }`}
        />
      ))}
    </div>
  );
}

export function CourseCard({
  course,
  index = 0,
}: {
  course: CourseAccount;
  index?: number;
}) {
  const t = useTranslations("courses");
  const totalXp = course.xpPerLesson * course.lessonCount;
  const track = TRACK_COLORS[course.trackId % 4] ?? TRACK_COLORS[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link href={`/courses/${course.courseId}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl border border-edge-soft bg-card p-px transition-all duration-300 hover:border-edge hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-black/40">
          {/* Gradient border shimmer on hover */}
          <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[conic-gradient(from_var(--angle),transparent_60%,#9945FF_80%,#00C2FF_90%,transparent_100%)] animate-[spin_4s_linear_infinite]" style={{ "--angle": "0deg" } as React.CSSProperties} />

          <div className="relative rounded-2xl bg-surface p-5">
            {/* Top row: track + difficulty + level */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`rounded-md ${track.bg} px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${track.text}`}>
                  {t("track")} {course.trackId}
                </span>
                <div className="flex items-center gap-1.5">
                  <DifficultyDots level={course.difficulty} />
                  <span className="text-[10px] uppercase tracking-wider text-content-muted">
                    {difficultyLabel(course.difficulty)}
                  </span>
                </div>
              </div>
              <span className="font-mono text-[10px] text-content-muted">
                Lv.{course.trackLevel}
              </span>
            </div>

            {/* Course title */}
            <h3 className="mb-3 text-[17px] font-bold leading-tight text-content-secondary transition-colors duration-200 group-hover:text-content">
              {course.courseId}
            </h3>

            {/* Stats grid */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-card px-2.5 py-2">
                <p className="font-mono text-sm font-bold text-content">{course.lessonCount}</p>
                <p className="text-[10px] uppercase tracking-wider text-content-muted">{t("lessons")}</p>
              </div>
              <div className="rounded-lg bg-card px-2.5 py-2">
                <p className="font-mono text-sm font-bold text-solana-green">{formatXp(totalXp)}</p>
                <p className="text-[10px] uppercase tracking-wider text-content-muted">{t("totalXp")}</p>
              </div>
              <div className="rounded-lg bg-card px-2.5 py-2">
                <p className="font-mono text-sm font-bold text-content-secondary">{course.totalEnrollments}</p>
                <p className="text-[10px] uppercase tracking-wider text-content-muted">{t("enrolled")}</p>
              </div>
            </div>

            {/* Prerequisite notice */}
            {course.prerequisite && (
              <div className="mb-3 flex items-center gap-1.5 rounded-md border border-amber-500/10 bg-amber-500/5 px-2.5 py-1.5">
                <svg className="h-3 w-3 text-amber-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V9a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-[11px] text-amber-400/70">{t("prerequisite")}</span>
              </div>
            )}

            {/* Footer: XP per lesson + arrow */}
            <div className="flex items-center justify-between border-t border-edge-soft pt-3">
              <span className="font-mono text-xs text-solana-cyan/80">
                +{course.xpPerLesson} {t("xpPerLesson")}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-medium text-content-muted transition-all duration-200 group-hover:gap-2 group-hover:text-solana-purple">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
