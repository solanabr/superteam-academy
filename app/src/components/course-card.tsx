"use client";

import Link from "next/link";
import type { Course } from "@/types";
import { useLocale } from "@/contexts/locale-context";
import { useLearning } from "@/contexts/learning-context";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Zap, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const DIFFICULTY_COLORS: Record<number, string> = {
  1: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  2: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  3: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const TRACK_COLORS: Record<number, string> = {
  1: "from-emerald-500 to-teal-500",
  2: "from-orange-500 to-red-500",
  3: "from-blue-500 to-indigo-500",
  4: "from-purple-500 to-pink-500",
  5: "from-cyan-500 to-blue-500",
  6: "from-red-500 to-rose-500",
};

const TRACK_ICONS: Record<number, string> = {
  1: "S",
  2: "R",
  3: "A",
  4: "D",
  5: "N",
  6: "X",
};

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const { t } = useLocale();
  const { getProgress } = useLearning();
  const progress = getProgress(course.id);

  const diffKey =
    course.difficulty === 1
      ? "filterBeginner"
      : course.difficulty === 2
        ? "filterIntermediate"
        : "filterAdvanced";

  const totalXp = course.lessonCount * course.xpPerLesson;
  const isCompleted = progress && progress.percentComplete === 100;
  const isEnrolled = !!progress;

  return (
    <Link href={`/courses/${course.slug}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
        {/* Thumbnail placeholder */}
        <div
          className={`relative h-36 bg-gradient-to-br ${TRACK_COLORS[course.trackId] || "from-gray-500 to-gray-600"} flex items-center justify-center`}
        >
          <span className="text-5xl font-black text-white/20">
            {TRACK_ICONS[course.trackId] || "?"}
          </span>
          <div className="absolute bottom-3 left-3 flex gap-2">
            <Badge className={DIFFICULTY_COLORS[course.difficulty]}>
              {t(`courses.${diffKey}`)}
            </Badge>
            {course.prerequisite === null && (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20"
              >
                {t("courses.free")}
              </Badge>
            )}
          </div>
          {isCompleted && (
            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-xs font-medium text-white">
              <CheckCircle className="h-3 w-3" />
              {t("courses.completed")}
            </div>
          )}
        </div>

        <CardHeader className="pb-2">
          <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.shortDescription}
          </p>
        </CardHeader>

        <CardContent className="pb-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {course.lessonCount} {t("courses.lessons")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {course.estimatedHours} {t("courses.hours")}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-secondary" />
              {t("courses.xpReward", { amount: totalXp })}
            </span>
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex-col items-stretch gap-2">
          {isEnrolled && !isCompleted && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {t("courses.progress", {
                    percent: Math.round(progress.percentComplete),
                  })}
                </span>
                <span>
                  {progress.completedLessons.length}/{progress.totalLessons}
                </span>
              </div>
              <Progress
                value={progress.percentComplete}
                className="h-1.5 bg-primary/10"
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {course.totalCompletions} {t("courses.students")}
            </div>
            <Button
              size="sm"
              variant={isEnrolled ? "default" : "outline"}
              className={
                isEnrolled
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : ""
              }
            >
              {isCompleted
                ? t("courses.viewCertificate")
                : isEnrolled
                  ? t("courses.continue")
                  : t("courses.enroll")}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
