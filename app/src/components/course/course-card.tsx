"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Course } from "@/types";
import { BookOpen, Clock3, Layers, Users } from "lucide-react";
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
  const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);

  return (
    <Card className="group flex flex-col border-border bg-card transition-all hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="border-primary/20 bg-primary/8 text-xs capitalize text-primary">
            {course.difficulty}
          </Badge>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock3 className="size-3" />
            {course.durationHours}h
          </span>
        </div>
        <CardTitle className="mt-2 line-clamp-2 text-base text-foreground">{course.title}</CardTitle>
        <p className="line-clamp-1 text-sm text-muted-foreground">{course.subtitle}</p>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{course.description}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Layers className="size-3" />
            {course.modules.length} modules
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="size-3" />
            {totalLessons} lessons
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {course.enrolledCount.toLocaleString()} enrolled
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {course.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="border-border px-1.5 py-0 text-[10px] text-muted-foreground">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="gap-2 pt-0">
        <Button asChild variant="outline" size="sm" className="flex-1 border-border text-foreground">
          <Link href={`/courses/${course.slug}`}>View course</Link>
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-gradient-cta text-cta-foreground"
          disabled={enrolled || enrollPending}
          onClick={() => onEnroll?.(course.id)}
        >
          {enrolled ? "Enrolled" : "Enroll"}
        </Button>
      </CardFooter>
    </Card>
  );
}
