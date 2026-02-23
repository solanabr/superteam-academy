"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Course } from "@/types";
import { BookOpen, Clock3, Layers, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface CourseCardProps {
  course: Course;
  enrolled?: boolean;
  onEnroll?: (courseId: string) => Promise<void> | void;
  enrollPending?: boolean;
}

export function CourseCard({
  course,
  enrolled = false,
  onEnroll,
  enrollPending = false,
}: CourseCardProps) {
  const t = useTranslations("Courses");
  const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);

  return (
    <Card className="group overflow-hidden border-border bg-card transition hover:-translate-y-1 hover:border-[#ffd23f]/35">
      <div className={`h-24 w-full bg-gradient-to-r ${course.gradient} p-4`}>
        <p className="text-xs uppercase tracking-wide text-st-dark/75">{course.difficulty}</p>
        <h3 className="mt-1 text-lg font-semibold text-st-dark">{course.title}</h3>
      </div>
      <CardHeader>
        <CardTitle className="text-base text-foreground">{course.subtitle}</CardTitle>
        <div className="flex flex-wrap gap-2 pt-1">
          {course.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="border-border text-muted-foreground">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{course.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Layers className="size-3.5" />
            {course.modules.length} {t("totalModules")}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="size-3.5" />
            {totalLessons} {t("totalLessons")}
          </span>
          <span className="flex items-center gap-1">
            <Clock3 className="size-3.5" />
            {course.durationHours} {t("duration")}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {course.enrolledCount.toLocaleString()}
          </span>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button asChild variant="outline" className="flex-1 border-border bg-transparent text-foreground">
          <Link href={`/courses/${course.slug}`}>{t("openCourse")}</Link>
        </Button>
        <Button
          className="flex-1 bg-gradient-to-r from-[#2f6b3f] to-[#ffd23f] text-st-dark"
          disabled={enrolled || enrollPending}
          onClick={() => onEnroll?.(course.id)}
        >
          {enrolled ? t("enrolled") : t("enroll")}
        </Button>
      </CardFooter>
    </Card>
  );
}
