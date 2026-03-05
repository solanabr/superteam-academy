"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface CourseProgressProps {
  courseId: string;
  enrollmentData: {
    progressPercent: number;
    totalLessons: number;
    completedLessons: number;
  };
}

export function CourseProgress({ courseId, enrollmentData }: CourseProgressProps) {
  const t = useTranslations("DashboardWidgets");
  if (!enrollmentData) return null;

  const progressPercent = enrollmentData.progressPercent || 0;
  const completed = enrollmentData.completedLessons || 0;
  const total = enrollmentData.totalLessons || 1;
  const isCompleted = enrollmentData.progressPercent === 100;

  return (
    <Card className="border-border/60 bg-card/70 transition-all hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{courseId}</CardTitle>
          <span className="rounded-md bg-secondary px-2 py-1 text-sm font-medium">
            {t("lessonsCounter", { completed, total })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={enrollmentData.progressPercent} className="h-2" aria-label={t("progressAria", { courseId })} aria-valuenow={enrollmentData.progressPercent} />

        <div className="flex justify-between text-xs font-medium text-muted-foreground">
          <span>0%</span>
          {isCompleted ? (
            <span className="flex items-center gap-1 text-green-500"><CheckCircle2 className="h-3 w-3" /> {t("completed")}</span>
          ) : (
            <span>{progressPercent}%</span>
          )}
          <span>100%</span>
        </div>

        <Link href={`/courses/${courseId}`} className="block w-full">
          <Button className="w-full" variant={isCompleted ? "outline" : "secondary"}>
            {isCompleted ? t("reviewMaterial") : t("continueLearning")} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
