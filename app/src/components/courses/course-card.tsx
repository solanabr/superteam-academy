"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Clock, BookOpen, Star } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDuration, formatXP } from "@/lib/utils";
import type { Course } from "@/types";

interface CourseCardProps {
  course: Course;
  progress?: number;
}

export function CourseCard({ course, progress }: CourseCardProps) {
  const t = useTranslations("courses.card");
  const tTracks = useTranslations("courses.tracks");

  const isEnrolled = progress !== undefined && progress > 0;
  const isCompleted = progress === 100;

  return (
    <Link href={`/courses/${course.slug}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <BookOpen className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <Badge variant={course.difficulty} className="shadow-sm">
              {course.difficulty}
            </Badge>
          </div>
          <div className="absolute right-3 top-3">
            <Badge variant={course.track as "fundamentals" | "defi" | "nft" | "gaming" | "infrastructure" | "security"} className="shadow-sm">
              {tTracks(course.track)}
            </Badge>
          </div>
        </div>

        <CardHeader className="pb-2">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        </CardHeader>

        <CardContent className="pb-2">
          {/* Instructor */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={course.instructor.avatar} />
              <AvatarFallback className="text-xs">
                {course.instructor.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {course.instructor.name}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{course.lessonCount} lessons</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(course.durationMinutes)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span>4.9</span>
            </div>
          </div>

          {/* Progress */}
          {isEnrolled && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  {t("progress", { percent: progress })}
                </span>
                <span className="font-medium">{formatXP(course.xpReward)} XP</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-2">
          <Button
            variant={isCompleted ? "outline" : isEnrolled ? "default" : "secondary"}
            className="w-full"
          >
            {isCompleted
              ? t("completed")
              : isEnrolled
              ? t("enrolled")
              : `${t("enroll")} · ${formatXP(course.xpReward)} XP`}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
