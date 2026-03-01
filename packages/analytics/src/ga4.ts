/**
 * GA4 analytics via the standard gtag.js approach.
 *
 * On the client side, load gtag.js via a <Script> tag (already done in layout.tsx).
 * This module exposes typed helpers for calling `window.gtag()` so event tracking
 * is consistent and type-safe across the codebase.
 */

export enum GA4EventType {
	PAGE_VIEW = "page_view",
	USER_ENGAGEMENT = "user_engagement",
	SCROLL = "scroll",
	CLICK = "click",
	FORM_SUBMIT = "form_submit",
	COURSE_START = "course_start",
	COURSE_COMPLETE = "course_complete",
	CHALLENGE_ATTEMPT = "challenge_attempt",
	CHALLENGE_SUCCESS = "challenge_success",
	XP_EARNED = "xp_earned",
	LEVEL_UP = "level_up",
	ACHIEVEMENT_UNLOCKED = "achievement_unlocked",
	STREAK_MAINTAINED = "streak_maintained",
	LEADERBOARD_VIEW = "leaderboard_view",
	SOCIAL_SHARE = "social_share",
	PURCHASE = "purchase",
	REFERRAL = "referral",
}

type GtagCommand = "config" | "event" | "set" | "consent";

declare global {
	interface Window {
		gtag: (...args: [GtagCommand, ...unknown[]]) => void;
		dataLayer: unknown[];
	}
}

function gtag(...args: [GtagCommand, ...unknown[]]): void {
	if (typeof window !== "undefined" && typeof window.gtag === "function") {
		window.gtag(...args);
	}
}

export function trackGA4Event(eventName: string, parameters?: Record<string, unknown>): void {
	gtag("event", eventName, parameters);
}

export function trackPageView(pageTitle: string, pageLocation: string, userId?: string): void {
	trackGA4Event(GA4EventType.PAGE_VIEW, {
		page_title: pageTitle,
		page_location: pageLocation,
		...(userId && { user_id: userId }),
	});
}

export function trackCourseProgress(
	courseId: string,
	courseName: string,
	progress: number,
	userId: string
): void {
	trackGA4Event("course_progress", {
		course_id: courseId,
		course_name: courseName,
		progress_percentage: progress,
		user_id: userId,
	});
}

export function trackXPEarned(
	amount: number,
	source: string,
	userId: string,
	level?: number
): void {
	trackGA4Event(GA4EventType.XP_EARNED, {
		xp_amount: amount,
		xp_source: source,
		user_id: userId,
		...(level != null && { user_level: level }),
	});
}

export function trackAchievementUnlocked(
	achievementId: string,
	achievementName: string,
	rarity: string,
	userId: string
): void {
	trackGA4Event(GA4EventType.ACHIEVEMENT_UNLOCKED, {
		achievement_id: achievementId,
		achievement_name: achievementName,
		achievement_rarity: rarity,
		user_id: userId,
	});
}

export function trackLeaderboardView(
	leaderboardType: string,
	userRank?: number,
	userId?: string
): void {
	trackGA4Event(GA4EventType.LEADERBOARD_VIEW, {
		leaderboard_type: leaderboardType,
		...(userRank != null && { user_rank: userRank }),
		...(userId && { user_id: userId }),
	});
}

export function setGA4UserProperties(properties: Record<string, unknown>): void {
	gtag("set", "user_properties", properties);
}

export function updateGA4Consent(
	analyticsStorage: "granted" | "denied",
	adStorage: "granted" | "denied"
): void {
	gtag("consent", "update", {
		analytics_storage: analyticsStorage,
		ad_storage: adStorage,
	});
}
