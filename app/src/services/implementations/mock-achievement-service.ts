import type { AchievementService } from "../achievement-service";
import type { Achievement } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const ACHIEVEMENT_DEFINITIONS: Omit<
  Achievement,
  "isEarned" | "earnedAt" | "progress" | "maxProgress"
>[] = [
  {
    id: "first-lesson",
    name: "First Steps",
    description: "Complete your first lesson",
    category: "progress",
    iconUrl: "/achievements/first-lesson.svg",
    xpReward: 10,
  },
  {
    id: "first-course",
    name: "Course Completed",
    description: "Complete your first course",
    category: "progress",
    iconUrl: "/achievements/first-course.svg",
    xpReward: 50,
  },
  {
    id: "streak-7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    category: "streak",
    iconUrl: "/achievements/streak-7.svg",
    xpReward: 30,
  },
  {
    id: "streak-30",
    name: "Monthly Master",
    description: "Maintain a 30-day streak",
    category: "streak",
    iconUrl: "/achievements/streak-30.svg",
    xpReward: 100,
  },
  {
    id: "five-courses",
    name: "Scholar",
    description: "Complete 5 courses",
    category: "progress",
    iconUrl: "/achievements/five-courses.svg",
    xpReward: 100,
  },
  {
    id: "rust-master",
    name: "Rust Master",
    description: "Complete all Rust challenges",
    category: "skill",
    iconUrl: "/achievements/rust-master.svg",
    xpReward: 200,
  },
  {
    id: "first-credential",
    name: "Certified",
    description: "Earn your first on-chain credential",
    category: "special",
    iconUrl: "/achievements/first-credential.svg",
    xpReward: 50,
  },
  {
    id: "top-10",
    name: "Top 10",
    description: "Reach the top 10 on the leaderboard",
    category: "community",
    iconUrl: "/achievements/top-10.svg",
    xpReward: 150,
  },
];

export const mockAchievementService: AchievementService = {
  async getAchievements(userId) {
    const supabase = createSupabaseBrowserClient();
    const { data: earned } = await supabase
      .from("user_achievements")
      .select("achievement_id, earned_at")
      .eq("user_id", userId);

    const earnedMap = new Map(
      (earned ?? []).map((e) => [e.achievement_id, e.earned_at]),
    );

    return ACHIEVEMENT_DEFINITIONS.map((def) => ({
      ...def,
      isEarned: earnedMap.has(def.id),
      earnedAt: earnedMap.get(def.id) ?? undefined,
    }));
  },

  async getEarnedAchievements(userId) {
    const all = await this.getAchievements(userId);
    return all.filter((a) => a.isEarned);
  },

  async checkAndAward(userId) {
    // TODO: Implement achievement check logic against progress/streak data
    const all = await this.getAchievements(userId);
    return all.filter((a) => a.isEarned);
  },
};
