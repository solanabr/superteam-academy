"use client";

import { useState, useCallback } from "react";
import { Clock, List } from "lucide-react";
import { LessonSidebar } from "./lesson-sidebar";
import { LessonNavigation } from "./lesson-navigation";
import { LessonProgress } from "./lesson-progress";
import { MarkdownContent, generateContentPlaceholder } from "./markdown-content";
import { LessonDiscussion } from "@/components/discussions/lesson-discussion";
import type { Course, Lesson, LessonNavItem } from "@/types";

export interface LessonContentProps {
  lesson: Lesson;
  course: Course;
  prevLesson: LessonNavItem | null;
  nextLesson: LessonNavItem | null;
  onComplete: () => Promise<void>;
  initialCompleted: boolean;
  onChainSig?: string | null;
}

export function LessonContent({
  lesson,
  course,
  prevLesson,
  nextLesson,
  onComplete,
  initialCompleted,
  onChainSig,
}: LessonContentProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [showSidebar, setShowSidebar] = useState(false);
  const [xpAnimating, setXpAnimating] = useState(false);

  const handleMarkComplete = useCallback(async () => {
    setCompleted(true);
    setXpAnimating(true);
    setTimeout(() => setXpAnimating(false), 1000);
    await onComplete();
  }, [onComplete]);

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {showSidebar && (
        <LessonSidebar
          course={course}
          currentLessonId={lesson.id}
          onClose={() => setShowSidebar(false)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
            <div className="mb-6 flex items-center gap-2">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <List className="h-3.5 w-3.5" />
                Modules
              </button>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {lesson.duration}
              </div>
            </div>

            <h1 className="font-heading text-3xl font-bold">{lesson.title}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{lesson.description}</p>

            <div className="mt-10">
              <MarkdownContent content={lesson.content || generateContentPlaceholder(lesson)} />
            </div>

            <div className="mt-12 border-t border-border pt-10">
              <LessonDiscussion lessonId={lesson.id} courseId={course.id} />
            </div>
          </div>
        </div>

        <LessonNavigation
          courseSlug={course.slug}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
        >
          <LessonProgress
            completed={completed}
            xpReward={lesson.xpReward}
            xpAnimating={xpAnimating}
            onMarkComplete={handleMarkComplete}
            onChainSig={onChainSig}
          />
        </LessonNavigation>
      </div>
    </div>
  );
}
