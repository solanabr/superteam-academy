import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02Icon,
  BookOpen01Icon,
  SourceCodeSquareIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { courseService, sanityCourseService } from "@/lib/services";
import type { Lesson } from "@/lib/services";
import { levelBadgeClasses } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

function lessonTypeIcon(type: Lesson["type"]) {
  switch (type) {
    case "reading":
      return BookOpen01Icon;
    case "coding":
      return SourceCodeSquareIcon;
    case "quiz":
      return CheckmarkCircle02Icon;
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [course, lessons] = await Promise.all([
    sanityCourseService.getCourse(slug),
    sanityCourseService.getLessons(slug),
  ]);

  if (!course) notFound();

  const t = await getTranslations();

  function lessonTypeLabel(type: Lesson["type"]) {
    switch (type) {
      case "reading":
        return t("courses.reading");
      case "coding":
        return t("courses.coding");
      case "quiz":
        return t("courses.quiz");
    }
  }

  return (
    <div className="py-4 mx-auto max-w-6xl">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/courses" className="transition-colors hover:text-foreground">
          {t("nav.courses")}
        </Link>
        <span>/</span>
        <span className="text-foreground">{course.title}</span>
      </div>

      {/* Course header */}
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="outline" className={`border-transparent ${levelBadgeClasses(course.level)}`}>{course.level}</Badge>
            <span className="text-xs text-muted-foreground">
              {t("courses.by", { creator: course.creator })}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {course.description}
          </p>
        </div>

        {/* Enrollment card */}
        <Card className="w-full shrink-0 lg:w-72">
          <CardHeader>
            <CardTitle className="text-base">{t("courses.courseOverview")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("courses.lessonsLabel")}</span>
                <span className="font-medium text-foreground">
                  {course.lessonCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("courses.totalXp")}</span>
                <span className="font-medium text-foreground">
                  {course.totalXp.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("courses.levelLabel")}</span>
                <span className="font-medium text-foreground">
                  {course.level}
                </span>
              </div>
              <Separator className="my-1" />
              <Button size="lg" className="w-full">
                {t("common.enrollNow")}
                <HugeiconsIcon
                  icon={ArrowRight02Icon}
                  size={14}
                  data-icon="inline-end"
                />
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {t("common.requiresWallet")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Syllabus */}
      <div>
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
          {t("courses.syllabus")}
        </h2>

        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("courses.syllabusComingSoon")}
          </p>
        ) : (
          <div className="flex flex-col">
            {lessons.map((lesson, i) => (
              <Link
                key={lesson.id}
                href={`/courses/${slug}/lessons/${lesson.id}`}
                className="group"
              >
                <div
                  className="animate-fade-in flex items-center gap-4 border-b border-border px-1 py-3.5 transition-colors hover:bg-muted/40"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Order number */}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                    {lesson.order}
                  </span>

                  {/* Lesson info */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="text-muted-foreground">
                      <HugeiconsIcon
                        icon={lessonTypeIcon(lesson.type)}
                        size={16}
                        strokeWidth={2}
                        color="currentColor"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary">
                        {lesson.title}
                      </span>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {lessonTypeLabel(lesson.type)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      +{lesson.xpReward} XP
                    </span>
                    <HugeiconsIcon
                      icon={ArrowRight02Icon}
                      size={14}
                      color="currentColor"
                      className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
