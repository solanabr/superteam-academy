export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  xpReward: number;
  requirement: string;
  claimed: boolean;
}

export type AchievementCategory =
  | "progress"
  | "streak"
  | "skill"
  | "community"
  | "special";

export interface Credential {
  trackId: number;
  trackName: string;
  currentLevel: number;
  coursesCompleted: number;
  totalXpEarned: number;
  firstEarned: string;
  lastUpdated: string;
  metadataHash: string;
  badgeImage?: string;
}

export interface AchievementContext {
  lessonsCompleted: number;
  coursesCompleted: number;
  longestStreak: number;
  practiceCount: number;
  completedTrackIds: number[];
  hasSpeedRun: boolean;
  referralCount: number;
}

export function checkAchievementEligibility(
  id: number,
  ctx: AchievementContext,
): boolean {
  switch (id) {
    case 0:
      return ctx.lessonsCompleted >= 1;
    case 1:
      return ctx.lessonsCompleted >= 10;
    case 2:
      return ctx.coursesCompleted >= 1;
    case 3:
      return ctx.coursesCompleted >= 5;
    case 4:
      return ctx.coursesCompleted >= 10;
    case 5:
      return ctx.longestStreak >= 7;
    case 6:
      return ctx.longestStreak >= 30;
    case 7:
      return ctx.longestStreak >= 100;
    case 8:
      return ctx.completedTrackIds.includes(1);
    case 9:
      return ctx.completedTrackIds.includes(1) && ctx.coursesCompleted >= 2;
    case 10:
      return ctx.completedTrackIds.includes(2);
    case 11:
      return ctx.completedTrackIds.includes(3);
    case 12:
      return ctx.referralCount >= 5;
    case 13:
      return ctx.practiceCount >= 20;
    case 14:
      return ctx.hasSpeedRun;
    default:
      return false;
  }
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 0,
    name: "First Steps",
    description: "Complete your first lesson",
    icon: "footprints",
    category: "progress",
    xpReward: 50,
    requirement: "1 lesson completed",
    claimed: false,
  },
  {
    id: 1,
    name: "Quick Learner",
    description: "Complete 10 lessons",
    icon: "zap",
    category: "progress",
    xpReward: 100,
    requirement: "10 lessons completed",
    claimed: false,
  },
  {
    id: 2,
    name: "Scholar",
    description: "Complete your first course",
    icon: "graduation-cap",
    category: "progress",
    xpReward: 200,
    requirement: "1 course completed",
    claimed: false,
  },
  {
    id: 3,
    name: "Dedicated",
    description: "Complete 5 courses",
    icon: "book-open",
    category: "progress",
    xpReward: 500,
    requirement: "5 courses completed",
    claimed: false,
  },
  {
    id: 4,
    name: "Master",
    description: "Complete 10 courses",
    icon: "crown",
    category: "progress",
    xpReward: 1000,
    requirement: "10 courses completed",
    claimed: false,
  },
  {
    id: 5,
    name: "On Fire",
    description: "7-day learning streak",
    icon: "flame",
    category: "streak",
    xpReward: 100,
    requirement: "7-day streak",
    claimed: false,
  },
  {
    id: 6,
    name: "Consistency",
    description: "30-day learning streak",
    icon: "calendar",
    category: "streak",
    xpReward: 500,
    requirement: "30-day streak",
    claimed: false,
  },
  {
    id: 7,
    name: "Unstoppable",
    description: "100-day learning streak",
    icon: "trophy",
    category: "streak",
    xpReward: 1000,
    requirement: "100-day streak",
    claimed: false,
  },
  {
    id: 8,
    name: "Anchor Beginner",
    description: "Complete Anchor beginner track",
    icon: "anchor",
    category: "skill",
    xpReward: 200,
    requirement: "Anchor Beginner track",
    claimed: false,
  },
  {
    id: 9,
    name: "Anchor Builder",
    description: "Complete Anchor intermediate track",
    icon: "hammer",
    category: "skill",
    xpReward: 400,
    requirement: "Anchor Intermediate track",
    claimed: false,
  },
  {
    id: 10,
    name: "Rust Warrior",
    description: "Complete Rust beginner track",
    icon: "shield",
    category: "skill",
    xpReward: 200,
    requirement: "Rust Beginner track",
    claimed: false,
  },
  {
    id: 11,
    name: "DeFi Explorer",
    description: "Complete DeFi beginner track",
    icon: "coins",
    category: "skill",
    xpReward: 200,
    requirement: "DeFi Beginner track",
    claimed: false,
  },
  {
    id: 12,
    name: "Referral Pro",
    description: "Refer 5 learners",
    icon: "users",
    category: "community",
    xpReward: 250,
    requirement: "5 referrals",
    claimed: false,
  },
  {
    id: 13,
    name: "Challenge Accepted",
    description: "Complete 20 code challenges",
    icon: "code",
    category: "progress",
    xpReward: 300,
    requirement: "20 challenges",
    claimed: false,
  },
  {
    id: 14,
    name: "Speed Runner",
    description: "Complete a course in one day",
    icon: "timer",
    category: "special",
    xpReward: 150,
    requirement: "1-day course completion",
    claimed: false,
  },
];
