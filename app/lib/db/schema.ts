import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * @fileoverview PostgreSQL database schema using Drizzle ORM.
 * Follows Better Auth requirements with custom extensions for Superteam Academy.
 */

/**
 * Core user identity, profile details, and preferences.
 * The `id` field is typically the user's Solana public key.
 */
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").notNull(),
	image: text("image"),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
	role: text("role").default("learner").notNull(),
	bio: text("bio"),
	location: text("location"),
	github: text("github"),
	twitter: text("twitter"),
	website: text("website"),
	language: text("language").default("en"),
	publicVisibility: boolean("publicVisibility").default(true).notNull(),
	notifications: jsonb("notifications")
		.$type<{
			newCourses: boolean;
			leaderboardAlerts: boolean;
			directMessages: boolean;
		}>()
		.default({
			newCourses: true,
			leaderboardAlerts: false,
			directMessages: true,
		}),
	onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
	preferredTracks: text("preferredTracks"),
	avatarSeed: text("avatarSeed"),
	walletAddress: text("walletAddress"),
	totalXp: integer("totalXp").default(0).notNull(),
	level: integer("level").default(1).notNull(),
});

/**
 * Active user authentication sessions.
 * Required by Better Auth.
 */
export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expiresAt").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

/**
 * Links users to authentication providers (e.g. Solana, GitHub).
 * Required by Better Auth.
 */
export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
	refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
});

/**
 * Verification tokens for email verification and password reset.
 * Required by Better Auth.
 */
export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expiresAt").notNull(),
	createdAt: timestamp("createdAt"),
	updatedAt: timestamp("updatedAt"),
});

/**
 * Dedicated storage for connected wallets.
 * Supports multiple wallets per user.
 */
export const wallet = pgTable("wallet", {
	id: text("id").primaryKey(),
	address: text("address").notNull().unique(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	provider: text("provider").default("solana").notNull(),
	isPrimary: boolean("isPrimary").default(false).notNull(),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
});

/**
 * Gamification: User Streak Tracking
 * Tracks consecutive days of activity for each user.
 */
export const streak = pgTable("streak", {
	id: text("id").primaryKey(),
	userId: text("userId")
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: "cascade" }),
	currentStreak: integer("currentStreak").default(0).notNull(),
	longestStreak: integer("longestStreak").default(0).notNull(),
	lastActiveDate: timestamp("lastActiveDate"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

/**
 * Gamification: User Activity Feed
 * Tracks recent actions like lesson completions and level-ups.
 */
export const userActivity = pgTable("user_activity", {
	id: text("id").primaryKey(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	type: text("type").notNull(), // 'lesson_completed', 'level_up', 'achievement', 'course_completed'
	title: text("title").notNull(),
	description: text("description"),
	xpEarned: integer("xpEarned"),
	courseId: text("courseId"),
	track: text("track"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
});

/**
 * Tracks detailed progress for a user in a specific course.
 * Used for the dashboard "Last Accessed" information and aggregated stats.
 */
export const courseProgress = pgTable(
	"course_progress",
	{
		id: text("id").primaryKey(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		courseId: text("courseId").notNull(), // Course slug
		progress: integer("progress").default(0).notNull(), // 0-100
		lastAccessedAt: timestamp("lastAccessedAt").notNull().defaultNow(),
		currentLessonIndex: integer("currentLessonIndex").default(0),
		completedAt: timestamp("completedAt"),
		createdAt: timestamp("createdAt").notNull().defaultNow(),
		updatedAt: timestamp("updatedAt").notNull().defaultNow(),
	},
	(table) => {
		return {
			userCourseUnique: uniqueIndex("user_course_unique").on(
				table.userId,
				table.courseId,
			),
		};
	},
);

/**
 * Stores per-lesson user progress, specifically for code challenges.
 * Enables persistence across devices and sessions.
 */
export const lessonProgress = pgTable(
	"lesson_progress",
	{
		id: text("id").primaryKey(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		courseId: text("courseId").notNull(),
		lessonId: text("lessonId").notNull(),
		code: text("code"),
		completed: boolean("completed").default(false).notNull(),
		createdAt: timestamp("createdAt").notNull().defaultNow(),
		updatedAt: timestamp("updatedAt").notNull().defaultNow(),
	},
	(table) => {
		return {
			userLessonUnique: uniqueIndex("user_lesson_unique").on(
				table.userId,
				table.lessonId,
			),
		};
	},
);

/**
 * Standalone Daily Challenges — NOT tied to any course.
 * Mirrors Sanity dailyChallenge docs for fast DB queries and submission tracking.
 */
export const dailyChallenge = pgTable("daily_challenge", {
	id: text("id").primaryKey(),
	sanityId: text("sanityId").unique(),
	slug: text("slug").notNull().unique(),
	title: text("title").notNull(),
	difficulty: integer("difficulty").default(1).notNull(),
	category: text("category"),
	xpReward: integer("xpReward").default(50).notNull(),
	scheduledDate: text("scheduledDate"), // ISO date string (null = regular/always-available challenge)
	isActive: boolean("isActive").default(true).notNull(),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

/**
 * Tracks per-user challenge submissions.
 * Unique constraint on (userId, challengeId) prevents double XP awards.
 */
export const challengeSubmission = pgTable(
	"challenge_submission",
	{
		id: text("id").primaryKey(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		challengeId: text("challengeId")
			.notNull()
			.references(() => dailyChallenge.id, { onDelete: "cascade" }),
		code: text("code"),
		passed: boolean("passed").default(false).notNull(),
		xpEarned: integer("xpEarned").default(0).notNull(),
		submittedAt: timestamp("submittedAt").notNull().defaultNow(),
	},
	(table) => {
		return {
			userChallengeUnique: uniqueIndex("user_challenge_unique").on(
				table.userId,
				table.challengeId,
			),
		};
	},
);

/**
 * Community Discussion Threads
 */
export const thread = pgTable("thread", {
	id: text("id").primaryKey(),
	slug: text("slug").notNull().unique(),
	title: text("title").notNull(),
	authorId: text("authorId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	category: text("category").notNull(), // 'Architecture', 'Discussion', 'Networking', etc.
	content: text("content").notNull(),
	views: integer("views").default(0).notNull(),
	replies: integer("replies").default(0).notNull(),
	likes: integer("likes").default(0).notNull(),
	lastActiveAt: timestamp("lastActiveAt").notNull().defaultNow(),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

/**
 * Community Discussion Comments / Replies
 */
export const threadComment = pgTable("thread_comment", {
	id: text("id").primaryKey(),
	threadId: text("threadId")
		.notNull()
		.references(() => thread.id, { onDelete: "cascade" }),
	authorId: text("authorId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	content: text("content").notNull(),
	likes: integer("likes").default(0).notNull(),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
