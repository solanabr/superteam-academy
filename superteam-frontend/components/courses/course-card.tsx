"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Clock, Users, Star, Zap, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { CourseCardData } from "@/lib/course-catalog";

const difficultyColor = {
  Beginner: "border-primary text-primary",
  Intermediate: "border-[hsl(var(--gold))] text-[hsl(var(--gold))]",
  Advanced: "border-destructive text-destructive",
};

export function CourseCard({ course }: { course: CourseCardData }) {
  const t = useTranslations("catalog");
  return (
    <Link href={`/courses/${course.slug}`}>
      <div className="group h-full rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 overflow-hidden">
        {/* Thumbnail area */}
        <div className="relative h-36 bg-secondary flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <BookOpen className="h-10 w-10 text-primary/30" />
          <Badge
            variant="outline"
            className={`absolute top-3 right-3 text-[10px] ${difficultyColor[course.difficulty]}`}
          >
            {course.difficulty}
          </Badge>
          {course.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0">
              <Progress
                value={course.progress}
                className="h-1 rounded-none bg-secondary [&>div]:bg-primary"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {course.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] bg-secondary text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>

          <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
            {course.description}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {course.duration}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {course.lessons} {t("lessons")}
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-[hsl(var(--gold))]" />
              {course.rating}
            </span>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {course.instructorAvatar}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {course.instructor}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-primary font-medium">{course.xp} XP</span>
            </div>
          </div>

          {/* Progress text */}
          {course.progress > 0 && (
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("progress")}</span>
              <span className="font-medium text-primary">
                {course.progress}%
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
