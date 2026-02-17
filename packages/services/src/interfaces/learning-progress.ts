import type { ServiceResponse } from "../types";

export interface LearningProgress {
	userId: string;
	courseId: string;
	completedLessons: string[];
	progress: number;
	lastAccessed: Date;
}

export interface LearningProgressService {
	getProgress(userId: string, courseId: string): Promise<ServiceResponse<LearningProgress>>;
	updateProgress(
		userId: string,
		courseId: string,
		lessonId: string
	): Promise<ServiceResponse<void>>;
	getAllProgress(userId: string): Promise<ServiceResponse<LearningProgress[]>>;
}
