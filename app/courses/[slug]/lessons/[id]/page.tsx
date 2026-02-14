"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChallengePanel } from "@/components/editor/ChallengePanel";
import type { CmsCourse, CmsLesson } from "@/lib/cms/types";
import { useI18n } from "@/lib/i18n/provider";

type LessonPageProps = {
  params: {
    slug: string;
    id: string;
  };
};

export default function LessonPage({ params }: LessonPageProps): JSX.Element {
  const { t } = useI18n();
  const [course, setCourse] = useState<CmsCourse | null>(null);
  const lessonId = Number(params.id);

  const allLessons = useMemo(() => {
    if (!course) return [];
    return course.modules.flatMap((m) => m.lessons);
  }, [course]);

  const lesson = useMemo<CmsLesson | null>(() => {
    if (!course || Number.isNaN(lessonId)) return null;
    return allLessons[lessonId - 1] ?? null;
  }, [course, lessonId, allLessons]);

  const moduleName = useMemo(() => {
    if (!course) return "";
    let count = 0;
    for (const mod of course.modules) {
      count += mod.lessons.length;
      if (lessonId <= count) return mod.title;
    }
    return "";
  }, [course, lessonId]);

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

  if (!course || !lesson || Number.isNaN(lessonId) || lessonId <= 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Loading lesson...</p>
      </div>
    );
  }

  const totalLessons = allLessons.length;
  const hasPrev = lessonId > 1;
  const hasNext = lessonId < totalLessons;
  const progressPercent = Math.floor((lessonId / totalLessons) * 100);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      {/* Top bar: breadcrumb + progress */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/courses" className="hover:text-foreground transition-colors">
            {t("header.courses")}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/courses/${params.slug}`} className="hover:text-foreground transition-colors truncate max-w-[140px]">
            {course.title}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium truncate max-w-[180px]">
            {lesson.title}
          </span>
        </nav>

        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {lessonId}/{totalLessons}
          </span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progressPercent}%`,
                background: "linear-gradient(90deg, #9945FF, #14F195)",
              }}
            />
          </div>
          <span className="text-xs font-medium text-solana-green">{progressPercent}%</span>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: lesson content */}
        <section className="space-y-4">
          <Card>
            {/* Lesson header */}
            <div className="border-b p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-solana-purple/10 px-2.5 py-0.5 text-[10px] font-medium text-solana-purple">
                  <BookOpen className="h-3 w-3" />
                  {moduleName}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  ~10 min
                </span>
                {lesson.challengePrompt && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-solana-green/10 px-2.5 py-0.5 text-[10px] font-medium text-solana-green">
                    <Zap className="h-3 w-3" />
                    +50 XP
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold">{lesson.title}</h1>
            </div>

            {/* Content body */}
            <CardContent className="p-5">
              <div className="prose-sm space-y-4 text-sm leading-relaxed text-muted-foreground">
                {lesson.content.split("\n\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between gap-3">
            {hasPrev ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/courses/${params.slug}/lessons/${lessonId - 1}`}>
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Previous
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={`/courses/${params.slug}`}>
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back to course
                </Link>
              </Button>
            )}

            {hasNext ? (
              <Button asChild size="sm" className="bg-solana-purple text-white hover:bg-solana-purple/90">
                <Link href={`/courses/${params.slug}/lessons/${lessonId + 1}`}>
                  Next lesson
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-solana-green text-black hover:bg-solana-green/90">
                <Link href={`/courses/${params.slug}`}>
                  Complete course
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </section>

        {/* Right: challenge panel */}
        <section className="lg:sticky lg:top-20 lg:self-start">
          <ChallengePanel challengePrompt={lesson.challengePrompt} />
        </section>
      </div>
    </div>
  );
}
