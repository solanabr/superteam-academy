import type {
    LearningProgressService,
    LearningProgress,
} from "../interfaces/learning-progress";
import type { ServiceResponse } from "../types";

export class StubLearningProgressService implements LearningProgressService {
	private progressStore = new Map<string, LearningProgress>();

	async getProgress(
		userId: string,
		courseId: string
	): Promise<ServiceResponse<LearningProgress>> {
		const key = `${userId}:${courseId}`;
		const progress = this.progressStore.get(key);

		if (!progress) {
			return {
				success: false,
				error: "Progress not found",
			};
		}

		return {
			success: true,
			data: progress,
		};
	}

	async updateProgress(
		userId: string,
		courseId: string,
		lessonId: string
	): Promise<ServiceResponse<void>> {
		const key = `${userId}:${courseId}`;
		const existing = this.progressStore.get(key);

		const progress: LearningProgress = existing || {
			userId,
			courseId,
			completedLessons: [],
			progress: 0,
			lastAccessed: new Date(),
		};

		if (!progress.completedLessons.includes(lessonId)) {
			progress.completedLessons.push(lessonId);
			progress.progress = (progress.completedLessons.length / 10) * 100; // Assume 10 lessons per course
		}

		progress.lastAccessed = new Date();
		this.progressStore.set(key, progress);

		return {
			success: true,
		};
	}

	async getAllProgress(userId: string): Promise<ServiceResponse<LearningProgress[]>> {
		const userProgress: LearningProgress[] = [];

		for (const [key, progress] of this.progressStore.entries()) {
			if (key.startsWith(`${userId}:`)) {
				userProgress.push(progress);
			}
		}

		return {
			success: true,
			data: userProgress,
		};
	}
}
