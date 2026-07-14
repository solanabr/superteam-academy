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

// NOTE: `checkNewAchievements` is intentionally NOT re-exported here. It lives in
// the server-only `./achievements` module (`import "server-only"`), and a value
// re-export would pull that module — and thus `server-only` — into any client
// component that imports anything from this barrel (e.g. `completedLessonsToRadar`
// in profile pages), failing the build. Server callers import it directly from
// `@/lib/gamification/achievements`. The type-only re-export below is erased at
// compile time, so it carries no runtime dependency and is safe.
export type { AchievementDefinition } from "./achievements";

export { completedLessonsToRadar } from "./skill-radar";
export type { SkillRadarPoint } from "./skill-radar";
