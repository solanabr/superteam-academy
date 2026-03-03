import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  test_cases: { input: any; expected: any; hidden: boolean }[];
  hints: string[];
  order_index: number;
};
