import type { Course, Achievement } from "@/types";
import { MOCK_COURSES } from "./mock-courses";
export { MOCK_COURSES };

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  // Progress
  { id: 0, name: "First Steps", description: "Complete your first lesson", icon: "Footprints", category: "progress", xpReward: 25, claimed: false },
  { id: 1, name: "Course Completer", description: "Complete an entire course", icon: "GraduationCap", category: "progress", xpReward: 100, claimed: false },
  { id: 2, name: "Speed Runner", description: "Complete a course in under 24 hours", icon: "Zap", category: "progress", xpReward: 150, claimed: false },
  { id: 3, name: "Halfway There", description: "Complete 50% of any course", icon: "Target", category: "progress", xpReward: 50, claimed: false },
  // Streaks
  { id: 4, name: "Week Warrior", description: "Maintain a 7-day streak", icon: "Flame", category: "streaks", xpReward: 75, claimed: false },
  { id: 5, name: "Monthly Master", description: "Maintain a 30-day streak", icon: "Calendar", category: "streaks", xpReward: 200, claimed: false },
  { id: 6, name: "Consistency King", description: "Maintain a 100-day streak", icon: "Crown", category: "streaks", xpReward: 500, claimed: false },
  { id: 7, name: "Dedicated Learner", description: "Study for 3 consecutive days", icon: "BookHeart", category: "streaks", xpReward: 30, claimed: false },
  // Skills
  { id: 8, name: "Rust Rookie", description: "Complete a Rust course", icon: "Code", category: "skills", xpReward: 100, claimed: false },
  { id: 9, name: "Anchor Expert", description: "Complete all Anchor track courses", icon: "Anchor", category: "skills", xpReward: 300, claimed: false },
  { id: 10, name: "Full Stack Solana", description: "Complete courses from 3 different tracks", icon: "Layers", category: "skills", xpReward: 250, claimed: false },
  { id: 11, name: "Security Sentinel", description: "Complete the Security track", icon: "Shield", category: "skills", xpReward: 200, claimed: false },
  // Community
  { id: 12, name: "Helper", description: "Help another learner in discussions", icon: "HandHelping", category: "community", xpReward: 50, claimed: false },
  { id: 13, name: "First Comment", description: "Leave your first discussion comment", icon: "MessageSquare", category: "community", xpReward: 25, claimed: false },
  { id: 14, name: "Top Contributor", description: "Get 10 upvotes on your comments", icon: "Star", category: "community", xpReward: 150, claimed: false },
  { id: 15, name: "Referral Master", description: "Refer 5 friends to the platform", icon: "Users", category: "community", xpReward: 200, claimed: false },
  // Special
  { id: 16, name: "Early Adopter", description: "Join during the first month", icon: "Sparkles", category: "special", xpReward: 100, claimed: false },
  { id: 17, name: "Bug Hunter", description: "Report a bug that gets fixed", icon: "Bug", category: "special", xpReward: 200, claimed: false },
  { id: 18, name: "Perfect Score", description: "Complete all challenges in a course without hints", icon: "Trophy", category: "special", xpReward: 300, claimed: false },
  { id: 19, name: "Night Owl", description: "Complete a lesson between midnight and 5am", icon: "Moon", category: "special", xpReward: 50, claimed: false },
];

export function getCourseBySlug(slug: string): Course | undefined {
  return MOCK_COURSES.find((c) => c.slug === slug);
}

export function getCoursesByTrack(trackId: number): Course[] {
  return MOCK_COURSES.filter((c) => c.trackId === trackId);
}

export function getCoursesByDifficulty(difficulty: Course["difficulty"]): Course[] {
  return MOCK_COURSES.filter((c) => c.difficulty === difficulty);
}
