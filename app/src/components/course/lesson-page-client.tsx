"use client";

import { useMemo, useCallback } from "react";
import { notFound } from "next/navigation";
import { useCourses } from "@/lib/hooks/use-courses";
import { getLevel } from "@/lib/utils";
import { useLearningProgress } from "@/lib/hooks/use-learning-progress";
import { useXPNotification } from "@/components/gamification/xp-notification";
import { useGamification } from "@/lib/hooks/use-gamification";
import dynamic from "next/dynamic";

const CelebrationModal = dynamic(
  () =>
    import("@/components/gamification/celebration-modal").then(
      (mod) => mod.CelebrationModal
    ),
  { ssr: false }
);
import { LessonHeader } from "@/components/course/lesson-header";
import { LessonContent } from "@/components/course/lesson-content";
import { CodeChallenge } from "@/components/course/code-challenge";
import type { Module, FlattenedLesson } from "@/types";

function flattenLessons(modules: Module[]): FlattenedLesson[] {
  const result: FlattenedLesson[] = [];
  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      result.push({ lesson, moduleTitle: mod.title, moduleIndex: mod.order });
    }
  }
  return result;
}

export interface LessonPageClientProps {
  slug: string;
  lessonId: string;
}

export default function LessonPageClient({ slug, lessonId }: LessonPageClientProps) {
  const { getCourseBySlug } = useCourses();
  const course = getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const allLessons = useMemo(() => flattenLessons(course.modules), [course.modules]);
  const currentIndex = allLessons.findIndex((item) => item.lesson.id === lessonId);

  if (currentIndex === -1) {
    notFound();
  }

  const { lesson, moduleTitle, moduleIndex } = allLessons[currentIndex];
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const isChallenge = lesson.type === "challenge" && lesson.challenge != null;

  const { completeLesson, progressMap, xp, onChainLessonSig } = useLearningProgress();
  const { showXPGain, showLevelUp } = useXPNotification();
  const {
    recordCombo, addDailyXP, completeQuestProgress, triggerCelebration, dailyGoal, combo,
  } = useGamification();
  const courseProgress = progressMap[course.slug] || progressMap[course.id];
  const isLessonCompleted = courseProgress?.completedLessons?.includes(currentIndex) ?? false;

  const handleComplete = useCallback(async () => {
    const prevLevel = getLevel(xp);
    const multiplier = recordCombo();
    const baseXP = lesson.xpReward;
    const bonusXP = Math.round(baseXP * (multiplier - 1));
    const totalXP = baseXP + bonusXP;

    await completeLesson(course.slug, currentIndex, totalXP, {
      lessonTitle: lesson.title,
      courseTitle: course.title,
    });
    showXPGain(totalXP);
    addDailyXP(totalXP);
    completeQuestProgress("lessons");
    completeQuestProgress("xp", totalXP);
    if (isChallenge) completeQuestProgress("challenge");
    completeQuestProgress("streak");

    const newLevel = getLevel(xp + totalXP);
    if (newLevel > prevLevel) {
      showLevelUp(newLevel);
    }

    triggerCelebration({
      lessonTitle: lesson.title,
      xpEarned: baseXP,
      bonusXP,
      comboCount: combo.count + 1,
      comboMultiplier: multiplier,
      isLevelUp: newLevel > prevLevel,
      newLevel,
      isChallenge,
      dailyGoalProgress: dailyGoal.xpToday + totalXP,
      dailyGoalTarget: dailyGoal.target,
    });
  }, [completeLesson, course.slug, course.title, currentIndex, lesson.xpReward, lesson.title, xp, showXPGain, showLevelUp, recordCombo, addDailyXP, completeQuestProgress, triggerCelebration, dailyGoal, combo, isChallenge]);

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      <LessonHeader
        course={course}
        lesson={lesson}
        moduleTitle={moduleTitle}
        moduleIndex={moduleIndex}
        currentIndex={currentIndex}
        totalLessons={allLessons.length}
      />
      <CelebrationModal />

      {isChallenge ? (
        <CodeChallenge
          lesson={lesson}
          course={course}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
          onComplete={handleComplete}
          initialCompleted={isLessonCompleted}
        />
      ) : (
        <LessonContent
          lesson={lesson}
          course={course}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
          onComplete={handleComplete}
          initialCompleted={isLessonCompleted}
          onChainSig={onChainLessonSig}
        />
      )}
    </div>
  );
}
