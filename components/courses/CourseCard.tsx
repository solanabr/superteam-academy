"use client";

import Link from "next/link";
import { Clock, BookOpen, Zap, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CmsCourse } from "@/lib/cms/types";
import { useI18n } from "@/lib/i18n/provider";

type CourseCardProps = {
  course: CmsCourse;
  progress?: number;
};

const difficultyConfig = {
  beginner: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  intermediate: { color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  advanced: { color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

const topicColors: Record<string, string> = {
  Core: "bg-blue-500/10 text-blue-400",
  Programs: "bg-purple-500/10 text-purple-400",
  DeFi: "bg-solana-green/10 text-solana-green",
  NFTs: "bg-pink-500/10 text-pink-400",
  Frontend: "bg-orange-500/10 text-orange-400",
};

export function CourseCard({ course, progress }: CourseCardProps): JSX.Element {
  const { t } = useI18n();
  const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const diff = difficultyConfig[course.difficulty];
  const topicColor = topicColors[course.topic] ?? "bg-muted text-muted-foreground";

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden transition-all hover:border-solana-purple/40 hover:shadow-lg hover:shadow-solana-purple/5">
      {/* Top gradient bar */}
      <div className="h-1 w-full solana-gradient opacity-60 transition-opacity group-hover:opacity-100" />

      <CardHeader className="pb-3">
        {/* Tags row */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${diff.color}`}>
            {t(`common.${course.difficulty}`)}
          </span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${topicColor}`}>
            {course.topic}
          </span>
        </div>
        <CardTitle className="text-lg leading-snug">{course.title}</CardTitle>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{course.description}</p>
      </CardHeader>

      <CardContent className="mt-auto flex flex-col gap-4">
        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {course.durationHours}h
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {lessonCount} {t("common.lessons").toLowerCase()}
          </span>
          <span className="inline-flex items-center gap-1.5 text-solana-green">
            <Zap className="h-3.5 w-3.5" />
            {course.xpReward} XP
          </span>
        </div>

        {/* Progress bar */}
        {typeof progress === "number" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("courses.detail.progress")}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-solana-green transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        <Button asChild className="group/btn w-full bg-solana-purple text-white hover:bg-solana-purple/90">
          <Link href={`/courses/${course.slug}`}>
            {t("common.enrollNow")}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
