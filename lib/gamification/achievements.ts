export type AchievementCategory = "progress" | "streak" | "skills" | "community" | "special";

export type Achievement = {
  id: number;
  key: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
};

export const achievements: Achievement[] = [
  {
    id: 0,
    key: "first_lesson",
    title: "First Lesson",
    description: "Complete your first lesson.",
    category: "progress",
    icon: "\u{1F4D6}"
  },
  {
    id: 1,
    key: "streak_7",
    title: "7-Day Streak",
    description: "Stay active for seven days in a row.",
    category: "streak",
    icon: "\u{1F525}"
  },
  {
    id: 2,
    key: "challenge_master",
    title: "Challenge Master",
    description: "Pass all tests in a coding challenge.",
    category: "skills",
    icon: "\u{1F3AF}"
  },
  {
    id: 3,
    key: "course_complete",
    title: "Course Graduate",
    description: "Complete an entire course.",
    category: "progress",
    icon: "\u{1F393}"
  },
  {
    id: 4,
    key: "streak_30",
    title: "30-Day Streak",
    description: "Stay active for thirty days straight.",
    category: "streak",
    icon: "\u{2B50}"
  },
  {
    id: 5,
    key: "five_challenges",
    title: "Code Warrior",
    description: "Complete five coding challenges.",
    category: "skills",
    icon: "\u{2694}\uFE0F"
  },
  {
    id: 6,
    key: "first_credential",
    title: "On-Chain Proof",
    description: "Earn your first on-chain credential.",
    category: "special",
    icon: "\u{1F48E}"
  },
  {
    id: 7,
    key: "level_5",
    title: "Rising Star",
    description: "Reach level 5.",
    category: "progress",
    icon: "\u{1F31F}"
  }
];

export function unlockedAchievements(achievementIds: number[]): Achievement[] {
  const set = new Set(achievementIds);
  return achievements.filter((achievement) => set.has(achievement.id));
}
