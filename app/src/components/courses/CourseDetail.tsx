"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { BookOpen, Clock, Zap, Heart, FolderOpen, Users } from "lucide-react";
import { EnrollButton } from "./EnrollButton";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LessonProgressIcon, CourseProgressBar } from "./CourseProgress";
import { CourseReviews } from "./CourseReviews";
import { useBookmarkStore } from "@/stores/bookmark-store";
import { useProgressStore } from "@/stores/progress-store";
import type { SanityCourse, SanityLesson } from "@/lib/sanity/queries";
import { fetchCourse } from "@/lib/solana/queries";

interface CourseDetailProps {
  course: SanityCourse;
}

export function CourseDetail({ course }: CourseDetailProps) {
  const t = useTranslations("courses");
  const tc = useTranslations("common");
  const tb = useTranslations("bookmarks");
  const { toggleBookmark, isBookmarked } = useBookmarkStore();
  const isLessonComplete = useProgressStore((s) => s.isLessonComplete);
  const bookmarked = isBookmarked(course.slug);
  const courseId = course.onChainCourseId ?? "";
  const lessons = course.lessons ?? [];
  const modules = (course.modules ?? []).filter((m) => (m.lessons?.length ?? 0) > 0);
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0);

  useEffect(() => {
    if (!courseId) return;
    fetchCourse(courseId).then((onChainCourse) => {
      if (onChainCourse) {
        setEnrollmentCount(onChainCourse.totalEnrollments ?? 0);
      }
    }).catch(() => {
      // RPC unavailable — keep default 0
    });
  }, [courseId]);
  const totalXp = lessons.length * course.xpPerLesson;
  const totalMinutes = lessons.reduce((sum, l) => sum + (l.estimatedMinutes ?? 0), 0);
  const difficultyLabel =
    course.difficulty === 1
      ? t("filter.beginner")
      : course.difficulty === 2
        ? t("filter.intermediate")
        : t("filter.advanced");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {course.thumbnail?.asset?.url && (
        <div className="relative aspect-[3/1] overflow-hidden rounded-xl mb-8">
          <Image
            src={course.thumbnail.asset.url}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
            className="object-cover"
            priority
            placeholder="empty"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}
      <Breadcrumbs
        ariaLabel={tc("breadcrumb")}
        items={[
          { label: tc("courses"), href: "/courses" },
          { label: course.title },
        ]}
      />
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{difficultyLabel}</Badge>
              {(course.tags ?? []).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-lg text-muted-foreground">{course.description}</p>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              {lessons.length} {t("detail.lessonCount")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {totalMinutes} {tc("minutesShort")}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
              {totalXp} XP
            </span>
            {enrollmentCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" aria-hidden="true" />
                {enrollmentCount} {t("detail.enrollments")}
              </span>
            )}
          </div>

          <Separator />

          {/* Syllabus — grouped by module when available, flat list otherwise */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{t("detail.syllabus")}</h2>
            {modules.length > 0 ? (
              <Accordion type="multiple" defaultValue={modules.map((m) => m._id)} className="space-y-2">
                {modules.map((mod) => {
                  const modLessons: SanityLesson[] = mod.lessons ?? [];
                  const modMinutes = modLessons.reduce((s, l) => s + (l.estimatedMinutes ?? 0), 0);
                  return (
                    <AccordionItem
                      key={mod._id}
                      value={mod._id}
                      className="rounded-lg border border-border/50 px-4 [&:not(:last-child)]:mb-0"
                    >
                      <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="flex items-center gap-2 text-left">
                          <FolderOpen className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                          <span className="font-semibold">{mod.title}</span>
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            {modLessons.length} {t("detail.lessonCount")} · {modMinutes} {tc("minutesShort")}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        {mod.description && (
                          <p className="mb-3 text-sm text-muted-foreground">{mod.description}</p>
                        )}
                        <div className="space-y-2">
                          {modLessons.map((lesson, idx) => {
                            const complete = isLessonComplete(courseId, lesson.lessonIndex);
                            return (
                              <Link
                                key={lesson._id}
                                href={`/courses/${course.slug}/lessons/${lesson.slug}`}
                              >
                                <div className={`flex items-center gap-3 rounded-lg border border-border/30 p-4 transition-colors hover:border-primary/50 hover:bg-muted/30 border-l-2 ${complete ? "border-l-primary" : "border-l-transparent"}`}>
                                  <span className="w-6 shrink-0 text-center font-mono text-sm text-muted-foreground select-none">
                                    {String(idx + 1).padStart(2, "0")}
                                  </span>
                                  <LessonProgressIcon courseId={courseId} lessonIndex={lesson.lessonIndex} />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{lesson.title}</p>
                                    {(lesson.estimatedMinutes ?? 0) > 0 && (
                                      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                        <Clock className="h-3 w-3" aria-hidden="true" />
                                        {lesson.estimatedMinutes} {tc("minutesShort")}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant="secondary" className="text-xs shrink-0">
                                    +{course.xpPerLesson} XP
                                  </Badge>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            ) : (
              <div className="space-y-2">
                {lessons.map((lesson, idx) => {
                  const complete = isLessonComplete(courseId, lesson.lessonIndex);
                  return (
                    <Link
                      key={lesson._id}
                      href={`/courses/${course.slug}/lessons/${lesson.slug}`}
                    >
                      <div className={`flex items-center gap-3 rounded-lg border border-border/50 p-4 transition-colors hover:border-primary/50 hover:bg-muted/30 border-l-2 ${complete ? "border-l-primary" : "border-l-transparent"}`}>
                        <span className="w-6 shrink-0 text-center font-mono text-sm text-muted-foreground select-none">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <LessonProgressIcon courseId={courseId} lessonIndex={lesson.lessonIndex} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{lesson.title}</p>
                          {(lesson.estimatedMinutes ?? 0) > 0 && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {lesson.estimatedMinutes} {tc("minutesShort")}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          +{course.xpPerLesson} XP
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reviews */}
          <CourseReviews courseSlug={course.slug} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>{t("detail.about")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CourseProgressBar courseId={courseId} totalLessons={lessons.length} />

              {course.prerequisites && course.prerequisites.length > 0 && (
                <div className="space-y-2 border-t border-border pt-4">
                  <p className="text-sm font-medium">{t("detail.prerequisites")}</p>
                  <div className="flex flex-wrap gap-2">
                    {course.prerequisites.map((prereq) => (
                      <Link
                        key={prereq}
                        href={`/courses/${prereq}`}
                      >
                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                          {prereq}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <EnrollButton
                courseId={courseId}
                courseSlug={course.slug}
                prerequisiteCourseId={course.prerequisites?.[0]}
                disabled={!courseId}
              />

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => toggleBookmark(course.slug)}
                aria-label={bookmarked ? tb("removeBookmark") : tb("addBookmark")}
              >
                <Heart
                  className={`h-4 w-4 transition-colors ${bookmarked ? "fill-primary text-primary" : ""}`}
                  aria-hidden="true"
                />
                {bookmarked ? tb("saved") : tb("save")}
              </Button>

              {course.instructor && (
                <div className="space-y-2 border-t border-border pt-4">
                  <p className="text-sm font-medium">{t("detail.instructor")}</p>
                  <p className="text-sm">{course.instructor.name}</p>
                  <p className="text-xs text-muted-foreground">{course.instructor.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
