import { createClient } from '@supabase/supabase-js'

let db: ReturnType<typeof createClient> | null = null

/**
 * Get or initialize the Supabase database client (server-side only).
 * Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for full access.
 */
export function getDatabase() {
  if (db) return db

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  db = createClient(supabaseUrl, supabaseKey)
  return db
}
