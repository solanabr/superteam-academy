export type AchievementCategory = "progress" | "streaks" | "skills" | "community" | "special";

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  bitmapIndex: number; // 0-14, maps to 256-bit bitmap
  icon: string; // lucide icon name
  xpReward: number;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Progress (3)
  { id: "first_steps", name: "First Steps", description: "Complete your first lesson", category: "progress", bitmapIndex: 0, icon: "BookOpen", xpReward: 50 },
  { id: "course_completer", name: "Course Completer", description: "Complete your first course", category: "progress", bitmapIndex: 1, icon: "GraduationCap", xpReward: 300 },
  { id: "speed_runner", name: "Speed Runner", description: "Complete a course in record time", category: "progress", bitmapIndex: 2, icon: "Timer", xpReward: 500 },
  // Streaks (3)
  { id: "week_warrior", name: "Week Warrior", description: "Maintain a 7-day learning streak", category: "streaks", bitmapIndex: 3, icon: "Flame", xpReward: 100 },
  { id: "monthly_master", name: "Monthly Master", description: "Maintain a 30-day learning streak", category: "streaks", bitmapIndex: 4, icon: "Zap", xpReward: 300 },
  { id: "consistency_king", name: "Consistency King", description: "Maintain a 100-day learning streak", category: "streaks", bitmapIndex: 5, icon: "Crown", xpReward: 1000 },
  // Skills (3)
  { id: "rust_rookie", name: "Rust Rookie", description: "Complete your first Rust lesson", category: "skills", bitmapIndex: 6, icon: "Code", xpReward: 100 },
  { id: "anchor_expert", name: "Anchor Expert", description: "Master Anchor framework development", category: "skills", bitmapIndex: 7, icon: "Terminal", xpReward: 500 },
  { id: "full_stack_solana", name: "Full Stack Solana", description: "Complete full-stack Solana development tracks", category: "skills", bitmapIndex: 8, icon: "GitBranch", xpReward: 300 },
  // Community (3)
  { id: "helper", name: "Helper", description: "Help other learners in the community", category: "community", bitmapIndex: 9, icon: "Heart", xpReward: 50 },
  { id: "first_comment", name: "First Comment", description: "Leave your first community comment", category: "community", bitmapIndex: 10, icon: "MessageSquare", xpReward: 50 },
  { id: "top_contributor", name: "Top Contributor", description: "Become a top community contributor", category: "community", bitmapIndex: 11, icon: "Award", xpReward: 200 },
  // Special (3)
  { id: "early_adopter", name: "Early Adopter", description: "Join Superteam Academy in its early days", category: "special", bitmapIndex: 12, icon: "Star", xpReward: 500 },
  { id: "bug_hunter", name: "Bug Hunter", description: "Find and report a bug in the platform", category: "special", bitmapIndex: 13, icon: "Search", xpReward: 300 },
  { id: "perfect_score", name: "Perfect Score", description: "Achieve a perfect score on a challenge", category: "special", bitmapIndex: 14, icon: "Trophy", xpReward: 300 },
];

export const CATEGORIES: { key: AchievementCategory; color: string }[] = [
  { key: "progress", color: "text-blue-500" },
  { key: "streaks", color: "text-orange-500" },
  { key: "skills", color: "text-green-500" },
  { key: "community", color: "text-purple-500" },
  { key: "special", color: "text-yellow-500" },
];

// Check if achievement is unlocked in bitmap
export function isAchievementUnlocked(bitmap: bigint, index: number): boolean {
  return (bitmap & (1n << BigInt(index))) !== 0n;
}
