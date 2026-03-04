/**
 * Achievement / badge definitions.
 * Each achievement has an id, display metadata, category, and a condition
 * that can be checked against runtime stats to determine if it's earned.
 */

export type AchievementCategory =
  | "progress"
  | "streak"
  | "skill"
  | "community"
  | "special";

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  category: AchievementCategory;
  condition: AchievementCondition;
}

export type AchievementCondition =
  | { type: "xp"; threshold: number }
  | { type: "lessons"; threshold: number }
  | { type: "courses"; threshold: number }
  | { type: "streak"; days: number }
  | { type: "credential"; count: number }
  | { type: "manual" };

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-steps",
    emoji: "🚀",
    title: "First Steps",
    description: "Complete your very first lesson.",
    category: "progress",
    condition: { type: "lessons", threshold: 1 },
  },
  {
    id: "enrolled",
    emoji: "📚",
    title: "Enrolled",
    description: "Enroll in your first course.",
    category: "progress",
    condition: { type: "courses", threshold: 1 },
  },
  {
    id: "on-a-roll",
    emoji: "🔥",
    title: "On a Roll",
    description: "Complete 5 lessons.",
    category: "progress",
    condition: { type: "lessons", threshold: 5 },
  },
  {
    id: "course-completer",
    emoji: "🏆",
    title: "Course Completer",
    description: "Finish an entire course.",
    category: "progress",
    condition: { type: "courses", threshold: 1 },
  },
  {
    id: "polymath",
    emoji: "🎓",
    title: "Polymath",
    description: "Complete 3 different courses.",
    category: "progress",
    condition: { type: "courses", threshold: 3 },
  },
  {
    id: "xp-100",
    emoji: "⚡",
    title: "Spark",
    description: "Earn your first 100 XP.",
    category: "skill",
    condition: { type: "xp", threshold: 100 },
  },
  {
    id: "xp-500",
    emoji: "💎",
    title: "Diamond Hands",
    description: "Earn 500 XP.",
    category: "skill",
    condition: { type: "xp", threshold: 500 },
  },
  {
    id: "xp-1000",
    emoji: "👑",
    title: "XP King",
    description: "Earn 1,000 XP.",
    category: "skill",
    condition: { type: "xp", threshold: 1000 },
  },
  {
    id: "streak-3",
    emoji: "🌱",
    title: "Habit Forming",
    description: "Maintain a 3-day learning streak.",
    category: "streak",
    condition: { type: "streak", days: 3 },
  },
  {
    id: "streak-7",
    emoji: "📅",
    title: "Week Warrior",
    description: "Learn every day for 7 days straight.",
    category: "streak",
    condition: { type: "streak", days: 7 },
  },
  {
    id: "streak-30",
    emoji: "🌟",
    title: "Monthly Master",
    description: "Keep a 30-day learning streak.",
    category: "streak",
    condition: { type: "streak", days: 30 },
  },
  {
    id: "credential-1",
    emoji: "🎖️",
    title: "Credentialed",
    description: "Earn your first soulbound credential NFT.",
    category: "skill",
    condition: { type: "credential", count: 1 },
  },
  {
    id: "credential-3",
    emoji: "🏅",
    title: "Triple Crown",
    description: "Earn 3 credential NFTs.",
    category: "skill",
    condition: { type: "credential", count: 3 },
  },
  {
    id: "early-adopter",
    emoji: "🌅",
    title: "Early Adopter",
    description: "Joined Superteam Academy in its early days.",
    category: "special",
    condition: { type: "manual" },
  },
  {
    id: "speed-run",
    emoji: "⚡",
    title: "Speed Run",
    description: "Complete a lesson within 5 minutes of starting.",
    category: "special",
    condition: { type: "manual" },
  },
];

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
