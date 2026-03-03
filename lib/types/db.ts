/**
 * Shared database row types for Supabase queries.
 * These replace `as any` casts on untyped Supabase query results.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

// Re-export for convenience
export type { SupabaseClient }

// ─── Generic Supabase Query Result ────────────────────────────────
/** Use this to cast untyped Supabase `.maybeSingle()` / `.single()` results. */
export interface DbResult<T> {
  data: T | null
  error: { message: string; code?: string } | null
}

/** Use this to cast untyped Supabase `.select()` list results. */
export interface DbListResult<T> {
  data: T[] | null
  error: { message: string; code?: string } | null
}

// ─── Row Interfaces ───────────────────────────────────────────────

export interface UserRow {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  wallet_address: string | null
  total_xp: number
  level: number
  current_streak: number
  longest_streak: number
  created_at: string
}

export interface UserXpRow {
  total_xp: number
  level?: number
}

export interface EnrollmentRow {
  id: string
  course_id: string
  user_id: string
  total_xp_earned: number
  xp_earned?: number
  lessons_completed: number
  enrolled_at: string
  completed_at: string | null
}

export interface EnrollmentCompletionRow {
  id: string
  lessons_completed: number
  completed_at: string | null
}

export interface CourseRow {
  id: string
  total_lessons: number
  xp_reward: number
  title: string
}

export interface CredentialRow {
  id: string
  asset_id: string
}

export interface HeliusTokenBalance {
  uiAmount?: number | null
  uiAmountString?: string | null
  amount?: string | number | null
  decimals?: number | null
}
