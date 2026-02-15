"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Course, TRACKS } from "@/data/mock";
import { Users, BookOpen, Zap } from "lucide-react";
import { formatXP } from "@/lib/utils";

export function CourseCard({ course }: { course: Course }) {
  const track = TRACKS.find((t) => t.id === course.trackId);
  const difficultyVariant = course.difficulty as "beginner" | "intermediate" | "advanced";

  return (
    <Link href={`/course/${course.slug}`}>
      <Card className="group overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 h-full flex flex-col">
        <div
          className={`h-32 bg-gradient-to-br ${course.thumbnailGradient} relative overflow-hidden`}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <Badge variant={difficultyVariant}>
              {course.difficulty}
            </Badge>
            {track && (
              <Badge variant="outline" className="bg-black/30 border-white/20 text-white">
                {track.display}
              </Badge>
            )}
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 text-white text-xs font-medium">
            <Zap className="h-3 w-3 text-solana-green" />
            {formatXP(course.xpTotal)} XP
          </div>
        </div>

        <CardContent className="flex-1 pt-4">
          <h3 className="font-semibold text-base mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        </CardContent>

        <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {course.lessonCount} lessons
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {course.totalEnrollments.toLocaleString()}
            </span>
          </div>
          <span className="text-muted-foreground">by {course.creator}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
