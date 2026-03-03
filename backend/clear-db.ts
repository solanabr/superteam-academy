import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const db = createClient(supabaseUrl, supabaseKey)

async function clearDatabase() {
  try {
    console.log('🗑️  Clearing database...')

    // Delete all enrollments
    const { error: e1 } = await db.from('enrollments').delete().neq('id', '')
    if (e1) console.error('Error deleting enrollments:', e1)
    else console.log('✅ Deleted enrollments')

    // Delete all lesson_progress
    const { error: e2 } = await db.from('lesson_progress').delete().neq('id', '')
    if (e2) console.error('Error deleting lesson_progress:', e2)
    else console.log('✅ Deleted lesson_progress')

    // Delete all user_achievements
    const { error: e3 } = await db.from('user_achievements').delete().neq('id', '')
    if (e3) console.error('Error deleting user_achievements:', e3)
    else console.log('✅ Deleted user_achievements')

    // Delete all xp_transactions
    const { error: e4 } = await db.from('xp_transactions').delete().neq('id', '')
    if (e4) console.error('Error deleting xp_transactions:', e4)
    else console.log('✅ Deleted xp_transactions')

    // Delete all streaks
    const { error: e5 } = await db.from('streaks').delete().neq('id', '')
    if (e5) console.error('Error deleting streaks:', e5)
    else console.log('✅ Deleted streaks')

    // Delete all auth_providers
    const { error: e6 } = await db.from('auth_providers').delete().neq('id', '')
    if (e6) console.error('Error deleting auth_providers:', e6)
    else console.log('✅ Deleted auth_providers')

    // Delete all users
    const { error: e7 } = await db.from('users').delete().neq('id', '')
    if (e7) console.error('Error deleting users:', e7)
    else console.log('✅ Deleted users')

    console.log('\n✅ Database cleared successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

clearDatabase()
