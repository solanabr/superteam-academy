"use client";

import Link from "next/link";

interface LessonNavProps {
  courseId: string;
  lessonIndex: number;
  totalLessons: number;
  isComplete: boolean;
}

export function LessonNav({ courseId, lessonIndex, totalLessons, isComplete }: LessonNavProps) {
  const hasPrev = lessonIndex > 0;
  const hasNext = lessonIndex < totalLessons - 1;

  return (
    <div className="flex items-center justify-between border-t border-edge pt-6">
      {hasPrev ? (
        <Link
          href={`/courses/${courseId}/lessons/${lessonIndex - 1}`}
          className="rounded-lg border border-edge px-4 py-2 text-sm text-content-secondary hover:text-content"
        >
          &larr; Lesson {lessonIndex}
        </Link>
      ) : (
        <div />
      )}

      <Link
        href={`/courses/${courseId}`}
        className="text-xs text-content-muted hover:text-content-secondary"
      >
        Back to Course
      </Link>

      {hasNext ? (
        <Link
          href={`/courses/${courseId}/lessons/${lessonIndex + 1}`}
          className={`rounded-lg px-4 py-2 text-sm ${
            isComplete
              ? "bg-solana-gradient text-white hover:opacity-90"
              : "border border-edge text-content-secondary hover:text-content"
          }`}
        >
          Lesson {lessonIndex + 2} &rarr;
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
