import { Credential, LeaderboardEntry, LearningProgress } from "./models";
import { allCourses } from "./courses";

export const mockCourses = allCourses;

export const mockProgress: LearningProgress[] = [
  {
    courseId: "sol-fundamentals",
    completedLessonIds: ["l1", "l2"],
    percentComplete: 25,
    updatedAt: new Date().toISOString(),
  },
  {
    courseId: "anchor-101",
    completedLessonIds: ["a1"],
    percentComplete: 12,
    updatedAt: new Date().toISOString(),
  },
];

export const mockCredentials: Credential[] = [
  {
    id: "cred-core-1",
    track: "Core",
    level: 2,
    coursesCompleted: 2,
    totalXp: 1450,
    mintAddress: "6A9dzY8fKXj5f8B8i9crZ4QJ8S7Q4fLw7VhQ9SEm1abc",
    explorerUrl:
      "https://explorer.solana.com/address/6A9dzY8fKXj5f8B8i9crZ4QJ8S7Q4fLw7VhQ9SEm1abc?cluster=devnet",
    imageUrl: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&q=80&w=400&h=400",
  },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, wallet: "4JK...9ab", name: "Ana", xp: 5400, level: 7, streak: 18, avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150" },
  { rank: 2, wallet: "2Ab...22c", name: "Bruno", xp: 5100, level: 7, streak: 12, avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150" },
  { rank: 3, wallet: "8Lm...44q", name: "Carla", xp: 4800, level: 6, streak: 20, avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150" },
];
