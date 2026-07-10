/**
 * Values mirrored from systems outside this package. Each carries the source it
 * mirrors; a change there is a breaking change here, caught by constants.test.ts.
 */

/** onchain-academy/programs/onchain-academy/src/utils.rs:15 */
export const MAX_XP_PER_MINT = 5000;

/** state/course.rs: MAX_COURSE_ID_LEN — the PDA seed byte limit. */
export const MAX_COURSE_ID_BYTES = 32;

/** Sanity `_id` hard limit is 128 chars; lesson ids are Supabase keys, not seeds. */
export const MAX_LESSON_ID_BYTES = 128;

/** state/enrollment.rs: lesson_flags is [u64; 4] = 256 bits. */
export const MAX_LESSON_SLOTS = 256;

/** supabase/schema.sql: the IF/ELSIF chain in get_daily_quest_state. */
export const QUEST_TYPES = [
  "lesson",
  "lesson_batch",
  "challenge",
  "login_streak",
  "module",
] as const;

/** Fields of UserState sourced from the community_stats view. */
export const COMMUNITY_STATS = [
  "totalThreads",
  "totalAnswers",
  "acceptedAnswers",
  "totalCommunityXp",
] as const;

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

export const ACHIEVEMENT_CATEGORIES = [
  "progress",
  "streaks",
  "skills",
  "community",
  "special",
] as const;
