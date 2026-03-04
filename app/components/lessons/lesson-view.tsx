"use client";

import dynamic from "next/dynamic";
import { ContentLessonView } from "./content-lesson-view";
import type { ChallengeLesson } from "@/lib/data/types";
import type { Course } from "@/lib/data/types";
import type { LessonWithContext } from "@/lib/data/queries";

const ChallengeLessonView = dynamic<{
  course: Course;
  lesson: ChallengeLesson;
  lessonContext: LessonWithContext;
}>(
  () =>
    import("./challenge-lesson-view").then((m) => ({
      default: m.ChallengeLessonView,
    })),
  { ssr: false },
);

type Props = {
  course: Course;
  lessonContext: LessonWithContext;
};

export function LessonView({ course, lessonContext }: Props) {
  const { lesson } = lessonContext;

  return (
    <>
      {lesson.type === "content" ? (
        <div className="flex h-full min-h-0 flex-col">
          <ContentLessonView
            course={course}
            lesson={lesson}
            lessonContext={lessonContext}
          />
        </div>
      ) : (
        <ChallengeLessonView
          course={course}
          lesson={lesson}
          lessonContext={lessonContext}
        />
      )}
    </>
  );
}
