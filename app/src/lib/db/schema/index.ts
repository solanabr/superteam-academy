/**
 * Drizzle schema — PRD tables.
 * On-chain canonical: XP, credentials, achievements, enrollment bitmap.
 * DB canonical: users, sessions, streaks, account linking, challenge attempts, leaderboard cache.
 */

export * from "./users";
export * from "./oauth_accounts";
export * from "./wallets";
export * from "./sessions";
export * from "./user_streaks";
export * from "./streak_events";
export * from "./lesson_progress";
export * from "./course_enrollments";
export * from "./challenges";
export * from "./user_challenge_attempts";
export * from "./xp_snapshots";
export * from "./achievements";
export * from "./admin_logs";
export * from "./rate_limits";
