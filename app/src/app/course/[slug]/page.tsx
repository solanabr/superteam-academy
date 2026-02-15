"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { COURSES, TRACKS } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LessonList } from "@/components/course/lesson-list";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  Zap,
  Trophy,
  CheckCircle2,
  User,
} from "lucide-react";
import { formatXP, shortenAddress } from "@/lib/utils";

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const course = COURSES.find((c) => c.slug === slug);

  if (!course) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Course not found</h1>
        <p className="text-muted-foreground mt-2">
          The course &quot;{slug}&quot; does not exist.
        </p>
        <Link href="/courses">
          <Button className="mt-4">Back to Courses</Button>
        </Link>
      </div>
    );
  }

  const track = TRACKS.find((t) => t.id === course.trackId);
  const totalMinutes = course.lessons.reduce(
    (sum, l) => sum + l.estimatedMinutes,
    0
  );
  const completionRate = Math.round(
    (course.totalCompletions / course.totalEnrollments) * 100
  );

  // Mock enrollment state: simulate 3 completed lessons
  const completedLessons = [0, 1, 2];
  const progressPercent = Math.round(
    (completedLessons.length / course.lessonCount) * 100
  );

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <Link
        href="/courses"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </Link>

      <div className="grid lg:grid-cols-[1fr_340px] gap-8">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Course Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant={course.difficulty as "beginner" | "intermediate" | "advanced"}>
                {course.difficulty}
              </Badge>
              {track && (
                <Badge variant="outline">{track.display}</Badge>
              )}
              {course.trackLevel > 0 && (
                <Badge variant="secondary">
                  Level {course.trackLevel}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground mt-3 text-lg">
              {course.description}
            </p>
          </div>

          {/* Progress */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Your Progress</span>
                <span className="text-sm text-muted-foreground">
                  {completedLessons.length}/{course.lessonCount} lessons
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {progressPercent}% complete
                </span>
                <span className="text-xs text-solana-green font-medium">
                  {formatXP(
                    course.lessons
                      .filter((l) => completedLessons.includes(l.index))
                      .reduce((s, l) => s + l.xpReward, 0)
                  )}{" "}
                  / {formatXP(course.xpTotal)} XP
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Lesson List */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Lessons
            </h2>
            <LessonList
              lessons={course.lessons}
              courseSlug={course.slug}
              completedLessons={completedLessons}
              currentLesson={completedLessons.length}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Button className="w-full" size="lg">
                Continue Learning
              </Button>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4 text-solana-green" />
                    Total XP
                  </span>
                  <span className="font-semibold">{formatXP(course.xpTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    Lessons
                  </span>
                  <span className="font-semibold">{course.lessonCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Duration
                  </span>
                  <span className="font-semibold">
                    ~{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Enrolled
                  </span>
                  <span className="font-semibold">
                    {course.totalEnrollments.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    Completion Rate
                  </span>
                  <span className="font-semibold">{completionRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Creator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{course.creator}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {shortenAddress(course.creatorAddress, 6)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                Credential
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-gradient-to-br from-solana-purple/10 to-solana-green/10 border border-primary/20 text-center">
                <div className="text-sm font-medium">
                  {track?.display || "Standalone"} -{" "}
                  {course.difficulty.charAt(0).toUpperCase() +
                    course.difficulty.slice(1)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ZK compressed credential on Solana
                </p>
                <p className="text-xs text-muted-foreground">
                  Issued on completion
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
