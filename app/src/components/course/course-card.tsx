"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { BookOpen, Clock, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DIFFICULTY_LABELS, TRACK_LABELS, type Difficulty } from "@/types";
import type { CourseData } from "@/lib/services/types";

const DIFFICULTY_COLORS: Record<number, string> = {
  1: "bg-green-500/10 text-green-500 border-green-500/20",
  2: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  3: "bg-red-500/10 text-red-500 border-red-500/20",
};

interface CourseCardProps {
  course: CourseData;
  progress?: number;
}

export function CourseCard({ course, progress }: CourseCardProps) {
  const locale = useLocale();
  const totalXp =
    course.lessonCount * course.xpPerLesson +
    Math.floor((course.lessonCount * course.xpPerLesson) / 2);

  return (
    <Link href={`/${locale}/courses/${course.courseId}`}>
      <Card className="group h-full overflow-hidden border-border/40 bg-card hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
        <div className="h-40 bg-gradient-to-br from-superteam-purple/20 via-superteam-blue/10 to-superteam-green/20 relative">
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant="outline" className="bg-card/80 backdrop-blur-sm text-xs">
              {TRACK_LABELS[course.trackId] || `Track ${course.trackId}`}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${DIFFICULTY_COLORS[course.difficulty] || ""}`}
            >
              {DIFFICULTY_LABELS[course.difficulty as Difficulty] || "Unknown"}
            </Badge>
          </div>
        </div>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {course.courseId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </h3>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {course.lessonCount} lessons
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-superteam-green" />
              {totalXp} XP
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {Math.ceil(course.lessonCount * 0.5)}h
            </span>
          </div>

          {progress !== undefined && progress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
