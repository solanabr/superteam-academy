import type { StreakData } from "@superteam-lms/types";
import type {
  DeployedAchievement,
  RecommendedCourse,
} from "@/lib/content/queries";
import type { ContinueTarget } from "@/lib/courses/continue-learning";
import type { XpTransactionRow } from "@/lib/gamification/server-xp-feedback";

/** An enrolled, not-yet-minted course resolved from the content bundle. */
export interface CurrentCourse {
  courseId: string;
  title: string;
  slug: string;
  completedLessons: number;
  totalLessons: number;
  difficulty: string;
  learningPath: string | null;
  thumbnail: string | null;
}

/** One row of the merged multi-source dashboard activity feed. */
export interface ActivityItem {
  type:
    | "lesson"
    | "challenge"
    | "course_complete"
    | "achievement"
    | "certificate"
    | "enrollment"
    | "community"
    | "xp_other";
  action: string;
  xp: number;
  time: string;
  href: string | null;
  txSignature: string | null;
}

/**
 * Everything the dashboard's hero + main column render, assembled server-side
 * in one pass (`lib/dashboard/loaders.ts`) from the cookie-bound Supabase
 * client and the content bundle — the server-shell replacement for the old
 * `useDashboardData` client burst (#1096).
 */
export interface DashboardCoreData {
  xp: number;
  level: number;
  streak: StreakData;
  achievementsCount: number;
  /** Full content _ids of achievements unlocked by this user. */
  unlockedAchievementIds: string[];
  /** All achievements from the content bundle — single source of truth for catalog. */
  achievementCatalog: DeployedAchievement[];
  currentCourses: CurrentCourse[];
  /** Next-incomplete-lesson derivation for the hero Continue card (LX-B2). */
  continueTarget: ContinueTarget | null;
  recommendedCourses: RecommendedCourse[];
  recentActivity: ActivityItem[];
  /**
   * Recent surprise-bonus xp_transactions rows, handed to the client
   * celebration island so the #790 poll-path toasts keep firing (the dedupe
   * seen-set lives in the browser's sessionStorage, so the pick must stay
   * client-side).
   */
  surpriseBonusRows: XpTransactionRow[];
}
