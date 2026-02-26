// ─── Admin Analytics Types ───────────────────────────────

export interface AnalyticsOverview {
  totalUsers: number;
  newUsersLast30Days: number;
  activeUsersLast7Days: number;
  usersWithWallet: number;
  onboardedUsers: number;
  totalCourses: number;
  approvedCourses: number;
  pendingCourses: number;
  totalEnrollments: number;
  totalCompletions: number;
  totalFinalizations: number;
  completionRate: number;
  totalXpEarned: number;
  totalLessonsCompleted: number;
  totalAchievementsEarned: number;
  totalComments: number;
}

export interface CourseAnalytics {
  courseId: string;
  title: string;
  slug: string;
  difficulty: number;
  trackId: number;
  status: string;
  isActive: boolean | null;
  lessonCount: number;
  enrollments: number;
  completions: number;
  completionRate: number;
  avgProgress: number;
  xpGenerated: number;
}

export interface UserAnalytics {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  walletAddress: string | null;
  joinedAt: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  xpEarned: number;
  currentStreak: number;
  longestStreak: number;
  achievementCount: number;
  commentCount: number;
  activityCount: number;
  lastActive: string | null;
}

export interface TimelinePoint {
  date: string;
  count: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  courseStats: CourseAnalytics[];
  usersPerCourse: { courseId: string; title: string; enrollments: number; completions: number }[];
  topUsersByXp: UserAnalytics[];
  topUsersByLessons: UserAnalytics[];
  topUsersByActivity: UserAnalytics[];
  usersWithStreaks: UserAnalytics[];
  timelines: {
    enrollments: TimelinePoint[];
    completions: TimelinePoint[];
    signups: TimelinePoint[];
  };
  activityTypeBreakdown: Record<string, number>;
  difficultyDistribution: { beginner: number; intermediate: number; advanced: number };
  allUsers: UserAnalytics[];
}
