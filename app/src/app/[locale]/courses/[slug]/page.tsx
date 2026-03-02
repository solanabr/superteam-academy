"use client";

import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { BookOpen, Clock, Zap, Users, Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { CourseSyllabus } from "@/components/course/course-syllabus";
import { EnrollmentButton } from "@/components/course/enrollment-button";
import { useCourse } from "@/hooks/use-courses";
import { useEnrollment } from "@/hooks/use-enrollment";
import { DIFFICULTY_LABELS, TRACK_LABELS, type Difficulty } from "@/types";

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = useLocale();
  const t = useTranslations("courses");

  const { data: course, isLoading: courseLoading } = useCourse(slug);
  const { data: enrollment, isLoading: enrollmentLoading } = useEnrollment(slug);

  if (courseLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg text-muted-foreground">{t("courseNotFound")}</p>
        <Link
          href={`/${locale}/courses`}
          className="text-primary hover:underline mt-4 inline-block"
        >
          {t("backToCatalog")}
        </Link>
      </div>
    );
  }

  const totalXp =
    course.lessonCount * course.xpPerLesson +
    Math.floor((course.lessonCount * course.xpPerLesson) / 2);

  const completedLessons = enrollment
    ? enrollment.lessonFlags.filter((f) => f > 0).length
    : 0;
  const progress = enrollment
    ? Math.round((completedLessons / course.lessonCount) * 100)
    : 0;
  const isCompleted = enrollment?.completedAt !== null && enrollment?.completedAt !== undefined;
  const isEnrolled = !!enrollment;

  const courseName = course.courseId
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const lessons = Array.from({ length: course.lessonCount }, (_, i) => ({
    index: i,
    title: `Lesson ${i + 1}`,
    type: i % 3 === 2 ? ("code_challenge" as const) : ("content" as const),
    estimatedMinutes: 20 + (i % 3) * 10,
  }));

  const completedIndices = enrollment
    ? enrollment.lessonFlags
        .map((_, i) => (enrollment.lessonFlags[i] ? i : -1))
        .filter((i) => i >= 0)
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href={`/${locale}/courses`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToCatalog")}
      </Link>

      {/* Hero */}
      <div className="rounded-2xl gradient-bg p-8 md:p-12 mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="bg-card/80">
            {TRACK_LABELS[course.trackId] || `Track ${course.trackId}`}
          </Badge>
          <Badge variant="outline" className="bg-card/80">
            {DIFFICULTY_LABELS[course.difficulty as Difficulty] || "Unknown"}
          </Badge>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{courseName}</h1>
        <p className="text-muted-foreground max-w-2xl mb-6">
          Learn {courseName.toLowerCase()} with hands-on projects and earn {totalXp} XP
          upon completion.
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-6 text-sm">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-superteam-purple" />
            {course.lessonCount} {t("lessons")}
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-superteam-green" />
            {totalXp} XP
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-superteam-blue" />
            {Math.ceil(course.lessonCount * 0.5)}h
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            {course.totalEnrollments} {t("enrolled")}
          </span>
          <span className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-superteam-orange" />
            {course.totalCompletions} {t("completions")}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Progress */}
          {isEnrolled && (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>{t("yourProgress")}</span>
                  <span className="text-muted-foreground">
                    {completedLessons}/{course.lessonCount} {t("lessons")}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>
          )}

          {/* Syllabus */}
          <Card>
            <CardContent className="p-6">
              <CourseSyllabus
                courseId={course.courseId}
                lessons={lessons}
                completedIndices={completedIndices}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <EnrollmentButton
                courseId={course.courseId}
                isEnrolled={isEnrolled}
                isCompleted={isCompleted}
                nextLessonSlug={String(completedLessons)}
              />

              <Separator />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("xpPerLesson")}</span>
                  <span>{course.xpPerLesson} XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("bonusXp")}</span>
                  <span>
                    {Math.floor((course.lessonCount * course.xpPerLesson) / 2)} XP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("totalXp")}</span>
                  <span className="font-semibold text-superteam-green">{totalXp} XP</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
