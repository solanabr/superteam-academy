import { createClient } from '@supabase/supabase-js'

let db: ReturnType<typeof createClient> | null = null

export async function initializeDatabase() {
  if (db) return db

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  db = createClient(supabaseUrl, supabaseKey)
  console.log('✅ Supabase database initialized')

  return db
}

export function getDatabase() {
  if (!db) throw new Error('Database not initialized. Call initializeDatabase() first.')
  return db
}

export async function closeDatabase() {
  db = null
}
