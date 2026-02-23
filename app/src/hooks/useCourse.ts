import { useState, useEffect, useCallback } from 'react';
import { getProgress, enrollCourse, completeLesson as completeLessonXP, getCourseProgress, isLessonCompleted } from '@/lib/xp';
import { getCourse } from '@/lib/mockData';

export function useCourse(courseId?: string) {
  const [progress, setProgress] = useState(() => getProgress());

  const refresh = useCallback(() => {
    setProgress(getProgress());
  }, []);

  useEffect(() => {
    refresh();
  }, [courseId, refresh]);

  const enroll = useCallback((id: string) => {
    enrollCourse(id);
    refresh();
  }, [refresh]);

  const completeLesson = useCallback((lessonId: string, xpReward: number) => {
    const result = completeLessonXP(lessonId, xpReward);
    refresh();
    return result;
  }, [refresh]);

  const getCourseProgressPercent = useCallback((id: string): number => {
    const course = getCourse(id);
    if (!course) return 0;
    const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
    return getCourseProgress(id, allLessonIds);
  }, []);

  const isEnrolled = useCallback((id: string) => {
    return progress.enrolledCourses.includes(id);
  }, [progress.enrolledCourses]);

  const isCompleted = useCallback((lessonId: string) => {
    return isLessonCompleted(lessonId);
  }, []);

  return { progress, enroll, completeLesson, getCourseProgressPercent, isEnrolled, isCompleted, refresh };
}
