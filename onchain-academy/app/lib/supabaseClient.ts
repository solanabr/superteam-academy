/**
 * lib/supabaseClient.ts
 *
 * A single Supabase client instance shared across the entire frontend.
 * Import this wherever you need DB access — never create a second client.
 *
 * Environment variables required in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL          — the project API URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY     — the public anon/publishable key
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─── Type definitions matching the database schema ─────────────────────────────
// These mirror the exact column names in Supabase so auto-complete works.

export interface DbUserProfile {
  id: string;                        // wallet address (primary key)
  display_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  email: string | null;
  preferred_language: 'en' | 'pt-br' | 'es';
  total_xp: number;
  level: number;
  streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  achievements: string[];
  created_at: string;
  updated_at: string;
}

export interface DbLessonCompletion {
  id: number;
  user_id: string;
  course_id: string;
  module_id: string;
  lesson_id: string;
  xp_earned: number;
  completed_at: string;
}

export interface DbCourseEnrollment {
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string | null;
}

export interface DbLeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  wallet_address: string | null;
  total_xp: number;
  level: number;
  streak: number;
  completed_lessons: number;
  completed_courses: number;
  achievement_count: number;
}

export interface DbXpTransaction {
  id: number;
  user_id: string;
  amount: number;
  reason: string;
  reference_id: string | null;
  created_at: string;
}

export interface DbUserAchievement {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface Database {
  public: {
    Tables: {
      user_profiles:     { Row: DbUserProfile };
      lesson_completions: { Row: DbLessonCompletion };
      course_enrollments: { Row: DbCourseEnrollment };
      xp_transactions:   { Row: DbXpTransaction };
      user_achievements:  { Row: DbUserAchievement };
    };
    Views: {
      leaderboard: { Row: DbLeaderboardEntry };
    };
  };
}

// ─── Singleton factory ─────────────────────────────────────────────────────────

let _client: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      '[supabaseClient] Missing environment variables.\n' +
      'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
    );
  }

  _client = createClient<Database>(url, key, {
    auth: {
      // We don't use Supabase Auth — wallet address is the identity.
      // Disable session persistence to avoid stale auth state.
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-application-name': 'superteam-academy',
      },
    },
  });

  return _client;
}

// Convenience re-export so callers can just do:
//   import { supabase } from '@/lib/supabaseClient';
export const supabase = (() => {
  // Lazily initialised — safe to import at module level in Next.js
  if (typeof window === 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // Build-time safety: return a stub that will throw at runtime if misconfigured
    return null as unknown as SupabaseClient<Database>;
  }
  try {
    return getSupabaseClient();
  } catch {
    return null as unknown as SupabaseClient<Database>;
  }
})();
