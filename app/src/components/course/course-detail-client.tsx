"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Users,
  Trophy,
  Code,
  Lock,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCourses } from "@/lib/hooks/use-courses";
import { useTracks } from "@/lib/hooks/use-tracks";
import { useDifficulties } from "@/lib/hooks/use-difficulties";
import { formatXP, difficultyStyle } from "@/lib/utils";
import { useLearningProgress } from "@/lib/hooks/use-learning-progress";
import { ModuleList, EnrollButton, ReviewsSection } from "@/components/course";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trackEvent } from "@/lib/analytics";

export interface CourseDetailClientProps {
  slug: string;
}

export default function CourseDetailClient({ slug }: CourseDetailClientProps) {
  const t = useTranslations("courses");
  const tc = useTranslations("common");
  const { getCourseBySlug, courses: allCourses } = useCourses();
  const maybeCourse = getCourseBySlug(slug);
  const { enrolledCourseIds, progressMap, enrollInCourse } =
    useLearningProgress();

  if (!maybeCourse) {
    notFound();
  }

  const course = maybeCourse;

  useEffect(() => {
    trackEvent({
      name: "course_viewed",
      params: { course_slug: course.slug, course_title: course.title },
    });
  }, [course.slug, course.title]);

  const tracks = useTracks();
  const difficulties = useDifficulties();
  const track = tracks[course.trackId];
  const diff = difficulties.find((d) => d.value === course.difficulty);
  const hasModules = course.modules.length > 0;

  const isEnrolled =
    enrolledCourseIds.includes(course.slug) ||
    enrolledCourseIds.includes(course.id);
  const courseProgress = progressMap[course.slug] || progressMap[course.id];
  const progressPct = courseProgress?.percentage ?? 0;
  const completedLessons = courseProgress?.completedLessons ?? [];

  const totalLessons = useMemo(
    () => course.modules.reduce((sum, m) => sum + m.lessons.length, 0),
    [course.modules],
  );

  const firstLessonId = course.modules[0]?.lessons[0]?.id;

  async function handleEnroll() {
    await enrollInCourse(course.slug, totalLessons || course.lessonCount, {
      courseTitle: course.title,
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/courses"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {tc("back")}
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Course Header */}
          <div>
            <div className="flex flex-wrap gap-2">
              <span
                className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={difficultyStyle(diff?.color ?? "#888")}
              >
                {diff?.label ?? course.difficulty}
              </span>
              {track && (
                <span
                  className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${track.color}15`,
                    color: track.color,
                  }}
                >
                  {track.display}
                </span>
              )}
            </div>

            <h1 className="mt-4 font-heading text-3xl font-bold sm:text-4xl">
              {course.title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {course.description}
            </p>

            {/* Meta */}
            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {t("catalog.lessonsCount", { count: course.lessonCount })}
              </div>
              <div className="flex items-center gap-1.5">
                <Code className="h-4 w-4" />
                {t("catalog.challengesCount", { count: course.challengeCount })}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {course.duration}
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {t("catalog.studentsCount", { count: course.totalEnrollments })}
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-xp" />
                <span className="font-medium text-xp">
                  {formatXP(course.xpTotal)} XP
                </span>
              </div>
              {course.creator && (
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span>{course.creator}</span>
                </div>
              )}
            </div>
          </div>

          {/* What You'll Learn */}
          {hasModules && (
            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-bold">
                What you&apos;ll learn
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {course.modules.slice(0, 8).map((m) => (
                  <li key={m.id} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {m.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tabs: Curriculum / Reviews */}
          <div className="mt-10">
            <Tabs defaultValue="curriculum">
              <TabsList>
                <TabsTrigger value="curriculum">
                  {t("detail.courseContent")}
                </TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="curriculum">
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    {course.lessonCount} lessons across{" "}
                    {hasModules ? course.modules.length : 1} module
                    {(hasModules ? course.modules.length : 1) !== 1 ? "s" : ""}
                  </p>
                  <div className="mt-4">
                    <ModuleList
                      modules={course.modules}
                      courseSlug={course.slug}
                      completedLessons={completedLessons}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <ReviewsSection courseSlug={course.slug} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Enroll Card */}
            <EnrollButton
              course={course}
              isEnrolled={isEnrolled}
              progressPct={progressPct}
              firstLessonId={firstLessonId}
              onEnroll={handleEnroll}
            />

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-heading text-sm font-semibold">
                  {t("detail.prerequisites")}
                </h3>
                <ul className="mt-3 space-y-2">
                  {course.prerequisites.map((prereq) => {
                    const prereqCourse = allCourses.find(
                      (c) => c.slug === prereq,
                    );
                    return (
                      <li key={prereq}>
                        <Link
                          href={`/courses/${prereq}`}
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          {prereqCourse?.title || prereq}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Tags */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-heading text-sm font-semibold">
                {t("detail.tags")}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {course.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
