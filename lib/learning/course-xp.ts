import { getPublishedCourseBySlug, getPublishedCourses } from '@/lib/data/courses';

const DEFAULT_XP_AWARD = 40;

function normalizeAward(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_XP_AWARD;
  }

  return Math.min(500, Math.floor(value));
}

export async function resolveLessonXpAward(courseId: string, lessonIndex: number): Promise<number> {
  if (!Number.isInteger(lessonIndex) || lessonIndex < 0) {
    return DEFAULT_XP_AWARD;
  }

  const courses = await getPublishedCourses();
  const course = courses.find((item) => item.id === courseId);
  if (!course) {
    return DEFAULT_XP_AWARD;
  }

  const detail = await getPublishedCourseBySlug(course.slug);
  if (!detail) {
    return DEFAULT_XP_AWARD;
  }

  const lessons = detail.modules.flatMap((moduleItem) => moduleItem.lessons);
  const lesson = lessons[lessonIndex];

  return normalizeAward(lesson?.xpReward ?? DEFAULT_XP_AWARD);
}

export function fallbackLessonXpAward(input: unknown): number {
  const parsed = Number(input);
  return normalizeAward(parsed);
}
