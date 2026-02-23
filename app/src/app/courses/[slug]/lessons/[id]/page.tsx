"use client";

import { LessonContent } from "@/components/course/lesson-content";
import { useUserStore } from "@/lib/store/user-store";
import { learningProgressService } from "@/lib/services/learning-progress";
import { mockCourses } from "@/lib/data/mock-courses";
import { XP_PER_LESSON } from "@/lib/solana/constants";
import { notFound } from "next/navigation";

export default function LessonPage({ params }: { params: { slug: string; id: string } }) {
  const profile = useUserStore((state) => state.profile);
  const completeLesson = useUserStore((state) => state.completeLesson);
  const addXp = useUserStore((state) => state.addXp);
  const completedLessons = useUserStore((state) => state.completedLessons);

  const course = mockCourses.find((item) => item.slug === params.slug);
  const lesson = course?.modules.flatMap((module) => module.lessons).find((item) => item.id === params.id);

  if (!course || !lesson) {
    notFound();
  }

  const isCompleted = completedLessons[course.id]?.includes(lesson.id) ?? false;

  return (
    <LessonContent
      lesson={lesson}
      completed={isCompleted}
      onComplete={async () => {
        await learningProgressService.completeLesson(profile.id, course.id, lesson.id);
        completeLesson(course.id, lesson.id);
        addXp(XP_PER_LESSON);
      }}
    />
  );
}
