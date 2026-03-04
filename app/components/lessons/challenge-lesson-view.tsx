"use client";

import { useState } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { useLessonCompletion } from "@/lib/hooks/use-lesson-completion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { LessonMarkdown } from "./lesson-markdown";
import { ChallengeEditorPanel } from "./challenge-editor-panel";
import type { ChallengeLesson } from "@/lib/data/types";
import type { LessonWithContext } from "@/lib/data/queries";
import type { Course } from "@/lib/data/types";

type Props = {
  course: Course;
  lesson: ChallengeLesson;
  lessonContext: LessonWithContext;
};

export function ChallengeLessonView({ course, lesson, lessonContext }: Props) {
  const t = useTranslations("lessonView");
  const { isComplete, markComplete, isMarkingComplete, connected, enrolled } =
    useLessonCompletion(course.id, course.totalLessons);
  const [allTestsPassed, setAllTestsPassed] = useState(false);
  const completed = isComplete(lessonContext.lessonIndex);
  const canProceed = lesson.language === "rust" || allTestsPassed;
  const canMarkComplete =
    canProceed && connected && enrolled && !completed && !isMarkingComplete;
  const { prevLesson, nextLesson, moduleIndex, lessonIndexInModule } =
    lessonContext;

  const handleMarkComplete = async () => {
    await markComplete(lessonContext.lessonIndex);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border">
      <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-1">
        {/* Left: Instructions — min 34% so text stays readable */}
        <ResizablePanel defaultSize="42%" minSize="34%" maxSize="58%">
          <div className="flex h-full min-w-0 flex-col bg-card">
            {/* Header */}
            <div className="shrink-0 border-b border-border px-4 py-3">
              <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
                {course.title} / Lesson {moduleIndex + 1}.{lessonIndexInModule}
              </p>
              <h1 className="mt-0.5 font-heading text-base font-bold leading-snug text-card-foreground">
                {lesson.title}
              </h1>
            </div>

            {/* Scrollable body — min-w-0 so flex doesn't overflow */}
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
              <div className="space-y-4 px-4 py-3 text-[13px] leading-relaxed text-card-foreground/90 break-words">
                <LessonMarkdown content={lesson.prompt} />

                <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
                  <p className="text-xs font-semibold text-primary">
                    Your Mission
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {lesson.language === "rust"
                      ? "Complete the challenge in the editor, then use Mark complete below (no in-browser tests for Rust)."
                      : "Complete the challenge in the editor and run tests to verify your solution."}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border px-4 py-2.5">
              <Button
                onClick={() => void handleMarkComplete()}
                disabled={!canMarkComplete}
                size="sm"
                className="w-full"
              >
                {completed
                  ? "Completed"
                  : isMarkingComplete
                    ? "Completing..."
                    : !connected
                      ? "Connect wallet"
                      : !enrolled
                        ? "Enroll first"
                        : t("markComplete")}
              </Button>

              <div className="mt-2.5 flex items-center justify-between gap-2">
                {prevLesson ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-7 max-w-[48%] px-2 text-xs text-muted-foreground"
                  >
                    <Link
                      href={`/courses/${course.slug}/lessons/${prevLesson.id}?type=${prevLesson.type}`}
                    >
                      <CaretLeft
                        className="mr-0.5 size-3.5 shrink-0"
                        weight="bold"
                      />
                      <span className="truncate">{prevLesson.title}</span>
                    </Link>
                  </Button>
                ) : (
                  <span />
                )}
                {nextLesson ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-7 max-w-[48%] px-2 text-xs text-muted-foreground"
                  >
                    <Link
                      href={`/courses/${course.slug}/lessons/${nextLesson.id}?type=${nextLesson.type}`}
                    >
                      <span className="truncate">{nextLesson.title}</span>
                      <CaretRight
                        className="ml-0.5 size-3.5 shrink-0"
                        weight="bold"
                      />
                    </Link>
                  </Button>
                ) : (
                  <span />
                )}
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Editor */}
        <ResizablePanel defaultSize="58%" minSize="42%">
          <ChallengeEditorPanel
            lesson={lesson}
            onAllTestsPass={() => setAllTestsPassed(true)}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
