export {
  XP_REWARDS,
  calculateLessonXp,
  calculateChallengeXp,
  calculateCourseXp,
  calculateLevel,
  xpForLevel,
  xpToNextLevel,
  detectLevelUp,
} from "./xp";
export type { LessonDifficulty } from "./xp";

export {
  STREAK_MILESTONES,
  isActiveToday,
  updateStreak,
  shouldResetStreak,
  getStreakMilestones,
  getNextMilestone,
  generateStreakCalendar,
  generateWeekCalendar,
} from "./streaks";

export {
  ACHIEVEMENT_CATALOG,
  ACHIEVEMENT_CATEGORIES,
  checkNewAchievements,
  getAchievementById,
  getAchievementsByCategory,
} from "./achievements";
export type {
  AchievementDefinition,
  AchievementCategory,
} from "./achievements";
