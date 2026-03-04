import type { UserXPSummary, Enrollment, Achievement, StreakData } from "@/lib/types/learning";

export async function generateDemoData(userId: string): Promise<{
  xp: UserXPSummary;
  enrollments: Enrollment[];
  achievements: Achievement[];
  streak: StreakData;
}> {
  void userId;

  const demoXP: UserXPSummary = {
    totalXp: 2450,
    level: 4,
    xpToNextLevel: 850,
    currentStreak: 12,
    longestStreak: 15,
    achievements: 0b00001101, // Bitmap: First Steps, Week Warrior, Rust Rookie
  };

  const demoEnrollments: Enrollment[] = [
    {
      id: "demo-1",
      courseId: "solana-fundamentals",
      courseSlug: "introduction-to-solana",
      courseTitle: "Solana Fundamentals",
      startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: null,
      completedLessons: 12,
      totalLessons: 18,
      completionPercent: 68,
      lessonProgress: 12,
    },
    {
      id: "demo-2",
      courseId: "rust-programming",
      courseSlug: "rust-programming-for-solana",
      courseTitle: "Rust Programming for Solana",
      startedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: null,
      completedLessons: 5,
      totalLessons: 15,
      completionPercent: 34,
      lessonProgress: 5,
    },
    {
      id: "demo-3",
      courseId: "anchor-framework",
      courseSlug: "building-with-anchor",
      courseTitle: "Building with Anchor",
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: null,
      completedLessons: 2,
      totalLessons: 17,
      completionPercent: 12,
      lessonProgress: 2,
    },
  ];

  const demoAchievements: Achievement[] = [
    { id: 1, name: "First Steps", description: "Complete your first lesson", category: "progress", icon: "footprints", unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 2, name: "Course Completer", description: "Complete your first course", category: "progress", icon: "graduation-cap", unlockedAt: null },
    { id: 3, name: "Week Warrior", description: "Maintain a 7-day streak", category: "streaks", icon: "flame", unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 4, name: "Rust Rookie", description: "Complete 5 Rust lessons", category: "skills", icon: "code", unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 5, name: "Anchor Expert", description: "Complete the Anchor course", category: "skills", icon: "anchor", unlockedAt: null },
    { id: 6, name: "Speed Runner", description: "Complete a course in under 7 days", category: "progress", icon: "timer", unlockedAt: null },
    { id: 7, name: "Monthly Master", description: "Maintain a 30-day streak", category: "streaks", icon: "flame-kindling", unlockedAt: null },
    { id: 8, name: "Consistency King", description: "Maintain a 100-day streak", category: "streaks", icon: "crown", unlockedAt: null },
  ];

  const streakHistory = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const isActive = i < 22;
    return { date: date.toISOString().split("T")[0], active: isActive };
  });

  const demoStreak: StreakData = {
    currentStreak: 12,
    longestStreak: 15,
    streakHistory,
    lastActiveDate: new Date().toISOString().split("T")[0],
  };

  return { xp: demoXP, enrollments: demoEnrollments, achievements: demoAchievements, streak: demoStreak };
}
