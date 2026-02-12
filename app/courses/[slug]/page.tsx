"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleList } from "@/components/courses/ModuleList";
import { XPBar } from "@/components/gamification/XPBar";
import type { CmsCourse } from "@/lib/cms/types";
import { useI18n } from "@/lib/i18n/provider";

type CourseDetailPageProps = {
  params: {
    slug: string;
  };
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

  const totalLessons = course
    ? course.modules.reduce((sum, module) => sum + module.lessons.length, 0)
    : 0;

  if (!course) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm text-muted-foreground">Course not found.</p>
      </div>
    );
  }
  const demoCompletedLessons = Math.floor(totalLessons * 0.35);

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("courses.detail.progress")}</CardTitle>
            <CardDescription>
              {demoCompletedLessons} / {totalLessons} {t("common.lessons")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <XPBar value={demoCompletedLessons} max={totalLessons} />
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">{t("courses.detail.modules")}</h2>
          <ModuleList course={course} />
        </div>
      </section>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("courses.detail.overview")}</CardTitle>
            <CardDescription>{course.topic}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {course.durationHours}h · {course.xpReward} XP
            </p>
            <Button className="w-full">{t("courses.detail.enrollmentCta")}</Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/courses/${course.slug}/lessons/1`}>{t("common.continue")}</Link>
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
