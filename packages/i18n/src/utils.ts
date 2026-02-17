import { getTranslations } from "next-intl/server";

/**
 * Translation utilities for the LMS platform
 * Provides type-safe translation functions and utilities
 */

/**
 * Server-side translation hook
 * Use in Server Components and Server Actions
 */
export const t = getTranslations;

/**
 * Translation key type for type safety
 * This ensures all translation keys are valid
 */
export type TranslationKey = string;

/**
 * Get nested translation keys for type safety
 */
export type NestedKeyOf<ObjectType extends object> = {
	[Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
		? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
		: `${Key}`;
}[keyof ObjectType & (string | number)];

/**
 * Translation utilities for common operations
 */
export const TranslationUtils = {
	/**
	 * Format a translation with count (pluralization)
	 * @param t - Translation function
	 * @param key - Translation key
	 * @param count - Count for pluralization
	 * @param options - Additional options
	 */
	formatCount(
		t: Awaited<ReturnType<typeof getTranslations>>,
		key: string,
		count: number,
		options?: Record<string, string | number | Date>
	) {
		return t(key, { count, ...options });
	},

	/**
	 * Format a translation with date
	 * @param t - Translation function
	 * @param key - Translation key
	 * @param date - Date to format
	 * @param options - Additional options
	 */
	formatDate(
		t: Awaited<ReturnType<typeof getTranslations>>,
		key: string,
		date: Date,
		options?: Record<string, string | number | Date>
	) {
		return t(key, { date, ...options });
	},

	/**
	 * Format a translation with time
	 * @param t - Translation function
	 * @param key - Translation key
	 * @param time - Time to format
	 * @param options - Additional options
	 */
	formatTime(
		t: Awaited<ReturnType<typeof getTranslations>>,
		key: string,
		time: Date,
		options?: Record<string, string | number | Date>
	) {
		return t(key, { time, ...options });
	},

	/**
	 * Format a translation with number
	 * @param t - Translation function
	 * @param key - Translation key
	 * @param value - Number to format
	 * @param options - Additional options
	 */
	formatNumber(
		t: Awaited<ReturnType<typeof getTranslations>>,
		key: string,
		value: number,
		options?: Record<string, string | number | Date>
	) {
		return t(key, { value, ...options });
	},

	/**
	 * Get a rich text translation (for formatted content)
	 * @param t - Translation function
	 * @param key - Translation key
	 * @param options - Additional options
	 */
	getRichText(
		t: Awaited<ReturnType<typeof getTranslations>>,
		key: string,
		options?: Parameters<Awaited<ReturnType<typeof getTranslations>>["rich"]>[1]
	) {
		return t.rich(key, options);
	},

	/**
	 * Check if a translation key exists
	 * @param t - Translation function
	 * @param key - Translation key to check
	 */
	hasKey(t: Awaited<ReturnType<typeof getTranslations>>, key: string): boolean {
		try {
			t(key);
			return true;
		} catch {
			return false;
		}
	},

	/**
	 * Get translation with fallback
	 * @param t - Translation function
	 * @param key - Primary translation key
	 * @param fallbackKey - Fallback translation key
	 * @param options - Additional options
	 */
	withFallback(
		t: Awaited<ReturnType<typeof getTranslations>>,
		key: string,
		fallbackKey: string,
		options?: Record<string, string | number | Date>
	) {
		try {
			return t(key, options);
		} catch {
			return t(fallbackKey, options);
		}
	},
};

/**
 * Common translation keys for reuse across components
 */
export const COMMON_KEYS = {
	LOADING: "common.loading",
	ERROR: "common.error",
	SUCCESS: "common.success",
	CANCEL: "common.cancel",
	SAVE: "common.save",
	DELETE: "common.delete",
	EDIT: "common.edit",
	CREATE: "common.create",
	SEARCH: "common.search",
	FILTER: "common.filter",
	SORT: "common.sort",
	NEXT: "common.next",
	PREVIOUS: "common.previous",
	CLOSE: "common.close",
	OPEN: "common.open",
	BACK: "common.back",
	CONTINUE: "common.continue",
	SUBMIT: "common.submit",
	RESET: "common.reset",
	CLEAR: "common.clear",
	SELECT: "common.select",
	SELECTED: "common.selected",
	ALL: "common.all",
	NONE: "common.none",
	YES: "common.yes",
	NO: "common.no",
	OK: "common.ok",
	RETRY: "common.retry",
	REFRESH: "common.refresh",
} as const;

/**
 * Navigation translation keys
 */
export const NAVIGATION_KEYS = {
	HOME: "navigation.home",
	COURSES: "navigation.courses",
	LEARN: "navigation.learn",
	LEADERBOARD: "navigation.leaderboard",
	PROFILE: "navigation.profile",
	SETTINGS: "navigation.settings",
	HELP: "navigation.help",
	LOGOUT: "navigation.logout",
	LOGIN: "navigation.login",
	SIGNUP: "navigation.signup",
} as const;

/**
 * Auth translation keys
 */
export const AUTH_KEYS = {
	CONNECT_WALLET: "auth.connectWallet",
	DISCONNECT_WALLET: "auth.disconnectWallet",
	WALLET_CONNECTED: "auth.walletConnected",
	WALLET_DISCONNECTED: "auth.walletDisconnected",
	LINK_GOOGLE: "auth.linkGoogle",
	LINK_GITHUB: "auth.linkGithub",
	UNLINK_ACCOUNT: "auth.unlinkAccount",
	ACCOUNT_LINKED: "auth.accountLinked",
	ACCOUNT_UNLINKED: "auth.accountUnlinked",
	SIGN_IN_WITH: "auth.signInWith",
	SIGN_UP_WITH: "auth.signUpWith",
	EMAIL: "auth.email",
	PASSWORD: "auth.password",
	CONFIRM_PASSWORD: "auth.confirmPassword",
	FORGOT_PASSWORD: "auth.forgotPassword",
	RESET_PASSWORD: "auth.resetPassword",
	CREATE_ACCOUNT: "auth.createAccount",
	ALREADY_HAVE_ACCOUNT: "auth.alreadyHaveAccount",
	DONT_HAVE_ACCOUNT: "auth.dontHaveAccount",
	INVALID_CREDENTIALS: "auth.invalidCredentials",
	ACCOUNT_CREATED: "auth.accountCreated",
	PASSWORD_RESET_SENT: "auth.passwordResetSent",
	PASSWORD_RESET: "auth.passwordReset",
} as const;

/**
 * Course translation keys
 */
export const COURSE_KEYS = {
	TITLE: "courses.title",
	ENROLLED: "courses.enrolled",
	COMPLETED: "courses.completed",
	IN_PROGRESS: "courses.inProgress",
	NOT_STARTED: "courses.notStarted",
	DIFFICULTY_BEGINNER: "courses.difficulty.beginner",
	DIFFICULTY_INTERMEDIATE: "courses.difficulty.intermediate",
	DIFFICULTY_ADVANCED: "courses.difficulty.advanced",
	DURATION: "courses.duration",
	XP_REWARD: "courses.xpReward",
	ENROLL: "courses.enroll",
	UNENROLL: "courses.unenroll",
	START_COURSE: "courses.startCourse",
	CONTINUE_COURSE: "courses.continueCourse",
	COURSE_COMPLETED: "courses.courseCompleted",
	PREREQUISITES: "courses.prerequisites",
	MODULES: "courses.modules",
	LESSONS: "courses.lessons",
	CHALLENGES: "courses.challenges",
	CERTIFICATE: "courses.certificate",
	PROGRESS: "courses.progress",
	TIME_REMAINING: "courses.timeRemaining",
	ESTIMATED_TIME: "courses.estimatedTime",
	LAST_ACCESSED: "courses.lastAccessed",
	INSTRUCTOR: "courses.instructor",
	RATING: "courses.rating",
	REVIEWS: "courses.reviews",
	SHARE: "courses.share",
	BOOKMARK: "courses.bookmark",
	BOOKMARKED: "courses.bookmarked",
	UNBOOKMARK: "courses.unbookmark",
} as const;

/**
 * Learning translation keys
 */
export const LEARNING_KEYS = {
	START_LESSON: "learning.startLesson",
	COMPLETE_LESSON: "learning.completeLesson",
	NEXT_LESSON: "learning.nextLesson",
	PREVIOUS_LESSON: "learning.previousLesson",
	LESSON_COMPLETED: "learning.lessonCompleted",
	CHALLENGE_COMPLETED: "learning.challengeCompleted",
	XP_EARNED: "learning.xpEarned",
	STREAK: "learning.streak",
	ACHIEVEMENTS: "learning.achievements",
	LEADERBOARD: "learning.leaderboard",
	RANK: "learning.rank",
	POINTS: "learning.points",
	LEVEL: "learning.level",
	PROGRESS: "learning.progress",
	COMPLETION: "learning.completion",
	ACCURACY: "learning.accuracy",
	SPEED: "learning.speed",
	HINTS: "learning.hints",
	ATTEMPTS: "learning.attempts",
	BEST_TIME: "learning.bestTime",
	AVERAGE_TIME: "learning.averageTime",
	CODE_EDITOR: "learning.codeEditor",
	RUN_CODE: "learning.runCode",
	SUBMIT_SOLUTION: "learning.submitSolution",
	TEST_RESULTS: "learning.testResults",
	CONSOLE: "learning.console",
	OUTPUT: "learning.output",
	ERROR: "learning.error",
	SUCCESS: "learning.success",
	FAILED: "learning.failed",
	TIMEOUT: "learning.timeout",
	MEMORY_LIMIT: "learning.memoryLimit",
	COMPILATION_ERROR: "learning.compilationError",
	RUNTIME_ERROR: "learning.runtimeError",
	TEST_PASSED: "learning.testPassed",
	TEST_FAILED: "learning.testFailed",
} as const;

/**
 * Profile translation keys
 */
export const PROFILE_KEYS = {
	TITLE: "profile.title",
	PERSONAL_INFO: "profile.personalInfo",
	ACCOUNT_SETTINGS: "profile.accountSettings",
	LEARNING_STATS: "profile.learningStats",
	ACHIEVEMENTS: "profile.achievements",
	CERTIFICATES: "profile.certificates",
	PREFERENCES: "profile.preferences",
	NOTIFICATIONS: "profile.notifications",
	PRIVACY: "profile.privacy",
	SECURITY: "profile.security",
	NAME: "profile.name",
	BIO: "profile.bio",
	LOCATION: "profile.location",
	WEBSITE: "profile.website",
	SOCIAL_LINKS: "profile.socialLinks",
	TOTAL_XP: "profile.totalXp",
	COURSES_COMPLETED: "profile.coursesCompleted",
	LESSONS_COMPLETED: "profile.lessonsCompleted",
	CHALLENGES_COMPLETED: "profile.challengesCompleted",
	CURRENT_STREAK: "profile.currentStreak",
	LONGEST_STREAK: "profile.longestStreak",
	LEARNING_TIME: "profile.learningTime",
	AVERAGE_SCORE: "profile.averageScore",
	RANK: "profile.rank",
	BADGES: "profile.badges",
	LEVEL: "profile.level",
	PROGRESS: "profile.progress",
} as const;

/**
 * Settings translation keys
 */
export const SETTINGS_KEYS = {
	TITLE: "settings.title",
	LANGUAGE: "settings.language",
	THEME: "settings.theme",
	NOTIFICATIONS: "settings.notifications",
	PRIVACY: "settings.privacy",
	ACCOUNT: "settings.account",
	APPEARANCE: "settings.appearance",
	ACCESSIBILITY: "settings.accessibility",
	LIGHT: "settings.light",
	DARK: "settings.dark",
	SYSTEM: "settings.system",
	EMAIL_NOTIFICATIONS: "settings.emailNotifications",
	PUSH_NOTIFICATIONS: "settings.pushNotifications",
	MARKETING_EMAILS: "settings.marketingEmails",
	COURSE_UPDATES: "settings.courseUpdates",
	ACHIEVEMENT_NOTIFICATIONS: "settings.achievementNotifications",
	WEEKLY_DIGEST: "settings.weeklyDigest",
	PUBLIC_PROFILE: "settings.publicProfile",
	SHOW_PROGRESS: "settings.showProgress",
	SHOW_ACHIEVEMENTS: "settings.showAchievements",
	DATA_EXPORT: "settings.dataExport",
	DELETE_ACCOUNT: "settings.deleteAccount",
	CHANGE_PASSWORD: "settings.changePassword",
	TWO_FACTOR_AUTH: "settings.twoFactorAuth",
	BACKUP_CODES: "settings.backupCodes",
	SESSIONS: "settings.sessions",
	CONNECTED_ACCOUNTS: "settings.connectedAccounts",
} as const;

/**
 * Error translation keys
 */
export const ERROR_KEYS = {
	GENERIC: "errors.generic",
	NETWORK: "errors.network",
	UNAUTHORIZED: "errors.unauthorized",
	FORBIDDEN: "errors.forbidden",
	NOT_FOUND: "errors.notFound",
	VALIDATION: "errors.validation",
	SERVER: "errors.server",
	TIMEOUT: "errors.timeout",
	RATE_LIMIT: "errors.rateLimit",
	WALLET_NOT_CONNECTED: "errors.wallet.notConnected",
	WALLET_WRONG_NETWORK: "errors.wallet.wrongNetwork",
	WALLET_TRANSACTION_FAILED: "errors.wallet.transactionFailed",
	WALLET_INSUFFICIENT_FUNDS: "errors.wallet.insufficientFunds",
	WALLET_USER_REJECTED: "errors.wallet.userRejected",
	AUTH_INVALID_CREDENTIALS: "errors.auth.invalidCredentials",
	AUTH_ACCOUNT_DISABLED: "errors.auth.accountDisabled",
	AUTH_EMAIL_NOT_VERIFIED: "errors.auth.emailNotVerified",
	AUTH_WEAK_PASSWORD: "errors.auth.weakPassword",
	AUTH_PASSWORD_MISMATCH: "errors.auth.passwordMismatch",
	AUTH_ACCOUNT_EXISTS: "errors.auth.accountExists",
	AUTH_INVALID_TOKEN: "errors.auth.invalidToken",
	AUTH_SESSION_EXPIRED: "errors.auth.sessionExpired",
	LEARNING_LESSON_NOT_FOUND: "errors.learning.lessonNotFound",
	LEARNING_COURSE_NOT_FOUND: "errors.learning.courseNotFound",
	LEARNING_CHALLENGE_NOT_FOUND: "errors.learning.challengeNotFound",
	LEARNING_ALREADY_COMPLETED: "errors.learning.alreadyCompleted",
	LEARNING_PREREQUISITES_NOT_MET: "errors.learning.prerequisitesNotMet",
	LEARNING_TIME_LIMIT_EXCEEDED: "errors.learning.timeLimitExceeded",
	LEARNING_ATTEMPTS_EXCEEDED: "errors.learning.attemptsExceeded",
	LEARNING_INVALID_SOLUTION: "errors.learning.invalidSolution",
} as const;

/**
 * Validation translation keys
 */
export const VALIDATION_KEYS = {
	REQUIRED: "validation.required",
	EMAIL: "validation.email",
	MIN_LENGTH: "validation.minLength",
	MAX_LENGTH: "validation.maxLength",
	PASSWORD: "validation.password",
	URL: "validation.url",
	NUMBER: "validation.number",
	POSITIVE: "validation.positive",
	DATE: "validation.date",
	FUTURE: "validation.future",
	PAST: "validation.past",
} as const;

/**
 * Accessibility translation keys
 */
export const ACCESSIBILITY_KEYS = {
	SKIP_TO_CONTENT: "accessibility.skipToContent",
	SKIP_TO_NAVIGATION: "accessibility.skipToNavigation",
	OPEN_MENU: "accessibility.openMenu",
	CLOSE_MENU: "accessibility.closeMenu",
	EXPAND: "accessibility.expand",
	COLLAPSE: "accessibility.collapse",
	LOADING: "accessibility.loading",
	ERROR: "accessibility.error",
	SUCCESS: "accessibility.success",
	INFO: "accessibility.info",
	WARNING: "accessibility.warning",
	SCREEN_READER: "accessibility.screenReader",
} as const;
