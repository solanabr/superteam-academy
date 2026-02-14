"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Clock, Zap, BarChart3, Users, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleList } from "@/components/courses/ModuleList";
import type { CmsCourse } from "@/lib/cms/types";
import { useI18n } from "@/lib/i18n/provider";

type CourseDetailPageProps = {
  params: {
    slug: string;
  };
};

const difficultyConfig = {
  beginner: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", label: "Beginner Friendly" },
  intermediate: { color: "bg-amber-500/10 text-amber-500 border-amber-500/20", label: "Intermediate" },
  advanced: { color: "bg-red-500/10 text-red-500 border-red-500/20", label: "Advanced" },
};

export default function CourseDetailPage({ params }: CourseDetailPageProps): JSX.Element {
  const { t } = useI18n();
  const [course, setCourse] = useState<CmsCourse | null>(null);

  useEffect(() => {
    const run = async () => {
      const response = await fetch(`/api/courses/${encodeURIComponent(params.slug)}`);
      if (!response.ok) {
        setCourse(null);
        return;
      }

      const json = (await response.json()) as { course: CmsCourse };
      setCourse(json.course);
    };

    void run();
  }, [params.slug]);

  if (!course) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const demoCompletedLessons = Math.floor(totalLessons * 0.35);
  const progressPercent = totalLessons > 0 ? Math.floor((demoCompletedLessons / totalLessons) * 100) : 0;
  const diff = difficultyConfig[course.difficulty];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      {/* Hero banner */}
      <section className="relative mb-8 overflow-hidden rounded-xl border">
        <div className="absolute inset-0 solana-gradient opacity-5" />
        <div className="relative flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-4">
            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${diff.color}`}>
                {diff.label}
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {course.topic}
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{course.title}</h1>
            <p className="text-base leading-relaxed text-muted-foreground">{course.description}</p>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {course.durationHours} hours
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {totalLessons} lessons
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4" />
                {course.modules.length} modules
              </span>
              <span className="inline-flex items-center gap-1.5 text-solana-green">
                <Zap className="h-4 w-4" />
                {course.xpReward} XP
              </span>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild className="h-11 rounded-full bg-solana-purple px-6 text-white hover:bg-solana-purple/90">
                <Link href={`/courses/${course.slug}/lessons/${demoCompletedLessons + 1}`}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {demoCompletedLessons > 0 ? t("common.continue") : t("courses.detail.enrollmentCta")}
                </Link>
              </Button>
            </div>
          </div>

          {/* Progress card (desktop sidebar) */}
          <div className="w-full shrink-0 lg:w-64">
            <Card className="border-0 bg-muted/30">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="font-medium">{t("courses.detail.progress")}</span>
                  <span className="font-bold text-solana-green">{progressPercent}%</span>
                </div>
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progressPercent}%`,
                      background: "linear-gradient(90deg, #9945FF, #14F195)",
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {demoCompletedLessons} of {totalLessons} lessons completed
                </p>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-background/50 p-2.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>1,247 learners enrolled</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("courses.detail.modules")}</h2>
          <span className="text-sm text-muted-foreground">
            {course.modules.length} modules &middot; {totalLessons} lessons
          </span>
        </div>
        <ModuleList course={course} completedLessons={demoCompletedLessons} />
      </section>
    </div>
  );
}
