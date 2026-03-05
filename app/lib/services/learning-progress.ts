/**
 * @fileoverview Service for managing learner progress on-chain.
 * Provides functions for lesson completion, course finalization, and credential management.
 */
/**
 * Response returned after marking a lesson as complete.
 */
export interface LessonCompletionResponse {
	success: boolean;
	signature?: string;
	message?: string;
	error?: string;
}

/**
 * Response returned after finalizing a course.
 */
export interface FinalizeCourseResponse {
	success: boolean;
	signature?: string;
	message?: string;
	error?: string;
}

/**
 * Service to manage learner progress, XP rewards, and credentials on-chain.
 */
export const learningProgressService = {
	/**
	 * Marks a lesson as complete on-chain and rewards XP.
	 */
	async completeLesson(params: {
		courseSlug: string;
		learnerAddress: string;
		lessonIndex: number;
	}): Promise<LessonCompletionResponse> {
		try {
			const res = await fetch("/api/lesson/complete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(params),
			});

			const data = await res.json();
			if (!res.ok)
				throw new Error(data.error || "Failed to mark lesson complete");
			return data;
		} catch (error) {
			console.error("Error in completeLesson service:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	},

	/**
	 * Finalizes a course on-chain, triggering completion bonuses and creator rewards.
	 */
	async finalizeCourse(params: {
		courseSlug: string;
		learnerAddress: string;
	}): Promise<FinalizeCourseResponse> {
		try {
			const res = await fetch("/api/course/finalize", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(params),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to finalize course");
			return data;
		} catch (error) {
			console.error("Error in finalizeCourse service:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	},

	/**
	 * Issues or upgrades a track credential NFT.
	 */
	async claimCredential(params: {
		courseSlug: string;
		learnerAddress: string;
	}): Promise<{ success: boolean; signature?: string; error?: string }> {
		try {
			const res = await fetch("/api/course/credential/issue", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(params),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to issue credential");
			return data;
		} catch (error) {
			console.error("Error in claimCredential service:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	},
};
