"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Course } from "@/lib/content/courses";
import { useI18n } from "@/lib/i18n/provider";

type CourseCardProps = {
  course: Course;
};

export function CourseCard({ course }: CourseCardProps): JSX.Element {
  const { t } = useI18n();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{course.title}</CardTitle>
        <CardDescription>{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <span>{t("courses.difficultyLabel")}</span>
          <span className="text-right">{course.difficulty}</span>
          <span>{t("courses.durationLabel")}</span>
          <span className="text-right">{course.durationHours}h</span>
          <span>{t("common.lessons")}</span>
          <span className="text-right">{course.totalLessons}</span>
        </div>
        <Button asChild className="mt-auto w-full">
          <Link href={`/courses/${course.slug}`}>{t("common.enrollNow")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
