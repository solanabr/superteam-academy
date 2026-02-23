"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Course } from "@/types";
import { Clock3, Layers } from "lucide-react";
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
  return (
    <Card className="group overflow-hidden border-white/10 bg-zinc-900/65 transition hover:-translate-y-1 hover:border-[#14F195]/35">
      <div className={`h-1.5 w-full bg-gradient-to-r ${course.gradient}`} />
      <CardHeader>
        <CardTitle className="text-lg text-zinc-100">{course.title}</CardTitle>
        <p className="text-sm text-zinc-400">{course.subtitle}</p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="secondary" className="bg-zinc-800 text-zinc-200">
            {course.difficulty}
          </Badge>
          {course.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="border-white/20 text-zinc-300">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm leading-relaxed text-zinc-300">{course.description}</p>
        <div className="mt-4 flex gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <Layers className="size-3.5" />
            {course.modules.length} {t("totalModules")}
          </span>
          <span className="flex items-center gap-1">
            <Clock3 className="size-3.5" />
            {course.durationHours} {t("duration")}
          </span>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button asChild variant="outline" className="flex-1 border-white/20 bg-transparent text-zinc-100">
          <Link href={`/courses/${course.slug}`}>{t("openCourse")}</Link>
        </Button>
        <Button
          className="flex-1 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black"
          disabled={enrolled || enrollPending}
          onClick={() => onEnroll?.(course.id)}
        >
          {enrolled ? t("enrolled") : t("enroll")}
        </Button>
      </CardFooter>
    </Card>
  );
}
