import type { LearningProgressService } from '../interfaces';
import type { Progress } from '@/types';

// Storage keys
const PROGRESS_KEY = 'superteam_academy_progress';

function getStoredProgress(): Record<string, Progress> {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(PROGRESS_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

function setStoredProgress(progress: Record<string, Progress>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function createDefaultProgress(courseId: string, totalLessons: number): Progress {
  return {
    courseId,
    completedLessons: [],
    totalLessons,
    percentComplete: 0,
    enrolledAt: new Date(),
    lastActivityAt: new Date(),
  };
}

// Default lesson counts per course for stub
const courseLessonCounts: Record<string, number> = {
  'course-1': 5,
  'course-2': 3,
  'course-3': 2,
  'course-4': 0,
  'course-5': 0,
  'course-6': 0,
};

export class StubLearningProgressService implements LearningProgressService {
  getCourseProgress(slug: string, arg1: string): any {
    throw new Error("Method not implemented.");
  }
  async getProgress(userId: string, courseId: string): Promise<Progress | null> {
    const allProgress = getStoredProgress();
    const key = `${userId}:${courseId}`;
    return allProgress[key] || null;
  }

  async getAllProgress(userId: string): Promise<Progress[]> {
    const allProgress = getStoredProgress();
    const userProgress: Progress[] = [];
    for (const [key, progress] of Object.entries(allProgress)) {
      if (key.startsWith(`${userId}:`)) {
        userProgress.push(progress);
      }
    }
    return userProgress;
  }

  async completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number
  ): Promise<{ xpEarned: number; newTotal: number }> {
    const allProgress = getStoredProgress();
    const key = `${userId}:${courseId}`;
    const totalLessons = courseLessonCounts[courseId] || 5;
    const progress = allProgress[key] || createDefaultProgress(courseId, totalLessons);

    const lessonId = `lesson-${lessonIndex}`;
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
      progress.percentComplete = Math.round(
        (progress.completedLessons.length / progress.totalLessons) * 100
      );
      progress.lastActivityAt = new Date();

      if (progress.percentComplete >= 100) {
        progress.completedAt = new Date();
      }
    }

    allProgress[key] = progress;
    setStoredProgress(allProgress);

    // Stub XP values
    const xpEarned = 50;
    const currentXP = parseInt(localStorage.getItem('superteam_academy_xp') || '0', 10);
    const newTotal = currentXP + xpEarned;
    localStorage.setItem('superteam_academy_xp', String(newTotal));

    return { xpEarned, newTotal };
  }

  async enrollInCourse(userId: string, courseId: string): Promise<void> {
    const allProgress = getStoredProgress();
    const key = `${userId}:${courseId}`;
    
    if (!allProgress[key]) {
      const totalLessons = courseLessonCounts[courseId] || 5;
      allProgress[key] = createDefaultProgress(courseId, totalLessons);
      setStoredProgress(allProgress);
    }
  }

  async unenrollFromCourse(userId: string, courseId: string): Promise<void> {
    const allProgress = getStoredProgress();
    const key = `${userId}:${courseId}`;
    
    if (allProgress[key] && !allProgress[key].completedAt) {
      delete allProgress[key];
      setStoredProgress(allProgress);
    }
  }

  async finalizeCourse(
    userId: string,
    courseId: string
  ): Promise<{ xpEarned: number; credentialIssued: boolean }> {
    const allProgress = getStoredProgress();
    const key = `${userId}:${courseId}`;
    const progress = allProgress[key];

    if (!progress || progress.percentComplete < 100) {
      return { xpEarned: 0, credentialIssued: false };
    }

    // Award completion XP
    const xpEarned = 500;
    const currentXP = parseInt(localStorage.getItem('superteam_academy_xp') || '0', 10);
    localStorage.setItem('superteam_academy_xp', String(currentXP + xpEarned));

    return { xpEarned, credentialIssued: true };
  }
}

export const learningProgressService = new StubLearningProgressService();
