"use client";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { CaretLeft, CaretRight, ListBullets } from "@phosphor-icons/react";
import { useLessonCompletion } from "@/lib/hooks/use-lesson-completion";
import { useTranslations } from "next-intl";
import { LessonMarkdown } from "./lesson-markdown";
import type { ContentLesson } from "@/lib/data/types";
import type { LessonWithContext } from "@/lib/data/queries";
import type { Course } from "@/lib/data/types";

type Props = {
  course: Course;
  lesson: ContentLesson;
  lessonContext: LessonWithContext;
};

export function ContentLessonView({ course, lesson, lessonContext }: Props) {
  const t = useTranslations("lessonView");
  const { isComplete, markComplete, isMarkingComplete, connected, enrolled } =
    useLessonCompletion(course.id, course.totalLessons);
  const completed = isComplete(lessonContext.lessonIndex);
  const { prevLesson, nextLesson, moduleIndex, lessonIndexInModule } =
    lessonContext;
  const canMarkComplete =
    connected && enrolled && !completed && !isMarkingComplete;

  const handleMarkComplete = async () => {
    await markComplete(lessonContext.lessonIndex);
  };

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col overflow-hidden px-3 py-3 sm:px-5 sm:py-4">
      {/* Paper-style reading container */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-white shadow-md dark:bg-card dark:shadow-sm">
        {/* Header on paper */}
        <header className="shrink-0 border-b border-border bg-muted/40 px-6 py-4 sm:px-8">
          <p className="font-mono text-xs text-muted-foreground">
            {course.title} / Lesson {moduleIndex + 1}.{lessonIndexInModule}
          </p>
          <h1 className="mt-1 font-heading text-xl font-bold sm:text-2xl">
            {lesson.title}
          </h1>
        </header>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 sm:px-8 sm:py-8">
          {lesson.videoUrl && (
            <div className="mb-6 aspect-video overflow-hidden rounded-lg border border-border bg-muted">
              <video
                src={lesson.videoUrl}
                controls
                className="h-full w-full"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          <div className="mx-auto max-w-[65ch]">
            <LessonMarkdown content={lesson.body} />
          </div>
        </div>

        {/* Action footer on paper - single compact row */}
        <footer className="shrink-0 border-t border-border bg-muted/40 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 text-muted-foreground"
              >
                <Link
                  href={`/courses/${course.slug}#curriculum`}
                  className="inline-flex items-center gap-1.5"
                >
                  <ListBullets className="size-4" weight="bold" />
                  <span className="hidden sm:inline">Curriculum</span>
                </Link>
              </Button>
              <Button
                onClick={() => void handleMarkComplete()}
                disabled={!canMarkComplete}
                size="sm"
                className="h-8 bg-emerald-600 px-3 hover:bg-emerald-500"
              >
                {completed
                  ? "✓ Completed"
                  : isMarkingComplete
                    ? "Completing..."
                    : !connected
                      ? "Connect wallet"
                      : !enrolled
                        ? "Enroll first"
                        : t("markComplete")}
              </Button>
            </div>
            <nav
              aria-label="Lesson navigation"
              className="flex items-center gap-2"
            >
              {prevLesson ? (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 min-w-0 px-3"
                >
                  <Link
                    href={`/courses/${course.slug}/lessons/${prevLesson.id}?type=${prevLesson.type}`}
                    className="inline-flex items-center gap-1"
                  >
                    <CaretLeft className="size-4 shrink-0" weight="bold" />
                    <span className="hidden sm:inline truncate max-w-[120px]">
                      Prev
                    </span>
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 px-3"
                >
                  <CaretLeft className="size-4" weight="bold" />
                </Button>
              )}
              {nextLesson ? (
                <Button
                  variant="default"
                  size="sm"
                  asChild
                  className="h-8 min-w-0 px-3"
                >
                  <Link
                    href={`/courses/${course.slug}/lessons/${nextLesson.id}?type=${nextLesson.type}`}
                    className="inline-flex items-center gap-1"
                  >
                    <span className="hidden sm:inline truncate max-w-[120px]">
                      Next
                    </span>
                    <CaretRight className="size-4 shrink-0" weight="bold" />
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 px-3"
                >
                  <CaretRight className="size-4" weight="bold" />
                </Button>
              )}
            </nav>
          </div>
          {nextLesson && (
            <p className="mt-2 text-center text-xs text-muted-foreground sm:text-right">
              Next:{" "}
              <Link
                href={`/courses/${course.slug}/lessons/${nextLesson.id}?type=${nextLesson.type}`}
                className="hover:text-foreground hover:underline"
              >
                {nextLesson.title}
              </Link>
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}
