import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyXP() {
  console.log('🔍 Verifying XP award...\n')

  try {
    // Check user's updated XP
    const { data: user } = await supabase
      .from('users')
      .select('id, display_name, total_xp, level')
      .eq('id', 'user-1')
      .single()

    console.log('👤 User Data:')
    console.log(`   ID: ${user?.id}`)
    console.log(`   Name: ${user?.display_name}`)
    console.log(`   Total XP: ${user?.total_xp}`)
    console.log(`   Level: ${user?.level}\n`)

    // Check enrollment XP
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, course_id, total_xp_earned, lessons_completed')
      .eq('user_id', 'user-1')
      .single()

    console.log('📚 Enrollment Data:')
    console.log(`   Enrollment ID: ${enrollment?.id}`)
    console.log(`   Course: ${enrollment?.course_id}`)
    console.log(`   XP Earned: ${enrollment?.total_xp_earned}`)
    console.log(`   Lessons Completed: ${enrollment?.lessons_completed}\n`)

    // Check lesson progress
    const { data: lessons } = await supabase
      .from('lesson_progress')
      .select('id, lesson_id, xp_earned, completed_at')
      .eq('user_id', 'user-1')

    console.log('✅ Lesson Progress:')
    lessons?.forEach(lesson => {
      console.log(`   Lesson ${lesson.lesson_id}:`)
      console.log(`     - XP Earned: ${lesson.xp_earned}`)
      console.log(`     - Completed: ${lesson.completed_at}`)
    })

    console.log('\n✨ Dashboard will now show:')
    console.log(`   📊 Total XP: ${user?.total_xp}`)
    console.log(`   🎯 Level: ${user?.level}`)
    console.log(`   🎓 Lessons: ${enrollment?.lessons_completed}`)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

verifyXP()
