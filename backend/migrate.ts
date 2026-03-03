import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateData() {
  try {
    // Open SQLite database
    const sqliteDb = await open({
      filename: './academy.db',
      driver: sqlite3.Database,
    })

    console.log('📦 Starting migration from SQLite to Supabase...\n')

    // Migrate users
    const users = await sqliteDb.all('SELECT * FROM users')
    if (users.length > 0) {
      console.log(`📤 Migrating ${users.length} users...`)
      const { error } = await supabase.from('users').insert(users)
      if (error) console.error('❌ Users error:', error)
      else console.log('✅ Users migrated')
    }

    // Migrate enrollments
    const enrollments = await sqliteDb.all('SELECT * FROM enrollments')
    if (enrollments.length > 0) {
      console.log(`📤 Migrating ${enrollments.length} enrollments...`)
      const { error } = await supabase.from('enrollments').insert(enrollments)
      if (error) console.error('❌ Enrollments error:', error)
      else console.log('✅ Enrollments migrated')
    }

    // Migrate lesson_progress
    const lessonProgress = await sqliteDb.all('SELECT * FROM lesson_progress')
    if (lessonProgress.length > 0) {
      console.log(`📤 Migrating ${lessonProgress.length} lesson progress records...`)
      const { error } = await supabase.from('lesson_progress').insert(lessonProgress)
      if (error) console.error('❌ Lesson progress error:', error)
      else console.log('✅ Lesson progress migrated')
    }

    // Migrate achievements
    const achievements = await sqliteDb.all('SELECT * FROM achievements')
    if (achievements.length > 0) {
      console.log(`📤 Migrating ${achievements.length} achievements...`)
      const { error } = await supabase.from('achievements').insert(achievements)
      if (error) console.error('❌ Achievements error:', error)
      else console.log('✅ Achievements migrated')
    }

    // Migrate user_achievements
    const userAchievements = await sqliteDb.all('SELECT * FROM user_achievements')
    if (userAchievements.length > 0) {
      console.log(`📤 Migrating ${userAchievements.length} user achievements...`)
      const { error } = await supabase.from('user_achievements').insert(userAchievements)
      if (error) console.error('❌ User achievements error:', error)
      else console.log('✅ User achievements migrated')
    }

    // Migrate streaks
    const streaks = await sqliteDb.all('SELECT * FROM streaks')
    if (streaks.length > 0) {
      console.log(`📤 Migrating ${streaks.length} streaks...`)
      const { error } = await supabase.from('streaks').insert(streaks)
      if (error) console.error('❌ Streaks error:', error)
      else console.log('✅ Streaks migrated')
    }

    // Migrate streak_history
    const streakHistory = await sqliteDb.all('SELECT * FROM streak_history')
    if (streakHistory.length > 0) {
      console.log(`📤 Migrating ${streakHistory.length} streak history records...`)
      const { error } = await supabase.from('streak_history').insert(streakHistory)
      if (error) console.error('❌ Streak history error:', error)
      else console.log('✅ Streak history migrated')
    }

    // Migrate auth_providers
    const authProviders = await sqliteDb.all('SELECT * FROM auth_providers')
    if (authProviders.length > 0) {
      console.log(`📤 Migrating ${authProviders.length} auth providers...`)
      const { error } = await supabase.from('auth_providers').insert(authProviders)
      if (error) console.error('❌ Auth providers error:', error)
      else console.log('✅ Auth providers migrated')
    }

    // Migrate xp_transactions
    const xpTransactions = await sqliteDb.all('SELECT * FROM xp_transactions')
    if (xpTransactions.length > 0) {
      console.log(`📤 Migrating ${xpTransactions.length} XP transactions...`)
      const { error } = await supabase.from('xp_transactions').insert(xpTransactions)
      if (error) console.error('❌ XP transactions error:', error)
      else console.log('✅ XP transactions migrated')
    }

    console.log('\n✅ Migration complete!')
    await sqliteDb.close()
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrateData()
