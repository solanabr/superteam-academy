export type Locale = "en" | "pt-BR" | "es";

export type Difficulty = 1 | 2 | 3;

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
};

export const TRACK_LABELS: Record<number, string> = {
  1: "Core Solana",
  2: "DeFi",
  3: "NFTs & Gaming",
  4: "Infrastructure",
  5: "Security",
};

export interface UserProfile {
  id: string;
  wallet_address: string | null;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  github_username: string | null;
  twitter_handle: string | null;
  preferred_locale: Locale;
  created_at: string;
  updated_at: string;
}

export interface StreakData {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  streak_start_date: string;
}

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  action: "lesson_completed" | "course_enrolled" | "course_finalized" | "credential_issued" | "achievement_earned" | "xp_earned";
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CourseProgress {
  user_id: string;
  course_id: string;
  enrollment_pda: string;
  completed_lessons: number;
  total_lessons: number;
  is_finalized: boolean;
  credential_address: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface ForumThread {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  body: string;
  is_solved: boolean;
  reply_count: number;
  created_at: string;
  updated_at: string;
}

export interface ForumReply {
  id: string;
  thread_id: string;
  user_id: string;
  body: string;
  is_solution: boolean;
  created_at: string;
}
