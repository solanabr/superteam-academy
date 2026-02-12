export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  wallet_address: string | null;
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  preferred_language: string;
};

export type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  xp_earned: number;
  started_at: string;
  completed_at: string | null;
};
