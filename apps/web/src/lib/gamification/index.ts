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

export { checkNewAchievements } from "./achievements";
export type { AchievementDefinition } from "./achievements";
