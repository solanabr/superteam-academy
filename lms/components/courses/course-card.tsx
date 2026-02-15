"use client";

import { Link } from "@/i18n/navigation";
import { Clock, BookOpen, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Course } from "@/types/course";
import { DIFFICULTY_CONFIG, TRACKS } from "@/types/course";

interface CourseCardProps {
  course: Course;
  progress?: number;
}

export function CourseCard({ course, progress }: CourseCardProps) {
  const t = useTranslations("courses");
  const tc = useTranslations("common");
  const difficulty = DIFFICULTY_CONFIG[course.difficulty];
  const track = TRACKS[course.trackId];

  return (
    <Link href={`/courses/${course.slug}`}>
      <Card className="group h-full cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
        <CardContent className="flex h-full flex-col p-5">
          <div className="flex items-start justify-between">
            <div className="flex gap-2">
              <Badge variant={course.difficulty as "beginner" | "intermediate" | "advanced"}>
                {difficulty.label}
              </Badge>
              {track && track.name !== "standalone" && (
                <Badge variant="outline" className="text-xs">
                  {track.display}
                </Badge>
              )}
            </div>
          </div>

          <h3 className="mt-3 text-lg font-semibold group-hover:text-solana-purple transition-colors line-clamp-2">
            {course.title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">
            {course.description}
          </p>

          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {course.duration}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {tc("lessons", { count: course.lessonCount })}
            </span>
            <span className="flex items-center gap-1 text-xp-gold">
              <Zap className="h-3.5 w-3.5" />
              {course.xpTotal} {tc("xp")}
            </span>
          </div>

          {progress !== undefined && progress > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{t("progress")}</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} indicatorClassName="bg-solana-green" />
            </div>
          )}

          {course.prerequisiteId && (
            <p className="mt-2 text-xs text-muted-foreground italic">
              {t("prerequisiteRequired")}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
