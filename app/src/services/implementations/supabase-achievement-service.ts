import type { AchievementService } from "../achievement-service";
import type { Achievement } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const ACHIEVEMENT_DEFINITIONS: Omit<
  Achievement,
  "isEarned" | "earnedAt" | "progress" | "maxProgress"
>[] = [
  // ─── Progress ─────────────────────────────────────────
  {
    id: "first-steps",
    name: "First Steps",
    description: "Complete your first lesson",
    category: "progress",
    iconUrl: "https://i.ibb.co/ccHMmzD5/first-steps.jpg",
    xpReward: 10,
  },
  {
    id: "course-completer",
    name: "Course Completer",
    description: "Complete your first course",
    category: "progress",
    iconUrl: "https://i.ibb.co/tRymDvf/coursecompleter.jpg",
    xpReward: 50,
  },
  {
    id: "speed-runner",
    name: "Speed Runner",
    description: "Complete a course in under 24 hours",
    category: "progress",
    iconUrl: "https://i.ibb.co/4RhqCCGV/speedrunner.jpg",
    xpReward: 75,
  },

  // ─── Streaks ──────────────────────────────────────────
  {
    id: "week-warrior",
    name: "Week Warrior",
    description: "Maintain a 7-day learning streak",
    category: "streak",
    iconUrl: "https://i.ibb.co/kV8GrtN9/weekwarrior.jpg",
    xpReward: 30,
  },
  {
    id: "monthly-master",
    name: "Monthly Master",
    description: "Maintain a 30-day learning streak",
    category: "streak",
    iconUrl: "https://i.ibb.co/cKk15smD/montlymaster.jpg",
    xpReward: 100,
  },
  {
    id: "consistency-king",
    name: "Consistency King",
    description: "Maintain a 90-day learning streak",
    category: "streak",
    iconUrl: "https://i.ibb.co/8gTyjgtS/Consistencyking.jpg",
    xpReward: 250,
  },

  // ─── Skills ───────────────────────────────────────────
  {
    id: "rust-rookie",
    name: "Rust Rookie",
    description: "Complete the Rust Fundamentals course",
    category: "skill",
    iconUrl: "https://i.ibb.co/608V57hq/rustrookie.jpg",
    xpReward: 50,
  },
  {
    id: "anchor-expert",
    name: "Anchor Expert",
    description: "Complete all Anchor Framework courses",
    category: "skill",
    iconUrl: "https://i.ibb.co/v6KYQ0Ws/anchorexpert.jpg",
    xpReward: 150,
  },
  {
    id: "full-stack-solana",
    name: "Full Stack Solana",
    description: "Complete courses across all Solana tracks",
    category: "skill",
    iconUrl: "https://i.ibb.co/1tz81kmr/fullstack.jpg",
    xpReward: 300,
  },

  // ─── Community ────────────────────────────────────────
  {
    id: "helper",
    name: "Helper",
    description: "Help another learner in the community",
    category: "community",
    iconUrl: "https://i.ibb.co/GvtspMdN/Communityhelper.jpg",
    xpReward: 25,
  },
  {
    id: "first-comment",
    name: "First Comment",
    description: "Leave your first comment on a lesson",
    category: "community",
    iconUrl: "https://i.ibb.co/j9zXC4jk/communityfirst.jpg",
    xpReward: 10,
  },
  {
    id: "top-contributor",
    name: "Top Contributor",
    description: "Reach the top 10 on the leaderboard",
    category: "community",
    iconUrl: "https://i.ibb.co/zHBTV4XC/communitytop.jpg",
    xpReward: 200,
  },

  // ─── Special ──────────────────────────────────────────
  {
    id: "early-adopter",
    name: "Early Adopter",
    description: "Join the platform during beta",
    category: "special",
    iconUrl: "https://i.ibb.co/7xNkX9tB/earlyadopter.jpg",
    xpReward: 100,
  },
  {
    id: "bug-hunter",
    name: "Bug Hunter",
    description: "Report a verified bug in the platform",
    category: "special",
    iconUrl: "https://i.ibb.co/Xm8MZwN/bughunter.jpg",
    xpReward: 150,
  },
  {
    id: "perfect-score",
    name: "Perfect Score",
    description: "Complete all code challenges with 100% on first try",
    category: "special",
    iconUrl: "https://i.ibb.co/4wwFv83N/perfectscore.jpg",
    xpReward: 200,
  },
];

export const supabaseAchievementService: AchievementService = {
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
