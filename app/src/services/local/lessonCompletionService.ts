import {
    ILessonCompletionService,
    LessonCompletionRequest,
    LessonCompletionResponse
} from '../interfaces';
import { LocalStorageManager } from './storage';

interface LessonProgress {
    lessonId: string;
    completedAt: number;
}

interface CourseProgress {
    courseId: string;
    completedLessons: LessonProgress[];
    isCompleted: boolean;
}

export class LocalLessonCompletionService implements ILessonCompletionService {
    private getKey(userId: string) {
        return `progress_${userId}`;
    }

    async completeLesson(request: LessonCompletionRequest): Promise<LessonCompletionResponse> {
        const key = this.getKey(request.userId);
        const allProgress = LocalStorageManager.getItem<Record<string, CourseProgress>>(key) || {};

        // Initialize course progress if needed
        if (!allProgress[request.courseId]) {
            allProgress[request.courseId] = {
                courseId: request.courseId,
                completedLessons: [],
                isCompleted: false
            };
        }

        const courseProgress = allProgress[request.courseId];

        // Add lesson completion if not already completed
        if (!courseProgress.completedLessons.find(l => l.lessonId === request.lessonId)) {
            courseProgress.completedLessons.push({
                lessonId: request.lessonId,
                completedAt: Date.now()
            });
        }

        // Save updated progress
        LocalStorageManager.setItem(key, allProgress);

        // Calculate XP and simulated level
        const totalLessons = Object.values(allProgress).reduce(
            (acc, curr) => acc + curr.completedLessons.length,
            0
        );
        const xp = totalLessons * 100; // 100 XP per lesson for simplicity here
        const level = Math.floor(Math.sqrt(xp / 100));

        return {
            success: true,
            xpAwarded: 100, // Fixed XP for now
            newTotalXp: xp,
            newLevel: level,
            transactionSignature: `local_tx_${Date.now()}`,
            achievementsUnlocked: [], // Would implement achievement logic here
        };
    }

    async getLessonProgress(userId: string, courseId: string): Promise<string[]> {
        const key = this.getKey(userId);
        const allProgress = LocalStorageManager.getItem<Record<string, CourseProgress>>(key) || {};
        return allProgress[courseId]?.completedLessons.map(l => l.lessonId) || [];
    }

    async isCourseCompleted(userId: string, courseId: string): Promise<boolean> {
        // Ideally this checks if all lessons in a course are done. 
        // Since we don't have the full course structure injected here, we'll rely on stored flag 
        // or assume false unless explicity marked (which we aren't doing yet).
        // For now, let's just return false or check if progress exists.
        const key = this.getKey(userId);
        const allProgress = LocalStorageManager.getItem<Record<string, CourseProgress>>(key) || {};
        return allProgress[courseId]?.isCompleted || false;
    }
}
