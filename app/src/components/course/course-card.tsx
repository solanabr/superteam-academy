"use client";

import Link from "next/link";
import type { Course, Progress } from "@/types";
import { useLocale } from "@/contexts/locale-context";
import { DifficultyBadge } from "@/components/common/difficulty-badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Zap, Users } from "lucide-react";

interface CourseCardProps {
  course: Course;
  progress?: Progress | null;
}

export function CourseCard({ course, progress }: CourseCardProps) {
  const { t } = useLocale();
  const totalXp = course.xpPerLesson * course.lessonCount;
  const percentComplete = progress?.percentComplete ?? 0;
  const isEnrolled = !!progress;
  const isCompleted = progress?.completedAt !== null && progress?.completedAt !== undefined;

  return (
    <Link href={`/courses/${course.slug}`}>
      <Card className="group h-full overflow-hidden border-border/40 transition-all hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5">
        {/* Thumbnail placeholder */}
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-violet-500/40 transition-transform group-hover:scale-110" />
          </div>
          <div className="absolute left-3 top-3">
            <DifficultyBadge difficulty={course.difficulty} />
          </div>
          {isCompleted && (
            <div className="absolute right-3 top-3">
              <Badge className="bg-emerald-500 text-white">
                {t("courses.completed")}
              </Badge>
            </div>
          )}
        </div>

        <CardHeader className="pb-2">
          <h3 className="line-clamp-1 text-lg font-semibold group-hover:text-violet-500">
            {course.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {course.shortDescription}
          </p>
        </CardHeader>

        <CardContent className="pb-2">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {course.lessonCount} {t("courses.lessons")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {course.estimatedHours} {t("courses.hours")}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-violet-500" />
              {t("courses.xpReward", { amount: totalXp })}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {course.totalCompletions} {t("courses.students")}
            </span>
          </div>

          {isEnrolled && !isCompleted && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {t("courses.progress", {
                    percent: Math.round(percentComplete),
                  })}
                </span>
              </div>
              <ProgressBar
                value={percentComplete}
                className="h-1.5"
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-2">
          <div className="flex w-full items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {t("courses.free")}
            </Badge>
            {isEnrolled && !isCompleted && (
              <span className="text-xs font-medium text-violet-500">
                {t("courses.continue")} &rarr;
              </span>
            )}
            {!isEnrolled && (
              <span className="text-xs font-medium text-violet-500">
                {t("courses.enroll")} &rarr;
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
