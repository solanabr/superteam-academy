import { BaseService } from "./types";

type EventParams = Record<string, string | number | boolean>;

declare global {
	interface Window {
		gtag?: (command: string, action: string, params?: Record<string, unknown>) => void;
	}
}

export class AnalyticsService extends BaseService {
	/** Track a custom event (GA4-compatible) */
	trackEvent(eventName: string, params?: EventParams): void {
		if (typeof window === "undefined") return;
		if (typeof window.gtag === "function") {
			window.gtag("event", eventName, params);
		}
	}

	/** Track page view */
	trackPageView(path: string, title?: string): void {
		this.trackEvent("page_view", {
			page_path: path,
			page_title: title ?? "",
		});
	}

	/** Track course enrollment */
	trackEnrollment(courseId: string, courseTitle: string): void {
		this.trackEvent("course_enroll", { course_id: courseId, course_title: courseTitle });
	}

	/** Track lesson completion */
	trackLessonComplete(courseId: string, lessonIndex: number, xpEarned: number): void {
		this.trackEvent("lesson_complete", {
			course_id: courseId,
			lesson_index: lessonIndex,
			xp_earned: xpEarned,
		});
	}

	/** Track achievement unlock */
	trackAchievement(achievementId: string, name: string): void {
		this.trackEvent("achievement_unlock", {
			achievement_id: achievementId,
			achievement_name: name,
		});
	}
}
