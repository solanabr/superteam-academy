"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const lesson = useMemo<CmsLesson | null>(() => {
    if (!course || Number.isNaN(lessonId)) {
      return null;
    }

    const flattened = course.modules.flatMap((module) => module.lessons);
    return flattened[lessonId - 1] ?? null;
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
      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm text-muted-foreground">Lesson not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 lg:grid-cols-2">
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("lesson.contentTitle")} #{lessonId}
            </CardTitle>
            <CardDescription>{lesson.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{lesson.content}</p>
            <p>{lesson.challengePrompt ?? t("lesson.introLine2")}</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <ChallengePanel />
      </section>
    </div>
  );
}
