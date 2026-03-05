import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// -- User Profiles --

export type UserProfileRow = {
  wallet: string;
  display_name: string | null;
  bio: string | null;
  twitter: string | null;
  github: string | null;
  xp: number;
  level: number;
  streak: number;
  show_in_leaderboard: boolean;
  profile_public: boolean;
  created_at: string;
};

// -- Courses --

export type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  lesson_count: number;
  duration_minutes: number;
  xp_reward: number;
  order_index: number;
  is_published: boolean;
};

// -- Quiz Questions --

export type QuizQuestionRow = {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  category: string;
  difficulty: string;
  is_active: boolean;
};

// -- Achievements --

export type AchievementRow = {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

// -- XP Transactions --

export type XpTransactionRow = {
  id: string;
  user_wallet: string;
  amount: number;
  reason: string;
  created_at: string;
};

export type Thread = {
  id: string;
  title: string;
  body: string;
  author_wallet: string;
  author_name: string | null;
  author_avatar: string | null;
  locale: string;
  tags: string[];
  upvotes: number;
  views: number;
  is_pinned: boolean;
  is_solved: boolean;
  bounty_usdc: number;
  created_at: string;
};

export type Reply = {
  id: string;
  thread_id: string;
  body: string;
  author_wallet: string;
  author_name: string | null;
  upvotes: number;
  is_accepted: boolean;
  created_at: string;
};

export type PracticeChallenge = {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  xp_reward: number;
  starter_code: string;
  test_cases: { input: unknown; expected: unknown; hidden: boolean }[];
  hints: string[];
  order_index: number;
};
